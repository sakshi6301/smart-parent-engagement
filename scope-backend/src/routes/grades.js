const router = require('express').Router();
const { addGrade, getStudentGrades, updateGrade } = require('../controllers/gradeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/', authorize('teacher'), addGrade);
router.get('/:studentId', getStudentGrades);
router.put('/:id', authorize('teacher'), updateGrade);

module.exports = router;
