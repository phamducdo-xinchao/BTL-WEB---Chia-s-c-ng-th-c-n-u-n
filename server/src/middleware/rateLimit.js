const rateLimit = require('express-rate-limit');

// Giới hạn số lần đăng nhập/đăng ký để chống dò mật khẩu
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { message: 'Thao tác quá nhiều lần, vui lòng thử lại sau 15 phút' },
});
