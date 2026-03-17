const router = require('express').Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const { bulkImport, downloadTemplate } = require('../controllers/bulkImportController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    cb(null, allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i) ? true : false);
  },
});

router.get('/template', protect, authorize('admin'), downloadTemplate);
router.post('/students', protect, authorize('admin'), upload.single('file'), bulkImport);

module.exports = router;
