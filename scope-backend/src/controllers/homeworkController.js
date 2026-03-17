const Homework = require('../models/Homework');
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const User = require('../models/User');
const sendPush = require('../utils/sendPush');

exports.createHomework = async (req, res) => {
  const hw = await Homework.create({ ...req.body, teacher: req.user._id });

  // Notify parents of students in that class/section
  const students = await Student.find({ class: req.body.class, section: req.body.section }).populate('parent');
  for (const student of students) {
    if (student.parent) {
      const parent = await User.findById(student.parent);
      const title = 'New Homework';
      const body = `${req.body.subject}: ${req.body.title} due ${new Date(req.body.dueDate).toDateString()}`;
      await Notification.create({ recipient: parent._id, title, body, type: 'homework', channels: ['push'], relatedStudent: student._id });
      await sendPush(parent.fcmToken, title, body);
    }
  }

  res.status(201).json(hw);
};

exports.getHomework = async (req, res) => {
  const { classId } = req.params;
  const [cls, section] = classId.split('-');
  const homework = await Homework.find({ class: cls, section }).populate('teacher', 'name').sort({ dueDate: 1 });
  res.json(homework);
};

exports.submitHomework = async (req, res) => {
  const { homeworkId, studentId } = req.body;
  const hw = await Homework.findById(homeworkId);
  if (!hw) return res.status(404).json({ message: 'Homework not found' });

  const fileUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.fileUrl || '');

  const existing = hw.submissions.find(s => s.student.toString() === studentId);
  if (existing) {
    existing.fileUrl = fileUrl;
    existing.submittedAt = new Date();
  } else {
    const isLate = new Date() > new Date(hw.dueDate);
    hw.submissions.push({ student: studentId, fileUrl, status: isLate ? 'late' : 'submitted' });
  }

  await hw.save();
  res.json({ message: 'Homework submitted', fileUrl });
};
