// Bọc hàm async để lỗi tự chuyển sang errorHandler (Express 4 không tự bắt lỗi async)
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
