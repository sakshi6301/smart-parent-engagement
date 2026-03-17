const router = require('express').Router();
const { getEngagement, getDashboard } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', authorize('admin', 'teacher'), getDashboard);
router.get('/engagement/:parentId', getEngagement);

module.exports = router;
