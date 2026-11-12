const router = require('express').Router();
const ctrl = require('../controllers/recipeController');
const comments = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.get('/', ctrl.list);
router.post('/', protect, ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

router.post('/:id/like', protect, ctrl.toggleLike);
router.post('/:id/rate', protect, ctrl.rate);
router.post('/:id/save', protect, ctrl.toggleSave);

router.get('/:id/comments', comments.listByRecipe);
router.post('/:id/comments', protect, comments.create);

module.exports = router;
