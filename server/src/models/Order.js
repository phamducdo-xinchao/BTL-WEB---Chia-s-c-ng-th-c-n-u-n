const mongoose = require('mongoose');

const STATUSES = ['pending', 'shipping', 'done', 'cancelled'];

// Mỗi dòng hàng lưu lại tên và giá tại thời điểm mua để đơn cũ không đổi khi admin sửa giá
const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unit: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, max: 99 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    // Quan hệ: đơn thuộc về 1 user
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [itemSchema], validate: [(v) => v.length > 0, 'Đơn hàng cần ít nhất 1 sản phẩm'] },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },

    receiverName: { type: String, required: [true, 'Vui lòng nhập tên người nhận'], trim: true, maxlength: [60, 'Tên người nhận tối đa 60 ký tự'] },
    phone: { type: String, required: [true, 'Vui lòng nhập số điện thoại'], trim: true, match: [/^(0|\+84)\d{9,10}$/, 'Số điện thoại không hợp lệ'] },
    deliveryMethod: { type: String, enum: { values: ['delivery', 'pickup'], message: 'Hình thức nhận hàng không hợp lệ' }, required: true },
    province: { type: String, required: [true, 'Vui lòng chọn tỉnh thành'] },
    address: { type: String, trim: true, maxlength: [200, 'Địa chỉ tối đa 200 ký tự'], default: '' },
    pickupPoint: { type: String, default: '' }, // id điểm nhận hàng
    note: { type: String, trim: true, maxlength: [300, 'Ghi chú tối đa 300 ký tự'], default: '' },

    paymentMethod: { type: String, enum: { values: ['cod', 'online'], message: 'Phương thức thanh toán không hợp lệ' }, required: true },
    // unpaid: chưa trả | paid: đã trả | failed: thanh toán online thất bại | refunded: đã hoàn (hủy đơn đã trả)
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid' },
    paidAt: Date,

    status: { type: String, enum: STATUSES, default: 'pending', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.STATUSES = STATUSES;
