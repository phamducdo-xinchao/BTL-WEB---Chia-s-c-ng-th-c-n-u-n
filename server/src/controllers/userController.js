const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { HttpError } = require('../middleware/error');
const { publicUser } = require('./authController');
const wrap = require('../utils/wrap');

// GET /api/users/me/recipes : công thức do tôi đăng
exports.myRecipes = wrap(async (req, res) => {
  const recipes = await Recipe.find({ author: req.user._id })
    .sort({ createdAt: -1 })
    .select('-likes -steps -ingredients')
    .populate('author', 'name');
  res.json(recipes);
});

// GET /api/users/me/saved : công thức tôi đã lưu
exports.mySaved = wrap(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'savedRecipes',
    select: '-likes -steps -ingredients',
    populate: { path: 'author', select: 'name' },
  });
  res.json(user.savedRecipes);
});

// PUT /api/users/me : đổi tên hiển thị
exports.updateMe = wrap(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) throw new HttpError(400, 'Tên không được để trống');
  req.user.name = name;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

// PUT /api/users/me/password : đổi mật khẩu (phải nhập đúng mật khẩu hiện tại)
exports.changePassword = wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new HttpError(400, 'Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw new HttpError(400, 'Mật khẩu hiện tại không đúng');
  user.password = newPassword; // pre('save') tự băm bằng bcrypt, và kiểm tra tối thiểu 6 ký tự
  await user.save();
  res.json({ message: 'Đã đổi mật khẩu' });
});
