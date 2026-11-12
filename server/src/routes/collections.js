const router = require('express').Router();
const ctrl = require('../controllers/collectionController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.listMine);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/recipes', ctrl.addRecipe);
router.delete('/:id/recipes/:recipeId', ctrl.removeRecipe);

module.exports = router;
