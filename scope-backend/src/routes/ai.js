const router = require('express').Router();
const { predictRisk, getAllRisks, getRecommendations, getGradeTrend, getAttendanceAnomaly, getEngagementScore } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/risk-all', authorize('admin'), getAllRisks);
router.get('/risk/:studentId', predictRisk);
router.get('/recommendations/:studentId', getRecommendations);
router.get('/grade-trend/:studentId', getGradeTrend);
router.get('/attendance-anomaly/:studentId', getAttendanceAnomaly);
router.get('/engagement/:parentId', getEngagementScore);

module.exports = router;
