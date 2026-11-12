// Thanh toán online MÔ PHỎNG. Mô hình giống cổng thật (VNPay, MoMo):
//   1. Server tạo "phiên thanh toán" có chữ ký (HMAC) gồm mã đơn, số tiền, hạn dùng.
//   2. Trang cổng giả lập gửi lại phiên + kết quả.
//   3. Server tự kiểm tra chữ ký và số tiền rồi mới ghi nhận. Trình duyệt không thể tự sửa số tiền.
// Khi cắm cổng thật, chỉ cần thay hai hàm này bằng chữ ký của cổng đó.
const crypto = require('crypto');

const TTL_MS = 10 * 60 * 1000; // phiên có hiệu lực 10 phút

const sign = (data) => crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest('hex');

function createSession(order) {
  const expires = Date.now() + TTL_MS;
  const data = `${order._id}.${order.total}.${expires}`;
  return { token: `${data}.${sign(data)}`, amount: order.total, expiresAt: new Date(expires).toISOString() };
}

// Trả về true nếu phiên đúng chữ ký, đúng đơn, đúng số tiền và chưa hết hạn
function verifySession(token, order) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [orderId, amount, expires, signature] = parts;
  const expected = sign(`${orderId}.${amount}.${expires}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return orderId === String(order._id) && Number(amount) === order.total && Date.now() < Number(expires);
}

module.exports = { createSession, verifySession };
