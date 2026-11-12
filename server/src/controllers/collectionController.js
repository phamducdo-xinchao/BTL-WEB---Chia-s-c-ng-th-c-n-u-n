const Collection = require('../models/Collection');
const Recipe = require('../models/Recipe');
const { HttpError } = require('../middleware/error');
const wrap = require('../utils/wrap');

// Lấy bộ sưu tập và kiểm tra quyền: chỉ chủ sở hữu được thao tác
async function findOwned(id, user) {
  const col = await Collection.findById(id);
  if (!col) throw new HttpError(404, 'Không tìm thấy bộ sưu tập');
  if (!col.owner.equals(user._id)) throw new HttpError(403, 'Đây không phải bộ sưu tập của bạn');
  return col;
}

const summary = (c) => ({ _id: c._id, name: c.name, description: c.description, count: c.recipes.length, createdAt: c.createdAt });

// GET /api/collections : bộ sưu tập của tôi
exports.listMine = wrap(async (req, res) => {
  const cols = await Collection.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(cols.map(summary));
});

// POST /api/collections
exports.create = wrap(async (req, res) => {
  const { name, description } = req.body;
  const col = await Collection.create({ name, description, owner: req.user._id });
  res.status(201).json(summary(col));
});

// GET /api/collections/:id : chi tiết kèm danh sách công thức
exports.getOne = wrap(async (req, res) => {
  const col = await findOwned(req.params.id, req.user);
  await col.populate({ path: 'recipes', select: '-likes -steps -ingredients', populate: { path: 'author', select: 'name' } });
  res.json({ ...summary(col), recipes: col.recipes });
});

// PUT /api/collections/:id
exports.update = wrap(async (req, res) => {
  const col = await findOwned(req.params.id, req.user);
  if (req.body.name !== undefined) col.name = req.body.name;
  if (req.body.description !== undefined) col.description = req.body.description;
  await col.save();
  res.json(summary(col));
});

// DELETE /api/collections/:id
exports.remove = wrap(async (req, res) => {
  const col = await findOwned(req.params.id, req.user);
  await col.deleteOne();
  res.json({ message: 'Đã xóa bộ sưu tập' });
});

// POST /api/collections/:id/recipes  { recipeId }
exports.addRecipe = wrap(async (req, res) => {
  const col = await findOwned(req.params.id, req.user);
  const recipeId = req.body.recipeId;
  if (!recipeId) throw new HttpError(400, 'Thiếu recipeId');
  if (!(await Recipe.exists({ _id: recipeId }))) throw new HttpError(404, 'Không tìm thấy công thức');
  await Collection.updateOne({ _id: col._id }, { $addToSet: { recipes: recipeId } });
  res.status(201).json({ message: 'Đã thêm vào bộ sưu tập' });
});

// DELETE /api/collections/:id/recipes/:recipeId
exports.removeRecipe = wrap(async (req, res) => {
  const col = await findOwned(req.params.id, req.user);
  await Collection.updateOne({ _id: col._id }, { $pull: { recipes: req.params.recipeId } });
  res.json({ message: 'Đã gỡ khỏi bộ sưu tập' });
});
