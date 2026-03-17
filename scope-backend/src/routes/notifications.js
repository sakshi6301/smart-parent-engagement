const router = require('express').Router();
const {
  sendNotification, broadcast,
  getNotifications, markRead, markAllRead,
  deleteNotification, getHistory, getStats,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// recipient routes
router.get('/',                getNotifications);
router.put('/read-all',        markAllRead);
router.put('/:id/read',        markRead);
router.delete('/:id',          deleteNotification);

// admin / teacher send
router.post('/send',           authorize('admin', 'teacher'), sendNotification);
router.post('/broadcast',      authorize('admin', 'teacher'), broadcast);

// admin only
router.get('/admin/history',   authorize('admin'), getHistory);
router.get('/admin/stats',     authorize('admin'), getStats);

module.exports = router;
