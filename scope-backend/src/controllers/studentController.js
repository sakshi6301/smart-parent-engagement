const Student = require('../models/Student');

exports.bulkImport = async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0)
    return res.status(400).json({ message: 'No student data provided' });

  const results = { inserted: 0, skipped: 0, errors: [] };

  for (const row of students) {
    try {
      await Student.findOneAndUpdate(
        { rollNumber: row.rollNumber },
        { $setOnInsert: row },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.inserted++;
    } catch (err) {
      results.skipped++;
      results.errors.push(`Row ${row.rollNumber}: ${err.message}`);
    }
  }

  res.status(201).json({ message: `Import complete`, ...results });
};

exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getStudents = async (req, res) => {
  const filter = {};
  if (req.user.role === 'teacher') filter.teacher = req.user._id;
  if (req.user.role === 'parent')  filter.parent  = req.user._id;
  if (req.user.role === 'student') filter.studentUser = req.user._id;
  const students = await Student.find(filter).populate('parent teacher', 'name email phone');
  res.json(students);
};

exports.getStudent = async (req, res) => {
  const student = await Student.findById(req.params.id).populate('parent teacher', 'name email phone');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

exports.updateStudent = async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

exports.deleteStudent = async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: 'Student deleted' });
};

// Link parent to student
exports.linkParent = async (req, res) => {
  const { parentId } = req.body;
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { parent: parentId },
    { new: true }
  ).populate('parent teacher', 'name email phone');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

// Unlink parent from student
exports.unlinkParent = async (req, res) => {
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { $unset: { parent: 1 } },
    { new: true }
  );
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

// Assign teacher to student
exports.assignTeacher = async (req, res) => {
  const { teacherId } = req.body;
  const student = await Student.findByIdAndUpdate(
    req.params.id,
    { teacher: teacherId },
    { new: true }
  ).populate('parent teacher', 'name email phone');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
};

// Auto-link: match students → parents by email/name, teachers by class-section
exports.autoLink = async (req, res) => {
  const User = require('../models/User');

  const students = await Student.find({ isActive: true });
  const parents  = await User.find({ role: 'parent',  isActive: true });
  const teachers = await User.find({ role: 'teacher', isActive: true });

  // Parent lookup: by email (priority 1) and by name (priority 2)
  const parentByEmail = {};
  const parentByName  = {};
  parents.forEach(p => {
    if (p.email) parentByEmail[p.email.toLowerCase().trim()] = p._id;
    if (p.name)  parentByName[p.name.toLowerCase().trim()]   = p._id;
  });

  // Teacher lookup: by class-section from already-assigned students (unanimous only)
  const assignedStudents = await Student.find({ teacher: { $exists: true, $ne: null }, isActive: true });
  const classSectionTeacher = {};
  assignedStudents.forEach(s => {
    const key = `${s.class}-${s.section}`;
    const tid = String(s.teacher);
    if (!classSectionTeacher[key])             classSectionTeacher[key] = tid;
    else if (classSectionTeacher[key] !== tid) classSectionTeacher[key] = 'MIXED';
  });

  const results = { parentLinked: 0, teacherLinked: 0, parentSkipped: 0, teacherSkipped: 0, details: [] };

  for (const student of students) {
    const update = {};

    // ── Match parent ──
    if (!student.parent) {
      const fEmail = student.fatherEmail?.toLowerCase().trim();
      const mEmail = student.motherEmail?.toLowerCase().trim();
      const fName  = student.fatherName?.toLowerCase().trim();
      const mName  = student.motherName?.toLowerCase().trim();

      let matchedId = null;
      let matchedBy = '';

      // Priority 1: email match
      if      (fEmail && parentByEmail[fEmail]) { matchedId = parentByEmail[fEmail]; matchedBy = `father email (${fEmail})`; }
      else if (mEmail && parentByEmail[mEmail]) { matchedId = parentByEmail[mEmail]; matchedBy = `mother email (${mEmail})`; }
      // Priority 2: name match
      else if (fName  && parentByName[fName])   { matchedId = parentByName[fName];   matchedBy = `father name (${student.fatherName})`; }
      else if (mName  && parentByName[mName])   { matchedId = parentByName[mName];   matchedBy = `mother name (${student.motherName})`; }

      if (matchedId) {
        update.parent = matchedId;
        results.parentLinked++;
        results.details.push({ student: student.name, roll: student.rollNumber, matched: 'parent', by: matchedBy });
      } else {
        results.parentSkipped++;
      }
    }

    // ── Match teacher ──
    if (!student.teacher) {
      const key = `${student.class}-${student.section}`;
      const tid = classSectionTeacher[key];
      if (tid && tid !== 'MIXED') {
        update.teacher = tid;
        results.teacherLinked++;
      } else {
        results.teacherSkipped++;
      }
    }

    if (Object.keys(update).length > 0) {
      await Student.findByIdAndUpdate(student._id, update);
    }
  }

  res.json({
    message: 'Auto-link complete',
    parentLinked:   results.parentLinked,
    teacherLinked:  results.teacherLinked,
    parentSkipped:  results.parentSkipped,
    teacherSkipped: results.teacherSkipped,
    total:          students.length,
    details:        results.details,
  });
};

// Bulk assign teacher to entire class-section
exports.bulkAssignTeacher = async (req, res) => {
  const { teacherId, class: cls, section } = req.body;
  const result = await Student.updateMany(
    { class: cls, section },
    { teacher: teacherId }
  );
  res.json({ message: `Teacher assigned to ${result.modifiedCount} students in Class ${cls}-${section}` });
};

// Get all users by role (for dropdowns)
exports.getUsersByRole = async (req, res) => {
  const User = require('../models/User');
  const { role } = req.params;
  const users = await User.find({ role, isActive: true }).select('name email phone role');
  res.json(users);
};
