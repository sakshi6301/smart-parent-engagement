const Grade = require('../models/Grade');
const Student = require('../models/Student');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendPush = require('../utils/sendPush');
const sendEmail = require('../utils/sendEmail');
const buildEmailHtml = require('../utils/emailTemplate');

exports.addGrade = async (req, res) => {
  const grade = await Grade.create({ ...req.body, teacher: req.user._id });

  // Notify parent
  try {
    const student = await Student.findById(req.body.student).populate('parent');
    if (student?.parent) {
      const parent = await User.findById(student.parent);
      const pct = ((req.body.marksObtained / req.body.totalMarks) * 100).toFixed(1);
      const title = `Grade Updated – ${req.body.subject}`;
      const body = `${student.name} scored ${req.body.marksObtained}/${req.body.totalMarks} (${pct}%) in ${req.body.subject} (${req.body.examType.replace('_', ' ')}).`;
      await Notification.create({ recipient: parent._id, title, body, type: 'performance', channels: ['push', 'email'], relatedStudent: student._id });
      await sendPush(parent.fcmToken, title, body);
      if (parent.email && !parent.email.endsWith('@scope.internal')) {
        await sendEmail({ to: parent.email, subject: `SCOPE – ${title}`, html: buildEmailHtml({ recipientName: parent.name, title, body, type: 'performance' }) });
      }
    }
  } catch { /* silent — don't fail grade save if notification fails */ }

  res.status(201).json(grade);
};

exports.getStudentGrades = async (req, res) => {
  const grades = await Grade.find({ student: req.params.studentId }).sort({ examDate: -1 });

  const subjectMap = {};
  for (const g of grades) {
    if (!subjectMap[g.subject]) subjectMap[g.subject] = [];
    subjectMap[g.subject].push({ examType: g.examType, percentage: ((g.marksObtained / g.totalMarks) * 100).toFixed(1), marks: `${g.marksObtained}/${g.totalMarks}`, date: g.examDate });
  }

  res.json({ grades, subjectSummary: subjectMap });
};

exports.updateGrade = async (req, res) => {
  const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!grade) return res.status(404).json({ message: 'Grade not found' });
  res.json(grade);
};
