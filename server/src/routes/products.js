const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/config', ctrl.config);
router.get('/shipping', ctrl.shipping);
router.get('/admin/all', protect, requireRole('admin'), ctrl.listAll);
router.get('/:id', ctrl.getOne);
router.post('/', protect, requireRole('admin'), ctrl.create);
router.put('/:id', protect, requireRole('admin'), ctrl.update);
router.delete('/:id', protect, requireRole('admin'), ctrl.remove);

module.exports = router;
