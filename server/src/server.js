require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');
const { expireUnpaidOrders } = require('./controllers/orderController');

if (!process.env.JWT_SECRET) {
  console.error('Thiếu JWT_SECRET trong file .env');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server chạy ở http://localhost:${PORT}`));
    // Mỗi 5 phút dọn các đơn online quá hạn chưa thanh toán (và một lần ngay khi khởi động)
    const sweep = () => expireUnpaidOrders().then((n) => n && console.log(`Đã tự hủy ${n} đơn quá hạn thanh toán`)).catch((e) => console.error('Lỗi dọn đơn quá hạn:', e.message));
    sweep();
    setInterval(sweep, 5 * 60 * 1000).unref();
  })
  .catch((err) => {
    console.error('Không kết nối được MongoDB:', err.message);
    process.exit(1);
  });
