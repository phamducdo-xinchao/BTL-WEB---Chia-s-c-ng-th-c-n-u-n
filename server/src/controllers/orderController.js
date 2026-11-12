const Order = require('../models/Order');
const Product = require('../models/Product');
const { STATUSES } = require('../models/Order');
const { HttpError } = require('../middleware/error');
const wrap = require('../utils/wrap');
const shop = require('../utils/shop');
const payment = require('../utils/payment');

const makeCode = () => 'GB' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 36 ** 2).toString(36).toUpperCase().padStart(2, '0');

// Trả lại hàng vào kho (khi đặt lỗi hoặc hủy đơn)
const restock = (items) => Promise.all(items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })));

// Gộp các dòng trùng sản phẩm và kiểm tra dạng dữ liệu
function parseItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) throw new HttpError(400, 'Giỏ hàng đang trống');
  if (raw.length > 30) throw new HttpError(400, 'Mỗi đơn tối đa 30 sản phẩm');
  const map = new Map();
  for (const it of raw) {
    const qty = Number(it?.qty);
    if (!it?.productId || !Number.isInteger(qty) || qty < 1 || qty > 99) throw new HttpError(400, 'Số lượng mỗi sản phẩm phải từ 1 đến 99');
    map.set(String(it.productId), Math.min((map.get(String(it.productId)) || 0) + qty, 99));
  }
  return [...map];
}

// Quyền xem: chủ đơn hoặc admin
async function findVisible(id, user) {
  const order = await Order.findById(id).populate('user', 'name email');
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (user.role !== 'admin' && !order.user?._id?.equals(user._id)) throw new HttpError(403, 'Đây không phải đơn hàng của bạn');
  return order;
}

