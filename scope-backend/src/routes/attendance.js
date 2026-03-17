const router = require('express').Router();
const { markAttendance, getAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('teacher'), markAttendance);
router.get('/:studentId', getAttendance);

module.exports = router;
