const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.put('/me', ctrl.updateMe);
router.put('/me/password', ctrl.changePassword);
router.get('/me/recipes', ctrl.myRecipes);
router.get('/me/saved', ctrl.mySaved);

module.exports = router;
