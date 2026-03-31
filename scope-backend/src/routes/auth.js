const router = require('express').Router();
const { register, login, getProfile, updateFCMToken, adminCreateUser, adminUpdateUser, resendCredentials, toggleActive, resetPassword, sendCredentials, provisionStudentUsers, forgotPassword, refreshToken, logoutUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/fcm-token', protect, updateFCMToken);

// Admin-only routes
router.post('/admin/create-user',        protect, authorize('admin'), adminCreateUser);
router.put('/admin/users/:id',            protect, authorize('admin'), adminUpdateUser);
router.post('/admin/resend-credentials', protect, authorize('admin'), resendCredentials);
router.put('/admin/toggle-active/:id',    protect, authorize('admin'), toggleActive);
router.put('/admin/reset-password/:id',   protect, authorize('admin'), resetPassword);
router.post('/admin/send-credentials/:id',protect, authorize('admin'), sendCredentials);
router.post('/admin/provision-students',  protect, authorize('admin'), provisionStudentUsers);

module.exports = router;
