// Phải khớp với server/src/models/Recipe.js
export const CATEGORIES = ['Món chính', 'Canh & súp', 'Món chay', 'Ăn vặt', 'Tráng miệng', 'Đồ uống'];

// Biểu tượng và màu nền khi món chưa có ảnh
export const CATEGORY_STYLE = {
  'Món chính': { icon: '🍲', tint: '#f6d7c9' },
  'Canh & súp': { icon: '🥣', tint: '#f9e3a8' },
  'Món chay': { icon: '🥬', tint: '#cfe5cf' },
  'Ăn vặt': { icon: '🥟', tint: '#f3d9e0' },
  'Tráng miệng': { icon: '🍮', tint: '#e7dcf2' },
  'Đồ uống': { icon: '🧋', tint: '#cfe3ee' },
};

// ---- Cửa hàng ----
export const formatVND = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;

export const ORDER_STATUS = {
  pending: { label: 'Chờ xác nhận', tone: 'warn' },
  shipping: { label: 'Đang giao', tone: 'info' },
  done: { label: 'Hoàn thành', tone: 'ok' },
  cancelled: { label: 'Đã hủy', tone: 'bad' },
};
export const PAYMENT_STATUS = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warn' },
  paid: { label: 'Đã thanh toán', tone: 'ok' },
  failed: { label: 'Thanh toán thất bại', tone: 'bad' },
  refunded: { label: 'Đã hoàn tiền', tone: 'info' },
};
export const PAYMENT_METHOD = { cod: 'Thanh toán khi nhận hàng', online: 'Chuyển khoản qua mã QR' };
export const DELIVERY_METHOD = { delivery: 'Giao tận nơi', pickup: 'Nhận tại điểm' };
