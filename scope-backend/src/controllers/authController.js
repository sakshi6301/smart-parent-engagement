const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const credentialEmailHTML = (name, email, password, role) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e1b4b,#4f46e5);padding:32px 40px;text-align:center;">
      <div style="font-size:2.5rem;">🎓</div>
      <h1 style="color:#fff;margin:8px 0 4px;font-size:1.6rem;letter-spacing:2px;">SCOPE</h1>
      <p style="color:#c7d2fe;margin:0;font-size:0.9rem;">Smart Continuous Parent Engagement System</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <h2 style="color:#111827;margin:0 0 8px;font-size:1.2rem;">Welcome, ${name}! 👋</h2>
      <p style="color:#6b7280;margin:0 0 28px;font-size:0.92rem;line-height:1.6;">
        Your <strong style="color:#4f46e5;text-transform:capitalize;">${role}</strong> account has been created on the SCOPE platform by your school administrator. Use the credentials below to sign in.
      </p>

      <!-- Credentials Box -->
      <div style="background:#f5f3ff;border:2px solid #ddd6fe;border-radius:12px;padding:24px 28px;margin-bottom:28px;">
        <p style="margin:0 0 6px;font-size:0.75rem;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;">Your Login Credentials</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <tr>
            <td style="padding:8px 0;font-size:0.85rem;color:#6b7280;width:100px;">🌐 Portal</td>
            <td style="padding:8px 0;font-size:0.88rem;color:#111827;font-weight:600;">http://localhost:3000</td>
          </tr>
          <tr style="border-top:1px solid #ede9fe;">
            <td style="padding:8px 0;font-size:0.85rem;color:#6b7280;">📧 Email</td>
            <td style="padding:8px 0;font-size:0.88rem;color:#111827;font-weight:600;">${email}</td>
          </tr>
          <tr style="border-top:1px solid #ede9fe;">
            <td style="padding:8px 0;font-size:0.85rem;color:#6b7280;">🔑 Password</td>
            <td style="padding:8px 0;">
              <span style="background:#1e1b4b;color:#fff;padding:4px 14px;border-radius:6px;font-size:0.95rem;font-weight:700;letter-spacing:1px;font-family:monospace;">${password}</span>
            </td>
          </tr>
          <tr style="border-top:1px solid #ede9fe;">
            <td style="padding:8px 0;font-size:0.85rem;color:#6b7280;">👤 Role</td>
            <td style="padding:8px 0;font-size:0.88rem;color:#4f46e5;font-weight:700;text-transform:capitalize;">${role}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="http://localhost:3000/login" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-weight:700;font-size:0.95rem;">
          Sign In to SCOPE →
        </a>
      </div>

      <!-- Security Note -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;">
        <p style="margin:0;font-size:0.82rem;color:#92400e;">
          ⚠️ <strong>Security Notice:</strong> Please change your password after your first login. Do not share your credentials with anyone.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:0.78rem;color:#9ca3af;">
        This email was sent by your school's SCOPE administrator.<br/>
        If you did not expect this email, please contact your school.
      </p>
    </div>
  </div>
</body>
</html>
`;

exports.register = async (req, res) => {
  const { name, email, password, role, phone, language } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password, role, phone, language });
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
};

exports.getProfile = async (req, res) => {
  res.json(req.user);
};

exports.updateFCMToken = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.fcmToken });
  res.json({ message: 'FCM token updated' });
};

// Admin creates account + sends credentials email
exports.adminCreateUser = async (req, res) => {
  const { name, email, password, role, phone, language } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password, role, phone, language });

  // Send credentials email
  let emailSent = false;
  try {
    await sendEmail({
      to: email,
      subject: `Your SCOPE ${role.charAt(0).toUpperCase() + role.slice(1)} Account Credentials`,
      html: credentialEmailHTML(name, email, password, role),
    });
    emailSent = true;
  } catch (err) {
    console.warn('Credential email failed:', err.message);
  }

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailSent,
    message: emailSent
      ? `Account created and credentials sent to ${email}`
      : `Account created. Email could not be sent (check EMAIL config in .env)`,
  });
};

// Send credentials email to an existing imported user (password = Welcome@123)
exports.sendCredentials = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Skip placeholder internal emails generated during bulk import
  if (user.email.endsWith('@scope.internal'))
    return res.status(400).json({ message: `${user.name} has no real email address. Update their email first.` });

  try {
    await sendEmail({
      to: user.email,
      subject: `Your SCOPE ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account Credentials`,
      html: credentialEmailHTML(user.name, user.email, 'Welcome@123', user.role),
    });
    res.json({ message: `Credentials sent to ${user.email}` });
  } catch (err) {
    res.status(500).json({ message: 'Email failed: ' + err.message });
  }
};

// Toggle user active/inactive
exports.toggleActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
};

// Reset user password to Welcome@123
exports.resetPassword = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.password = 'Welcome@123';
  await user.save();
  res.json({ message: `Password reset for ${user.name}` });
};

// Admin update user details
exports.adminUpdateUser = async (req, res) => {
  try {
    const { name, email, phone, language, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name)     user.name     = name;
    if (email)    user.email    = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (language) user.language = language;
    if (password) user.password = password;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Auto-create User accounts for all students that don't have one yet
exports.provisionStudentUsers = async (req, res) => {
  const Student = require('../models/Student');

  const students = await Student.find({ isActive: true });
  let created = 0, skipped = 0;

  for (const student of students) {
    if (student.studentUser) { skipped++; continue; }

    const email = student.email?.trim()
      ? student.email.toLowerCase()
      : `${student.rollNumber.toLowerCase().replace(/\s+/g, '')}@scope.internal`;

    let user = await User.findOne({ email });
    if (!user) {
      // Pass plain text — User model pre('save') hook will hash it
      user = await User.create({
        name: student.name,
        email,
        password: 'Welcome@123',
        role: 'student',
        phone: student.phone || '',
        isActive: true,
      });
      created++;
    } else {
      skipped++;
    }

    // Link user back to student
    await Student.findByIdAndUpdate(student._id, { studentUser: user._id });
  }

  res.json({
    message: `Provisioning complete. ${created} accounts created, ${skipped} skipped.`,
    created,
    skipped,
  });
};

// Resend credentials to existing user
exports.resendCredentials = async (req, res) => {
  const { userId, password } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  try {
    await sendEmail({
      to: user.email,
      subject: `Your SCOPE Login Credentials`,
      html: credentialEmailHTML(user.name, user.email, password, user.role),
    });
    res.json({ message: `Credentials resent to ${user.email}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email: ' + err.message });
  }
};
