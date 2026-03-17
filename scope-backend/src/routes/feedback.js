const router = require('express').Router();
const { submitFeedback, getFeedbacks, respondFeedback } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', submitFeedback);
router.get('/', getFeedbacks);
router.put('/:id/respond', authorize('teacher', 'admin'), respondFeedback);

module.exports = router;
