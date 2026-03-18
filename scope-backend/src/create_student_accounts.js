require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User    = require('./models/User');
const Student = require('./models/Student');

const STUDENT_ACCOUNTS = [
  { rollNumber: 'STU038', email: 'prachi.student@scope.com',  password: 'Student@123', name: 'Prachi Nimkar' },
  { rollNumber: 'STU039', email: 'saurabh.student@scope.com', password: 'Student@123', name: 'Saurabh Londhe' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected\n');

  for (const acc of STUDENT_ACCOUNTS) {
    // Delete old account if exists, recreate fresh
    await User.deleteOne({ email: acc.email });
    const user = await User.create({ name: acc.name, email: acc.email, password: acc.password, role: 'student' });

    // Link studentUser on the Student record
    await Student.findOneAndUpdate({ rollNumber: acc.rollNumber }, { studentUser: user._id });

    console.log(`✅ ${acc.name}`);
    console.log(`   Email:    ${acc.email}`);
    console.log(`   Password: ${acc.password}\n`);
  }

  // Also reset parent credentials for Bhalekar sir's students
  const PARENTS = [
    { email: 'ashok.nimkar@gmail.com',  name: 'Ashok Nimkar  (parent of Prachi)' },
    { email: 'dilip.londhe@gmail.com',  name: 'Dilip Londhe  (parent of Saurabh)' },
  ];

  for (const p of PARENTS) {
    const user = await User.findOne({ email: p.email });
    if (user) {
      user.password = 'Welcome@123';
      await user.save();
      console.log(`✅ ${p.name}`);
      console.log(`   Email:    ${p.email}`);
      console.log(`   Password: Welcome@123\n`);
    }
  }

  console.log('--- All credentials ---\n');
  console.log('TEACHER (Bhalekar sir)');
  console.log('  sakshi.bhudge@gmail.com  /  Welcome@123\n');
  console.log('STUDENTS');
  console.log('  prachi.student@scope.com   /  Student@123  (Prachi Nimkar,  Class 9-B)');
  console.log('  saurabh.student@scope.com  /  Student@123  (Saurabh Londhe, Class 9-B)\n');
  console.log('PARENTS');
  console.log('  ashok.nimkar@gmail.com  /  Welcome@123  (parent of Prachi)');
  console.log('  dilip.londhe@gmail.com  /  Welcome@123  (parent of Saurabh)\n');

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
