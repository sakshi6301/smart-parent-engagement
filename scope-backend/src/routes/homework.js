const router = require('express').Router();
const { createHomework, getHomework, submitHomework } = require('../controllers/homeworkController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

router.use(protect);
router.post('/', authorize('teacher'), createHomework);
router.get('/:classId', getHomework);
router.post('/submit', authorize('student', 'parent'), upload.single('file'), submitHomework);
router.delete('/:id', authorize('teacher'), async (req, res) => {
  const Homework = require('../models/Homework');
  await Homework.findByIdAndDelete(req.params.id);
  res.json({ message: 'Homework deleted' });
});

module.exports = router;
