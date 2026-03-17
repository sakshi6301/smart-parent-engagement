const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendPush = require('../utils/sendPush');
const sendEmail = require('../utils/sendEmail');
const buildEmailHtml = require('../utils/emailTemplate');

exports.markAttendance = async (req, res) => {
  const { records, date } = req.body; // records: [{ studentId, status }]
  const results = [];

  for (const record of records) {
    const attendance = await Attendance.findOneAndUpdate(
      { student: record.studentId, date: new Date(date) },
      { student: record.studentId, teacher: req.user._id, date: new Date(date), status: record.status },
      { upsert: true, new: true }
    );

    if (record.status === 'absent' && !attendance.notificationSent) {
      const student = await Student.findById(record.studentId).populate('parent');
      if (student?.parent) {
        const parent = await User.findById(student.parent);
        const title = 'Absence Alert';
        const body = `${student.name} was marked absent on ${date}.`;

        await Notification.create({ recipient: parent._id, title, body, type: 'absence', channels: ['push', 'email'], relatedStudent: student._id });
        await sendPush(parent.fcmToken, title, body);
        if (parent.email && !parent.email.endsWith('@scope.internal')) {
          await sendEmail({ to: parent.email, subject: `SCOPE – ${title}`, html: buildEmailHtml({ recipientName: parent.name, title, body, type: 'absence' }) });
        }

        attendance.notificationSent = true;
        await attendance.save();
      }
    }
    results.push(attendance);
  }

  res.status(201).json(results);
};

exports.getAttendance = async (req, res) => {
  const { studentId } = req.params;
  const { month } = req.query;
  const filter = { student: studentId };

  if (month) {
    const start = new Date(`${month}-01`);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    filter.date = { $gte: start, $lte: end };
  }

  const records = await Attendance.find(filter).sort({ date: -1 });
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const percentage = total ? ((present / total) * 100).toFixed(1) : 0;

  res.json({ records, summary: { total, present, absent: total - present, percentage } });
};
