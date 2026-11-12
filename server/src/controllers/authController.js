const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HttpError } = require('../middleware/error');
const wrap = require('../utils/wrap');

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Chỉ trả những thông tin cần thiết, không bao giờ trả mật khẩu
const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  savedRecipes: u.savedRecipes.map(String),
});

const isText = (v) => typeof v === 'string' && v.trim() !== '';

// POST /api/auth/register
exports.register = wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!isText(name) || !isText(email) || !isText(password)) {
    throw new HttpError(400, 'Vui lòng nhập đủ tên, email và mật khẩu');
  }
  if (await User.exists({ email: email.toLowerCase().trim() })) {
    throw new HttpError(409, 'Email này đã được đăng ký');
  }
  // Không nhận "role" từ client: người đăng ký luôn là user thường
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
exports.login = wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!isText(email) || !isText(password)) {
    throw new HttpError(400, 'Vui lòng nhập email và mật khẩu');
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Email hoặc mật khẩu không đúng');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

exports.publicUser = publicUser;

// GET /api/auth/me
exports.me = (req, res) => res.json({ user: publicUser(req.user) });
