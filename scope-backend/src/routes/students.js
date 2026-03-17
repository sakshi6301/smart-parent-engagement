const router = require('express').Router();
const {
  createStudent, getStudents, getStudent, updateStudent, deleteStudent,
  bulkImport, linkParent, unlinkParent, assignTeacher, bulkAssignTeacher,
  getUsersByRole, autoLink
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/import', authorize('admin'), bulkImport);
router.post('/bulk-assign-teacher', authorize('admin'), bulkAssignTeacher);
router.post('/auto-link', authorize('admin'), autoLink);
router.get('/users/:role', authorize('admin'), getUsersByRole);

router.route('/')
  .get(getStudents)
  .post(authorize('admin', 'teacher'), createStudent);

router.route('/:id')
  .get(getStudent)
  .put(authorize('admin', 'teacher'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

router.put('/:id/link-parent',   authorize('admin'), linkParent);
router.put('/:id/unlink-parent', authorize('admin'), unlinkParent);
router.put('/:id/assign-teacher', authorize('admin'), assignTeacher);

module.exports = router;
