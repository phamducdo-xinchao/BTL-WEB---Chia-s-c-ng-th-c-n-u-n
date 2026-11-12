const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HttpError } = require('./error');
const wrap = require('../utils/wrap');

// Bắt buộc đăng nhập: đọc token ở header "Authorization: Bearer <token>"
const protect = wrap(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Bạn cần đăng nhập');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new HttpError(401, 'Tài khoản không còn tồn tại');
  req.user = user;
  next();
});

// Phân quyền theo vai trò: requireRole('admin')
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new HttpError(403, 'Bạn không có quyền thực hiện'));

module.exports = { protect, requireRole };
