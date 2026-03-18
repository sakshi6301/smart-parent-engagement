const Engagement = require('../models/Engagement');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Homework = require('../models/Homework');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

exports.getEngagement = async (req, res) => {
  const { parentId } = req.params;
  const { month } = req.query;
  const filter = { parent: parentId };
  if (month) filter.month = month;
  const records = await Engagement.find(filter).populate('student', 'name class section');
  res.json(records);
};

exports.getDashboard = async (req, res) => {
  const [totalStudents, totalTeachers, totalParents] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    User.countDocuments({ role: 'parent', isActive: true }),
  ]);

  // Today attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await Attendance.aggregate([
    { $match: { date: { $gte: today } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Grade stats by subject
  const gradeStats = await Grade.aggregate([
    { $group: { _id: '$subject', avgScore: { $avg: { $multiply: [{ $divide: ['$marksObtained', '$totalMarks'] }, 100] } } } },
    { $sort: { avgScore: -1 } },
    { $limit: 8 },
  ]);

  // Class-wise student count
  const classStats = await Student.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$class', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Monthly attendance trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);
  const monthlyAttendance = await Attendance.aggregate([
    { $match: { date: { $gte: sixMonthsAgo }, status: 'present' } },
    { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Recent 5 students
  const recentStudents = await Student.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('parent', 'name email')
    .populate('teacher', 'name')
    .select('name rollNumber class section gender createdAt parent teacher');

  // Gender split
  const genderStats = await Student.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$gender', count: { $sum: 1 } } },
  ]);

  // Link stats
  const [unlinkedParent, unlinkedTeacher] = await Promise.all([
    Student.countDocuments({ isActive: true, $or: [{ parent: { $exists: false } }, { parent: null }] }),
    Student.countDocuments({ isActive: true, $or: [{ teacher: { $exists: false } }, { teacher: null }] }),
  ]);

  // Pending meetings
  const pendingMeetings = await Meeting.countDocuments({ status: 'pending' });

  // Homework stats
  const totalHomework = await Homework.countDocuments();
  const overdueHomework = await Homework.countDocuments({ dueDate: { $lt: new Date() } });

  // Teacher stats: students per teacher
  const teacherStats = await Student.aggregate([
    { $match: { isActive: true, teacher: { $exists: true, $ne: null } } },
    { $group: { _id: '$teacher', studentCount: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacher' } },
    { $unwind: '$teacher' },
    { $project: { _id: 1, studentCount: 1, 'teacher.name': 1, 'teacher.email': 1 } },
    { $sort: { studentCount: -1 } },
    { $limit: 20 },
  ]);

  // Today's absent students
  const todayAbsent = await Attendance.find({ date: { $gte: today }, status: 'absent' })
    .populate({ path: 'student', select: 'name rollNumber class section parent', populate: { path: 'parent', select: 'name email' } })
    .populate('teacher', 'name')
    .sort({ createdAt: -1 })
    .limit(50);

  // Pending meeting requests (most recent 5)
  const pendingMeetingsList = await Meeting.find({ status: 'pending' })
    .populate('parent', 'name email')
    .populate('student', 'name class section')
    .populate('teacher', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    totalStudents, totalTeachers, totalParents,
    todayAttendance, gradeStats, classStats,
    monthlyAttendance, recentStudents, genderStats,
    unlinkedParent, unlinkedTeacher,
    pendingMeetings, totalHomework, overdueHomework,
    teacherStats, todayAbsent, pendingMeetingsList,
  });
};
