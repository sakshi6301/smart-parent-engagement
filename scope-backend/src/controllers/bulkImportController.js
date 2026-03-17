const User = require('../models/User');
const Student = require('../models/Student');
const { parseAndValidate } = require('../utils/bulkImportParser');

// Helper: upsert a User by email, return _id
async function upsertUser({ name, email, phone, role }) {
  // Generate a unique placeholder email if none provided
  const resolvedEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}.${role}@scope.internal`;
  let user = await User.findOne({ email: resolvedEmail });
  if (!user) {
    user = await User.create({ name, email: resolvedEmail, phone, role, password: 'Welcome@123' });
  }
  return user._id;
}

exports.bulkImport = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  let parsed;
  try {
    parsed = await parseAndValidate(req.file);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const { valid, errors, total } = parsed;
  const results = { total, inserted: 0, skipped: 0, errors };

  // Track duplicate StudentIDs within the file itself
  const seenIds = new Set();

  for (const row of valid) {
    const sid = row.StudentID.trim();

    if (seenIds.has(sid)) {
      results.skipped++;
      results.errors.push(`StudentID '${sid}': duplicate in file, skipped`);
      continue;
    }
    seenIds.add(sid);

    try {
      // 1. Upsert parent user
      const parentId = await upsertUser({
        name: row.ParentName,
        email: row.ParentEmail || undefined,
        phone: row.ParentPhone,
        role: 'parent',
      });

      // 2. Upsert teacher user (if provided)
      let teacherId;
      if (row.TeacherName) {
        teacherId = await upsertUser({ name: row.TeacherName, role: 'teacher' });
      }

      // 3. Upsert student record
      const studentData = {
        name: row.StudentName,
        rollNumber: sid,
        class: row.Class,
        section: row.Section || 'A',
        academicYear: row.AcademicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(2),
        gender: ['male', 'female', 'other'].includes(row.Gender?.toLowerCase()) ? row.Gender.toLowerCase() : 'other',
        dateOfBirth: row.DateOfBirth ? new Date(row.DateOfBirth) : new Date('2010-01-01'),
        fatherName:  row.FatherName  || undefined,
        fatherEmail: row.FatherEmail  || undefined,
        motherName:  row.MotherName   || undefined,
        motherEmail: row.MotherEmail  || undefined,
        parent: parentId,
        ...(teacherId && { teacher: teacherId }),
      };

      const existing = await Student.findOne({ rollNumber: sid });
      if (existing) {
        results.skipped++;
        results.errors.push(`StudentID '${sid}': already exists in DB, skipped`);
        continue;
      }

      await Student.create(studentData);
      results.inserted++;
    } catch (err) {
      results.skipped++;
      results.errors.push(`StudentID '${sid}': ${err.message}`);
    }
  }

  res.status(201).json({ message: 'Bulk import complete', ...results });
};

// Download CSV template
exports.downloadTemplate = (req, res) => {
  const header = 'StudentID,StudentName,Class,Section,Gender,DateOfBirth,AcademicYear,ParentName,ParentPhone,ParentEmail,FatherName,FatherEmail,MotherName,MotherEmail,TeacherName\n';
  const sample = 'STU001,Aarav Sharma,5,A,male,2013-06-15,2024-25,Rajesh Sharma,9876543210,rajesh@example.com,Rajesh Sharma,rajesh@example.com,Sunita Sharma,sunita@example.com,Mrs. Priya Joshi\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bulk_import_template.csv"');
  res.send(header + sample);
};
