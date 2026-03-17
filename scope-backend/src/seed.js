/**
 * Seed script — creates test accounts with known credentials
 * Run: node src/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User    = require('./models/User');
const Student = require('./models/Student');

const TEACHER1 = { name: 'Priya Joshi',   email: 'priya.teacher@scope.com',  password: 'Test@1234', role: 'teacher' };
const TEACHER2 = { name: 'Rahul Desai',   email: 'rahul.teacher@scope.com',  password: 'Test@1234', role: 'teacher' };
const PARENT1  = { name: 'Rajesh Sharma', email: 'rajesh.parent@scope.com',  password: 'Test@1234', role: 'parent'  };
const PARENT2  = { name: 'Sunita Patil',  email: 'sunita.parent@scope.com',  password: 'Test@1234', role: 'parent'  };

const STUDENTS = [
  {
    name: 'Aarav Sharma', rollNumber: 'SEED001', class: '9', section: 'A',
    gender: 'male', dateOfBirth: new Date('2010-06-15'), academicYear: '2024-25',
    fatherName: 'Rajesh Sharma', fatherEmail: 'rajesh.parent@scope.com',
  },
  {
    name: 'Sneha Patil', rollNumber: 'SEED002', class: '9', section: 'A',
    gender: 'female', dateOfBirth: new Date('2010-09-20'), academicYear: '2024-25',
    motherName: 'Sunita Patil', motherEmail: 'sunita.parent@scope.com',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Delete existing seed users and recreate so password is always correct
  const upsert = async (data) => {
    await User.deleteOne({ email: data.email });
    const u = await User.create(data);
    console.log(`  created: ${data.email}`);
    return u;
  };

  const t1 = await upsert(TEACHER1);
  const t2 = await upsert(TEACHER2);
  const p1 = await upsert(PARENT1);
  const p2 = await upsert(PARENT2);

  // Upsert students and link
  const links = [
    { ...STUDENTS[0], teacher: t1._id, parent: p1._id },
    { ...STUDENTS[1], teacher: t2._id, parent: p2._id },
  ];

  for (const s of links) {
    const exists = await Student.findOne({ rollNumber: s.rollNumber });
    if (exists) {
      console.log(`  student exists: ${s.name}`);
    } else {
      await Student.create(s);
      console.log(`  student created: ${s.name}`);
    }
  }

  console.log('\n✅ Seed complete. Test credentials:\n');
  console.log('ADMIN');
  console.log('  Email:    admin@scope.com');
  console.log('  Password: Admin@123\n');
  console.log('TEACHERS');
  console.log('  Email:    priya.teacher@scope.com  | Password: Test@1234  | Student: Aarav Sharma (Class 9-A)');
  console.log('  Email:    rahul.teacher@scope.com  | Password: Test@1234  | Student: Sneha Patil  (Class 9-A)\n');
  console.log('PARENTS');
  console.log('  Email:    rajesh.parent@scope.com  | Password: Test@1234  | Child: Aarav Sharma');
  console.log('  Email:    sunita.parent@scope.com  | Password: Test@1234  | Child: Sneha Patil\n');
  console.log('STUDENTS (login via studentUser link — use admin to create student user accounts if needed)');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
