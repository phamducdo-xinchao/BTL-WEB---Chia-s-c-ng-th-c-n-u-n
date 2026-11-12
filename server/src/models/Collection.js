const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Vui lòng nhập tên bộ sưu tập'], trim: true, maxlength: [60, 'Tên tối đa 60 ký tự'] },
    description: { type: String, trim: true, maxlength: [300, 'Mô tả tối đa 300 ký tự'], default: '' },
    // Quan hệ: bộ sưu tập thuộc về 1 user, chứa nhiều recipe
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Collection', collectionSchema);
