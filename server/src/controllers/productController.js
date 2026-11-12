const Product = require('../models/Product');
const Recipe = require('../models/Recipe');
const { HttpError } = require('../middleware/error');
const wrap = require('../utils/wrap');
const shop = require('../utils/shop');

const FIELDS = ['name', 'description', 'price', 'unit', 'emoji', 'imageUrl', 'stock', 'active'];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Chỉ nhận các công thức có thật, bỏ trùng
async function cleanRecipes(ids) {
  if (!Array.isArray(ids)) throw new HttpError(400, 'Danh sách công thức không hợp lệ');
  const found = await Recipe.find({ _id: { $in: ids } }).distinct('_id');
  return found;
}

// GET /api/products/config : tỉnh thành, điểm nhận hàng, mức phí
exports.config = (req, res) => res.json(shop.config());

// GET /api/products/shipping?subtotal=&deliveryMethod=&province= : báo phí ship (tính ở server)
exports.shipping = (req, res) => {
  const subtotal = Math.max(parseInt(req.query.subtotal) || 0, 0);
  res.json({ shippingFee: shop.shippingFee({ subtotal, deliveryMethod: req.query.deliveryMethod, province: req.query.province }) });
};

// GET /api/products?search=&recipe=&ids=a,b&page=&limit= : cửa hàng (chỉ sản phẩm đang bán)
exports.list = wrap(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);
  const filter = { active: true };
  if (req.query.search) filter.name = { $regex: escapeRegex(String(req.query.search).trim()), $options: 'i' };
  if (req.query.recipe) filter.recipes = req.query.recipe;
  if (req.query.ids) filter._id = { $in: String(req.query.ids).split(',').slice(0, 50) };
  const [products, total] = await Promise.all([
    Product.find(filter).select('-recipes').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ products, page, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

// GET /api/products/admin/all : admin xem cả sản phẩm đang ẩn, kèm công thức gắn
exports.listAll = wrap(async (req, res) => {
  res.json(await Product.find().sort({ createdAt: -1 }).populate('recipes', 'title'));
});

// GET /api/products/:id
exports.getOne = wrap(async (req, res) => {
  const p = await Product.findById(req.params.id).select('-recipes');
  if (!p || !p.active) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  res.json(p);
});

// POST /api/products (admin)
exports.create = wrap(async (req, res) => {
  const data = {};
  for (const f of FIELDS) if (req.body[f] !== undefined) data[f] = req.body[f];
  if (req.body.recipes !== undefined) data.recipes = await cleanRecipes(req.body.recipes);
  const p = await Product.create(data);
  res.status(201).json(await p.populate('recipes', 'title'));
});

// PUT /api/products/:id (admin)
exports.update = wrap(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  for (const f of FIELDS) if (req.body[f] !== undefined) p[f] = req.body[f];
  if (req.body.recipes !== undefined) p.recipes = await cleanRecipes(req.body.recipes);
  await p.save();
  res.json(await p.populate('recipes', 'title'));
});

// DELETE /api/products/:id (admin). Đơn cũ vẫn giữ nguyên vì đã lưu tên và giá tại lúc mua
exports.remove = wrap(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new HttpError(404, 'Không tìm thấy sản phẩm');
  await p.deleteOne();
  res.json({ message: 'Đã xóa sản phẩm' });
});
