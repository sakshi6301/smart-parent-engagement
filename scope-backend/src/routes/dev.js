const router = require('express').Router();
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// DEV ONLY — create admin account if it doesn't exist
router.post('/create-admin', async (req, res) => {
  if (process.env.NODE_ENV !== 'development')
    return res.status(403).json({ message: 'Only available in development mode' });
  const exists = await User.findOne({ email: 'admin@scope.com' });
  if (exists) return res.json({ message: 'Admin already exists', email: 'admin@scope.com', password: 'Admin@123' });
  await User.create({ name: 'Super Admin', email: 'admin@scope.com', password: 'Admin@123', role: 'admin' });
  res.json({ message: 'Admin created', email: 'admin@scope.com', password: 'Admin@123' });
});

// DEV ONLY — delete all users (except admin) and all students
router.delete('/reset-data', async (req, res) => {
  if (process.env.NODE_ENV !== 'development')
    return res.status(403).json({ message: 'Only available in development mode' });
  await Student.deleteMany({});
  await User.deleteMany({ role: { $ne: 'admin' } });
  res.json({ message: 'All students and non-admin users deleted. Ready for fresh import.' });
});

// DEV ONLY — check what password hash is stored for an email
router.get('/check-user/:email', async (req, res) => {
  if (process.env.NODE_ENV !== 'development')
    return res.status(403).json({ message: 'Only available in development mode' });
  const user = await User.findOne({ email: req.params.email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const passwordMatch = await bcrypt.compare('Welcome@123', user.password);
  res.json({
    name: user.name,
    email: user.email,
    role: user.role,
    passwordMatch,
    hint: passwordMatch ? 'Login will work with Welcome@123' : 'Password is wrong — reset data and re-import'
  });
});

// DEV ONLY — test email sending
router.post('/test-email', async (req, res) => {
  if (process.env.NODE_ENV !== 'development')
    return res.status(403).json({ message: 'Only available in development mode' });
  const sendEmail = require('../utils/sendEmail');
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: 'to email required' });
  try {
    await sendEmail({ to, subject: 'SCOPE Test Email', html: '<p>This is a test email from SCOPE via Brevo.</p>' });
    res.json({ message: `Email sent to ${to}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
