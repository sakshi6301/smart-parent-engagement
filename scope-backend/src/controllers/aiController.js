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
