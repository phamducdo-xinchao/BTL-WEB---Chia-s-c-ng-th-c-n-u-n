const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { HttpError } = require('../middleware/error');
const Collection = require('../models/Collection');
const Product = require('../models/Product');
const wrap = require('../utils/wrap');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toList = (v) => (Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : []);

// Chỉ lấy các trường cho phép từ body (tránh client tự gửi author, likes...)
function pickFields(body) {
  return {
    title: body.title,
    description: body.description,
    category: body.category,
    imageUrl: body.imageUrl,
    cookTime: body.cookTime,
    servings: body.servings,
    ingredients: toList(body.ingredients),
    steps: toList(body.steps),
  };
}

// Chỉ tác giả hoặc admin mới được sửa/xóa
function assertCanModify(recipe, user) {
  if (!recipe.author.equals(user._id) && user.role !== 'admin') {
    throw new HttpError(403, 'Bạn chỉ được sửa hoặc xóa công thức của mình');
  }
}

const SORTS = {
  newest: { createdAt: -1 },
  popular: { likesCount: -1, createdAt: -1 },
  quick: { cookTime: 1, createdAt: -1 },
  rating: { ratingAvg: -1, ratingCount: -1, createdAt: -1 },
  views: { views: -1, createdAt: -1 },
};

// GET /api/recipes?search=&category=&sort=&page=&limit=
exports.list = wrap(async (req, res) => {
  const { search, category, sort, exclude } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 9, 1), 30);

  const filter = {};
  if (typeof category === 'string' && category) filter.category = category;
  if (typeof exclude === 'string' && mongoose.isValidObjectId(exclude)) filter._id = { $ne: exclude };
  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: rx }, { ingredients: rx }];
  }

  const [recipes, total] = await Promise.all([
    Recipe.find(filter)
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-likes -steps -ingredients -ratings')
      .populate('author', 'name'),
    Recipe.countDocuments(filter),
  ]);

  res.json({ recipes, page, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

// GET /api/recipes/:id
exports.getOne = wrap(async (req, res) => {
  // Mỗi lần mở chi tiết thì tăng lượt xem lên 1
  const recipe = await Recipe.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).populate('author', 'name');
  if (!recipe) throw new HttpError(404, 'Không tìm thấy công thức');
  res.json(recipe);
});

// POST /api/recipes
exports.create = wrap(async (req, res) => {
  const recipe = await Recipe.create({ ...pickFields(req.body), author: req.user._id });
  res.status(201).json(recipe);
});

// PUT /api/recipes/:id (gửi đủ các trường)
exports.update = wrap(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) throw new HttpError(404, 'Không tìm thấy công thức');
  assertCanModify(recipe, req.user);
  recipe.set(pickFields(req.body));
  await recipe.save();
  res.json(recipe);
});

// DELETE /api/recipes/:id
exports.remove = wrap(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) throw new HttpError(404, 'Không tìm thấy công thức');
  assertCanModify(recipe, req.user);
  await recipe.deleteOne();
  // Dọn dữ liệu liên quan: bình luận và danh sách "đã lưu" của mọi user
  await Comment.deleteMany({ recipe: recipe._id });
  await User.updateMany({ savedRecipes: recipe._id }, { $pull: { savedRecipes: recipe._id } });
  await Collection.updateMany({ recipes: recipe._id }, { $pull: { recipes: recipe._id } });
  await Product.updateMany({ recipes: recipe._id }, { $pull: { recipes: recipe._id } });
  res.json({ message: 'Đã xóa công thức' });
});

// POST /api/recipes/:id/like  (bấm lần nữa sẽ bỏ thích)
exports.toggleLike = wrap(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) throw new HttpError(404, 'Không tìm thấy công thức');
  const liked = recipe.likes.some((id) => id.equals(req.user._id));
  if (liked) recipe.likes.pull(req.user._id);
  else recipe.likes.push(req.user._id);
  recipe.likesCount = recipe.likes.length;
  await recipe.save();
  res.json({ liked: !liked, likesCount: recipe.likesCount });
});

// POST /api/recipes/:id/save  (lưu / bỏ lưu)
exports.toggleSave = wrap(async (req, res) => {
  const found = await Recipe.exists({ _id: req.params.id });
  if (!found) throw new HttpError(404, 'Không tìm thấy công thức');
  const saved = req.user.savedRecipes.some((id) => id.equals(found._id));
  await User.updateOne(
    { _id: req.user._id },
    saved ? { $pull: { savedRecipes: found._id } } : { $addToSet: { savedRecipes: found._id } }
  );
  res.json({ saved: !saved });
});

// POST /api/recipes/:id/rate  { value: 1..5 }  (đánh giá lại sẽ thay điểm cũ)
exports.rate = wrap(async (req, res) => {
  const value = Number(req.body.value);
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new HttpError(400, 'Điểm đánh giá phải từ 1 đến 5');
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) throw new HttpError(404, 'Không tìm thấy công thức');
  if (recipe.author.equals(req.user._id)) throw new HttpError(403, 'Bạn không thể tự đánh giá công thức của mình');
  const mine = recipe.ratings.find((r) => r.user.equals(req.user._id));
  if (mine) mine.value = value;
  else recipe.ratings.push({ user: req.user._id, value });
  recipe.recalcRating();
  await recipe.save();
  res.json({ ratingAvg: recipe.ratingAvg, ratingCount: recipe.ratingCount, myRating: value });
});