// POST /api/orders : đặt hàng. Giá, phí ship và tồn kho đều do server tính từ CSDL
exports.create = wrap(async (req, res) => {
  const b = req.body;
  const entries = parseItems(b.items);

  if (!['delivery', 'pickup'].includes(b.deliveryMethod)) throw new HttpError(400, 'Hình thức nhận hàng không hợp lệ');
  if (!['cod', 'online'].includes(b.paymentMethod)) throw new HttpError(400, 'Phương thức thanh toán không hợp lệ');

  let province = b.province;
  let address = typeof b.address === 'string' ? b.address.trim() : '';
  let pickupPoint = '';
  if (b.deliveryMethod === 'pickup') {
    const point = shop.PICKUP_POINTS.find((p) => p.id === b.pickupPoint);
    if (!point) throw new HttpError(400, 'Vui lòng chọn điểm nhận hàng');
    pickupPoint = point.id;
    province = point.province;
    address = `${point.name} (${point.address})`;
  } else {
    if (!shop.PROVINCES.includes(province)) throw new HttpError(400, 'Vui lòng chọn tỉnh thành');
    if (address.length < 5) throw new HttpError(400, 'Vui lòng nhập địa chỉ giao hàng (số nhà, đường, phường/xã)');
  }

  // Lấy sản phẩm thật từ CSDL, không tin giá và tên do trình duyệt gửi
  const products = await Product.find({ _id: { $in: entries.map(([id]) => id) }, active: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const items = entries.map(([id, qty]) => {
    const p = byId.get(id);
    if (!p) throw new HttpError(400, 'Có sản phẩm không còn bán, vui lòng kiểm tra lại giỏ hàng');
    return { product: p._id, name: p.name, unit: p.unit, price: p.price, qty };
  });

  // Giữ hàng: trừ kho nguyên tử (chỉ trừ khi còn đủ). Thiếu một món thì trả lại các món đã trừ
  const reserved = [];
  for (const it of items) {
    const r = await Product.updateOne({ _id: it.product, stock: { $gte: it.qty } }, { $inc: { stock: -it.qty } });
    if (r.modifiedCount === 0) {
      await restock(reserved);
      throw new HttpError(409, `"${it.name}" không đủ hàng, vui lòng giảm số lượng`);
    }
    reserved.push(it);
  }

  try {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const fee = shop.shippingFee({ subtotal, deliveryMethod: b.deliveryMethod, province });
    const order = await Order.create({
      code: makeCode(), user: req.user._id, items, subtotal, shippingFee: fee, total: subtotal + fee,
      receiverName: b.receiverName, phone: b.phone, deliveryMethod: b.deliveryMethod, province, address, pickupPoint,
      note: b.note, paymentMethod: b.paymentMethod,
    });
    res.status(201).json(order);
  } catch (err) {
    await restock(reserved); // lưu đơn lỗi (ví dụ sai số điện thoại) thì trả hàng về kho
    throw err;
  }
});

// GET /api/orders : đơn của tôi
exports.listMine = wrap(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
});

// GET /api/orders/:id
exports.getOne = wrap(async (req, res) => res.json(await findVisible(req.params.id, req.user)));

// POST /api/orders/:id/cancel : khách chỉ hủy được khi đơn còn chờ xác nhận
exports.cancel = wrap(async (req, res) => {
  const order = await findVisible(req.params.id, req.user);
  if (!order.user?._id?.equals(req.user._id)) throw new HttpError(403, 'Đây không phải đơn hàng của bạn');
  if (order.status !== 'pending') throw new HttpError(400, 'Đơn đã được xác nhận nên không thể tự hủy, vui lòng liên hệ cửa hàng');
  await cancelOrder(order);
  res.json(order);
});

async function cancelOrder(order) {
  await restock(order.items);
  order.status = 'cancelled';
  if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded'; // mô phỏng hoàn tiền
  await order.save();
}

// POST /api/orders/:id/payment-session : bắt đầu thanh toán online, server cấp phiên có chữ ký
exports.paymentSession = wrap(async (req, res) => {
  const order = await findOwnPayable(req);
  res.json(payment.createSession(order));
});

// POST /api/orders/:id/payment-result { token, success } : trang cổng giả lập báo kết quả
exports.paymentResult = wrap(async (req, res) => {
  const order = await findOwnPayable(req);
  if (!payment.verifySession(req.body.token, order)) throw new HttpError(400, 'Phiên thanh toán không hợp lệ hoặc đã hết hạn');
  if (req.body.success === true) {
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
  } else {
    order.paymentStatus = 'failed';
  }
  await order.save();
  res.json(order);
});

async function findOwnPayable(req) {
  const order = await findVisible(req.params.id, req.user);
  if (!order.user?._id?.equals(req.user._id)) throw new HttpError(403, 'Đây không phải đơn hàng của bạn');
  if (order.paymentMethod !== 'online') throw new HttpError(400, 'Đơn này thanh toán khi nhận hàng');
  if (order.status !== 'pending') throw new HttpError(400, 'Đơn không còn ở trạng thái chờ xác nhận');
  if (order.paymentStatus === 'paid') throw new HttpError(400, 'Đơn đã được thanh toán');
  return order;
}

// ---- Dành cho admin ----

// GET /api/orders/admin/all?status=
exports.listAll = wrap(async (req, res) => {
  const filter = STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
  res.json(await Order.find(filter).sort({ createdAt: -1 }).limit(200).populate('user', 'name email'));
});

// Chuyển trạng thái hợp lệ: chờ -> đang giao -> hoàn thành; chờ hoặc đang giao -> hủy
const NEXT = { pending: ['shipping', 'cancelled'], shipping: ['done', 'cancelled'], done: [], cancelled: [] };

// PUT /api/orders/admin/:id/status { status }
exports.updateStatus = wrap(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Trạng thái không hợp lệ');
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new HttpError(404, 'Không tìm thấy đơn hàng');
  if (!NEXT[order.status].includes(status)) throw new HttpError(400, 'Không thể chuyển trạng thái này');
  if (status === 'cancelled') {
    await cancelOrder(order);
  } else {
    if (status === 'done') {
      // Thanh toán khi nhận hàng: giao xong thì coi như đã thu tiền
      if (order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
        order.paidAt = new Date();
      } else if (order.paymentStatus !== 'paid') {
        throw new HttpError(400, 'Đơn thanh toán online chưa được thanh toán nên chưa thể hoàn thành');
      }
    }
    order.status = status;
    await order.save();
  }
  res.json(order);
});

// Đơn thanh toán online quá 30 phút chưa trả tiền sẽ tự hủy để trả hàng về kho
const UNPAID_TTL_MS = 30 * 60 * 1000;
exports.expireUnpaidOrders = async () => {
  const cutoff = new Date(Date.now() - UNPAID_TTL_MS);
  const stale = await Order.find({ paymentMethod: 'online', status: 'pending', paymentStatus: { $in: ['unpaid', 'failed'] }, createdAt: { $lt: cutoff } }).select('_id');
  let count = 0;
  for (const o of stale) {
    // Chiếm đơn bằng một lệnh nguyên tử để không trả kho hai lần nếu khách vừa thanh toán hoặc hủy
    const claimed = await Order.findOneAndUpdate(
      { _id: o._id, status: 'pending', paymentStatus: { $in: ['unpaid', 'failed'] } },
      { status: 'cancelled' }
    );
    if (claimed) {
      await restock(claimed.items);
      count++;
    }
  }
  return count;
};
