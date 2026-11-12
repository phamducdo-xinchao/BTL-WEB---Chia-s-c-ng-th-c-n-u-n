const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI trong file .env');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Đã kết nối MongoDB');
}

module.exports = connectDB;
