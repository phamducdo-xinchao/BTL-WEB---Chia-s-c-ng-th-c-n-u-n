const mongoose = require('mongoose');

// Phải khớp với client/src/constants.js
const CATEGORIES = ['Món chính', 'Canh & súp', 'Món chay', 'Ăn vặt', 'Tráng miệng', 'Đồ uống'];

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Vui lòng nhập tên món'], trim: true, maxlength: [120, 'Tên món tối đa 120 ký tự'] },
    description: { type: String, trim: true, maxlength: [500, 'Mô tả tối đa 500 ký tự'], default: '' },
    category: { type: String, enum: { values: CATEGORIES, message: 'Danh mục không hợp lệ' }, required: [true, 'Vui lòng chọn danh mục'] },
    imageUrl: { type: String, trim: true, default: '', match: [/^(https?:\/\/\S+)?$/, 'Link ảnh phải bắt đầu bằng http:// hoặc https://'] },
    cookTime: { type: Number, required: [true, 'Vui lòng nhập thời gian nấu'], min: [1, 'Thời gian nấu tối thiểu 1 phút'], max: [1440, 'Thời gian nấu tối đa 1440 phút'] },
    servings: { type: Number, default: 2, min: [1, 'Khẩu phần tối thiểu 1'], max: [100, 'Khẩu phần tối đa 100'] },
    ingredients: { type: [String], validate: [(v) => v.length > 0, 'Cần ít nhất 1 nguyên liệu'] },
    steps: { type: [String], validate: [(v) => v.length > 0, 'Cần ít nhất 1 bước làm'] },
    // Quan hệ: recipe thuộc về 1 user (tác giả)
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Danh sách user đã thích; likesCount lưu sẵn để sắp xếp "phổ biến"
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    // Đánh giá sao: mỗi user chỉ 1 đánh giá; điểm trung bình lưu sẵn để sắp xếp
    ratings: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, value: { type: Number, min: 1, max: 5, required: true } }],
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Tính lại điểm trung bình (làm tròn 1 chữ số thập phân)
recipeSchema.methods.recalcRating = function () {
  this.ratingCount = this.ratings.length;
  const sum = this.ratings.reduce((s, r) => s + r.value, 0);
  this.ratingAvg = this.ratingCount ? Math.round((sum / this.ratingCount) * 10) / 10 : 0;
};

module.exports = mongoose.model('Recipe', recipeSchema);
module.exports.CATEGORIES = CATEGORIES;
