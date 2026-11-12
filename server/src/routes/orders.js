const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { protect, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Chống đặt hàng dồn dập: tối đa 20 đơn mỗi 15 phút
const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { message: 'Bạn đặt hàng quá nhiều lần, vui lòng thử lại sau ít phút' } });

router.use(protect);
// Đường dẫn của admin đặt trước "/:id" để không bị hiểu nhầm là mã đơn
router.get('/admin/all', requireRole('admin'), ctrl.listAll);
router.put('/admin/:id/status', requireRole('admin'), ctrl.updateStatus);

router.get('/', ctrl.listMine);
router.post('/', orderLimiter, ctrl.create);
router.get('/:id', ctrl.getOne);
router.post('/:id/cancel', ctrl.cancel);
router.post('/:id/payment-session', ctrl.paymentSession);
router.post('/:id/payment-result', ctrl.paymentResult);

module.exports = router;
