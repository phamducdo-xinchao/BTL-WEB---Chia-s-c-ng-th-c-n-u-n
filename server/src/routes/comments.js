const router = require('express').Router();
const ctrl = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
