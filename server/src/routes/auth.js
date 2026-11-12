const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const limiter = require('../middleware/rateLimit');

router.post('/register', limiter, ctrl.register);
router.post('/login', limiter, ctrl.login);
router.get('/me', protect, ctrl.me);

module.exports = router;
