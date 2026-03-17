const router = require('express').Router();
const { predictRisk, getRecommendations, getGradeTrend, getAttendanceAnomaly, getEngagementScore } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/risk/:studentId', predictRisk);
router.get('/recommendations/:studentId', getRecommendations);
router.get('/grade-trend/:studentId', getGradeTrend);
router.get('/attendance-anomaly/:studentId', getAttendanceAnomaly);
router.get('/engagement/:parentId', getEngagementScore);

module.exports = router;
