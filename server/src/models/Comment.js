const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    // Quan hệ: comment thuộc về 1 recipe và do 1 user viết
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: [true, 'Nội dung bình luận không được để trống'], trim: true, maxlength: [500, 'Bình luận tối đa 500 ký tự'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
