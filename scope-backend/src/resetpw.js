require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

async function resetPassword() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  const email = 'sakshi.bhudge@gmail.com';
  const newPassword = 'Welcome@123';

  const user = await User.findOne({ email });
  if (!user) { console.log('User not found'); process.exit(1); }

  user.password = newPassword;
  await user.save(); // triggers bcrypt hash via pre('save')

  console.log(`✅ Password reset for: ${user.name} (${user.email}) — role: ${user.role}`);
  console.log(`   Login with: ${email} / ${newPassword}`);

  await mongoose.disconnect();
}

resetPassword().catch(err => { console.error(err); process.exit(1); });
