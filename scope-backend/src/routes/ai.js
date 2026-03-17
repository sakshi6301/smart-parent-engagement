const router = require('express').Router();
const { predictRisk, getRecommendations } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/risk/:studentId', predictRisk);
router.get('/recommendations/:studentId', getRecommendations);

module.exports = router;
