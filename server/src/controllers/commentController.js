const Comment = require('../models/Comment');
const Recipe = require('../models/Recipe');
const { HttpError } = require('../middleware/error');
const wrap = require('../utils/wrap');

// GET /api/recipes/:id/comments
exports.listByRecipe = wrap(async (req, res) => {
  const comments = await Comment.find({ recipe: req.params.id }).sort({ createdAt: -1 }).populate('user', 'name');
  res.json(comments);
});

// POST /api/recipes/:id/comments
exports.create = wrap(async (req, res) => {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content) throw new HttpError(400, 'Nội dung bình luận không được để trống');
  const found = await Recipe.exists({ _id: req.params.id });
  if (!found) throw new HttpError(404, 'Không tìm thấy công thức');
  const comment = await Comment.create({ recipe: found._id, user: req.user._id, content });
  await comment.populate('user', 'name');
  res.status(201).json(comment);
});

// PUT /api/comments/:id  (chỉ chủ bình luận được sửa)
exports.update = wrap(async (req, res) => {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content) throw new HttpError(400, 'Nội dung bình luận không được để trống');
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new HttpError(404, 'Không tìm thấy bình luận');
  if (!comment.user.equals(req.user._id)) {
    throw new HttpError(403, 'Bạn chỉ được sửa bình luận của mình');
  }
  comment.content = content;
  await comment.save();
  await comment.populate('user', 'name');
  res.json(comment);
});

// DELETE /api/comments/:id  (chủ bình luận hoặc admin)
exports.remove = wrap(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new HttpError(404, 'Không tìm thấy bình luận');
  if (!comment.user.equals(req.user._id) && req.user.role !== 'admin') {
    throw new HttpError(403, 'Bạn chỉ được xóa bình luận của mình');
  }
  await comment.deleteOne();
  res.json({ message: 'Đã xóa bình luận' });
});
