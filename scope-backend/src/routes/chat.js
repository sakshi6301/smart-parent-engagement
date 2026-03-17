const router = require('express').Router();
const { getMessages, sendMessage, requestMeeting, getMeetings, updateMeeting } = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/:roomId', getMessages);
router.post('/send', sendMessage);
router.post('/meetings', authorize('parent'), requestMeeting);
router.get('/meetings/list', getMeetings);
router.put('/meetings/:id', authorize('teacher'), updateMeeting);

module.exports = router;
