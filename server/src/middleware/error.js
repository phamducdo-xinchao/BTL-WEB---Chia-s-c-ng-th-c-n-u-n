// Lỗi có kèm mã trạng thái HTTP, ví dụ: throw new HttpError(404, 'Không tìm thấy')
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res, next) {
  next(new HttpError(404, `Không tìm thấy đường dẫn ${req.originalUrl}`));
}

// Middleware xử lý lỗi tập trung: luôn trả JSON { message }
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('; ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = err.kind === 'ObjectId' ? 'ID không hợp lệ' : 'Dữ liệu không hợp lệ';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Dữ liệu đã tồn tại';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON gửi lên không hợp lệ';
  }

  if (status === 500) {
    console.error(err);
    message = 'Lỗi máy chủ';
  }
  res.status(status).json({ message });
}

module.exports = { HttpError, notFound, errorHandler };
