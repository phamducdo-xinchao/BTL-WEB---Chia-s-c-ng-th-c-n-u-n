const mongoose = require('mongoose');

// Sản phẩm (nguyên liệu) do admin quản lý, có thể gắn vào nhiều công thức
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Vui lòng nhập tên sản phẩm'], trim: true, maxlength: [100, 'Tên sản phẩm tối đa 100 ký tự'] },
    description: { type: String, trim: true, maxlength: [300, 'Mô tả tối đa 300 ký tự'], default: '' },
    price: { type: Number, required: [true, 'Vui lòng nhập giá'], min: [0, 'Giá không được âm'], max: [100000000, 'Giá quá lớn'], validate: { validator: Number.isInteger, message: 'Giá phải là số nguyên (đồng)' } },
    unit: { type: String, trim: true, maxlength: [20, 'Đơn vị tối đa 20 ký tự'], default: 'phần' },
    emoji: { type: String, trim: true, maxlength: [8, 'Biểu tượng tối đa 8 ký tự'], default: '🧺' },
    imageUrl: { type: String, trim: true, default: '', match: [/^(https?:\/\/\S+)?$/, 'Link ảnh phải bắt đầu bằng http:// hoặc https://'] },
    stock: { type: Number, required: [true, 'Vui lòng nhập số lượng tồn'], min: [0, 'Số lượng tồn không được âm'], max: [100000, 'Số lượng tồn quá lớn'], validate: { validator: Number.isInteger, message: 'Số lượng tồn phải là số nguyên' } },
    active: { type: Boolean, default: true }, // false = ẩn khỏi cửa hàng
    // Quan hệ: sản phẩm gợi ý cho nhiều công thức
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', index: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
