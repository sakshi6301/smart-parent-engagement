const axios = require('axios');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Homework = require('../models/Homework');
const Student = require('../models/Student');

exports.predictRisk = async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Gather data for AI
  const attendanceData = await Attendance.find({ student: studentId });
  const grades = await Grade.find({ student: studentId });
  const homeworks = await Homework.find({ 'submissions.student': studentId });

  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(a => a.status === 'present').length;
  const attendancePct = totalDays ? (presentDays / totalDays) * 100 : 0;

  const avgGrade = grades.length
    ? grades.reduce((sum, g) => sum + (g.marksObtained / g.totalMarks) * 100, 0) / grades.length
    : 0;

  const hwSubmitted = homeworks.filter(hw => hw.submissions.some(s => s.student.toString() === studentId)).length;
  const hwCompletionRate = homeworks.length ? (hwSubmitted / homeworks.length) * 100 : 0;

  const payload = { attendance_pct: attendancePct, avg_grade: avgGrade, hw_completion_rate: hwCompletionRate };

  try {
    const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/predict/risk`, payload);
    res.json({ student: student.name, ...payload, ...data });
  } catch {
    res.json({ student: student.name, ...payload, risk_level: 'unavailable', suggestions: [] });
  }
};

exports.getGradeTrend = async (req, res) => {
  const { studentId } = req.params;
  const grades = await Grade.find({ student: studentId }).sort({ examDate: 1 });

  // Group scores per subject in chronological order
  const subjectScores = {};
  for (const g of grades) {
    if (!subjectScores[g.subject]) subjectScores[g.subject] = [];
    subjectScores[g.subject].push(+((g.marksObtained / g.totalMarks) * 100).toFixed(1));
  }

  try {
    const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/predict/grade-trend`, { subjects: subjectScores });
    res.json(data);
  } catch {
    res.json({ trends: {} });
  }
};

exports.getAttendanceAnomaly = async (req, res) => {
  const { studentId } = req.params;
  const records = await Attendance.find({ student: studentId }).sort({ date: 1 });
  const payload = records.map(r => ({ date: r.date, status: r.status }));

  try {
    const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/predict/attendance-anomaly`, { records: payload });
    res.json(data);
  } catch {
    res.json({ is_anomaly: false, risk_type: null, message: 'AI service unavailable' });
  }
};

exports.getEngagementScore = async (req, res) => {
  const { parentId } = req.params;
  const Notification = require('../models/Notification');
  const Chat = require('../models/Chat');
  const Meeting = require('../models/Meeting');
  const User = require('../models/User');

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const parent = await User.findById(parentId);
  if (!parent) return res.status(404).json({ message: 'Parent not found' });

  const [notifications, meetings] = await Promise.all([
    Notification.find({ recipient: parentId, createdAt: { $gte: since } }),
    Meeting.find({ parent: parentId, status: 'confirmed', updatedAt: { $gte: since } }),
  ]);

  const notifOpened = notifications.filter(n => n.isRead).length;
  const payload = {
    login_count: parent.loginCount || 0,
    chat_replies: parent.chatReplyCount || 0,
    meetings_attended: meetings.length,
    hw_acknowledged: parent.hwAckCount || 0,
    notifications_opened: notifOpened,
    total_notifications: notifications.length,
  };

  try {
    const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/predict/engagement`, payload);
    res.json({ parent: parent.name, ...payload, ...data });
  } catch {
    res.json({ score: 0, level: 'Unknown', insights: [] });
  }
};

exports.getRecommendations = async (req, res) => {
  const { studentId } = req.params;
  const grades = await Grade.find({ student: studentId });

  const subjectAvg = {};
  for (const g of grades) {
    if (!subjectAvg[g.subject]) subjectAvg[g.subject] = [];
    subjectAvg[g.subject].push((g.marksObtained / g.totalMarks) * 100);
  }

  const weakSubjects = Object.entries(subjectAvg)
    .map(([subject, scores]) => ({ subject, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .filter(s => s.avg < 60);

  try {
    const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/recommend/learning`, { weak_subjects: weakSubjects });
    res.json(data);
  } catch {
    res.json({ recommendations: [] });
  }
};
