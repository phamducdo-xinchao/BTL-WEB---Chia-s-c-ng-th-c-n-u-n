const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');
const Collection = require('../models/Collection');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { HttpError } = require('../middleware/error');
const wrap = require('../utils/wrap');

// GET /api/admin/stats
exports.stats = wrap(async (req, res) => {
  const [users, recipes, comments, byCategory, orders, pendingOrders, revenueAgg] = await Promise.all([
    User.countDocuments(),
    Recipe.countDocuments(),
    Comment.countDocuments(),
    Recipe.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
  ]);
  res.json({ users, recipes, comments, orders, pendingOrders, revenue: revenueAgg[0]?.total || 0, byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })) });
});

// GET /api/admin/users
exports.listUsers = wrap(async (req, res) => {
  const [users, counts] = await Promise.all([
    User.find().sort({ createdAt: -1 }).lean(),
    Recipe.aggregate([{ $group: { _id: '$author', n: { $sum: 1 } } }]),
  ]);
  const countOf = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json(
    users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      recipeCount: countOf.get(String(u._id)) || 0,
    }))
  );
});

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const ROLES = ['user', 'admin'];

// POST /api/admin/users : admin tạo tài khoản mới (được chọn vai trò)
exports.createUser = wrap(async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;
  if (!isText(name) || !isText(email) || !isText(password)) {
    throw new HttpError(400, 'Vui lòng nhập đủ tên, email và mật khẩu');
  }
  if (!ROLES.includes(role)) throw new HttpError(400, 'Vai trò không hợp lệ');
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    throw new HttpError(409, 'Email này đã được đăng ký');
  }
  const u = await User.create({ name, email, password, role });
  res.status(201).json({ id: String(u._id), name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, recipeCount: 0 });
});

// PUT /api/admin/users/:id : sửa tên, vai trò (và đặt lại mật khẩu nếu có gửi)
exports.updateUser = wrap(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) throw new HttpError(404, 'Không tìm thấy người dùng');
  const { name, role, password } = req.body;
  if (name !== undefined) {
    if (!isText(name)) throw new HttpError(400, 'Tên không được để trống');
    u.name = name;
  }
  if (role !== undefined) {
    if (!ROLES.includes(role)) throw new HttpError(400, 'Vai trò không hợp lệ');
    if (u._id.equals(req.user._id) && role !== u.role) {
      throw new HttpError(400, 'Bạn không thể tự đổi vai trò của chính mình');
    }
    u.role = role;
  }
  if (password) u.password = password; // pre('save') sẽ tự băm bằng bcrypt
  await u.save();
  const recipeCount = await Recipe.countDocuments({ author: u._id });
  res.json({ id: String(u._id), name: u.name, email: u.email, role: u.role, createdAt: u.createdAt, recipeCount });
});

// DELETE /api/admin/users/:id : xóa người dùng và dọn dữ liệu liên quan
exports.deleteUser = wrap(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) throw new HttpError(404, 'Không tìm thấy người dùng');
  if (u._id.equals(req.user._id)) throw new HttpError(400, 'Bạn không thể tự xóa tài khoản của mình');

  // Không xóa người còn đơn đang xử lý, tránh mất hàng đã giữ hoặc đơn đang giao
  if (await Order.exists({ user: u._id, status: { $in: ['pending', 'shipping'] } })) {
    throw new HttpError(409, 'Người dùng còn đơn hàng đang xử lý, hãy hoàn thành hoặc hủy các đơn đó trước');
  }

  // Công thức của người này kéo theo bình luận trên các công thức đó
  const myRecipes = await Recipe.find({ author: u._id }).distinct('_id');
  await Comment.deleteMany({ $or: [{ user: u._id }, { recipe: { $in: myRecipes } }] });
  await Recipe.deleteMany({ author: u._id });
  await User.updateMany({ savedRecipes: { $in: myRecipes } }, { $pull: { savedRecipes: { $in: myRecipes } } });
  // Gỡ lượt thích của người này ở các công thức còn lại
  await Recipe.updateMany({ likes: u._id }, { $pull: { likes: u._id }, $inc: { likesCount: -1 } });
  // Gỡ các đánh giá sao của người này rồi tính lại điểm trung bình
  for (const r of await Recipe.find({ 'ratings.user': u._id })) {
    r.ratings = r.ratings.filter((x) => !x.user.equals(u._id));
    r.recalcRating();
    await r.save();
  }
  await Product.updateMany({ recipes: { $in: myRecipes } }, { $pull: { recipes: { $in: myRecipes } } });
  await Collection.deleteMany({ owner: u._id });
  await Collection.updateMany({ recipes: { $in: myRecipes } }, { $pull: { recipes: { $in: myRecipes } } });
  await u.deleteOne();
  res.json({ message: 'Đã xóa người dùng' });
});
