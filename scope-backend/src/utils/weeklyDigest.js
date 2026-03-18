const cron = require('node-cron');
const axios = require('axios');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Homework = require('../models/Homework');
const sendEmail = require('./sendEmail');
const buildWeeklyDigestHtml = require('./weeklyDigestTemplate');

// ── helpers ──────────────────────────────────────────────────────────────────

const pct = (obtained, total) => total > 0 ? +((obtained / total) * 100).toFixed(1) : 0;

const weekRange = () => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
};

// ── core digest builder for one student ──────────────────────────────────────

const buildDigestForStudent = async (student) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  // Attendance — last 7 days
  const attRecords = await Attendance.find({
    student: student._id,
    date: { $gte: weekAgo },
  });

  const present = attRecords.filter(r => r.status === 'present').length;
  const absent  = attRecords.filter(r => r.status === 'absent').length;
  const late    = attRecords.filter(r => r.status === 'late').length;
  const total   = attRecords.length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  // Grades — last 30 days (recent exams)
  const monthAgo = new Date(now);
  monthAgo.setDate(now.getDate() - 30);
  const recentGrades = await Grade.find({
    student: student._id,
    examDate: { $gte: monthAgo },
  }).sort({ examDate: -1 }).limit(5);

  const gradeData = recentGrades.map(g => ({
    subject: g.subject,
    examType: g.examType,
    marksObtained: g.marksObtained,
    totalMarks: g.totalMarks,
    percentage: pct(g.marksObtained, g.totalMarks),
  }));

  // Overall average — all grades
  const allGrades = await Grade.find({ student: student._id });
  const overallAvg = allGrades.length
    ? +(allGrades.reduce((sum, g) => sum + pct(g.marksObtained, g.totalMarks), 0) / allGrades.length).toFixed(1)
    : 0;

  // Pending homework
  const pendingHW = await Homework.find({
    class: student.class,
    section: student.section,
    dueDate: { $gte: now },
  }).sort({ dueDate: 1 }).limit(5);

  const hwData = pendingHW.map(h => ({
    subject: h.subject,
    title: h.title,
    dueDate: h.dueDate,
  }));

  // AI risk prediction
  let riskLevel = 'low';
  let aiSuggestions = [];
  try {
    const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const hwCompletionRate = total > 0 ? Math.round((present / total) * 100) : 75;
    const { data } = await axios.post(`${AI_URL}/predict/risk`, {
      attendance_pct: percentage,
      avg_grade: overallAvg,
      hw_completion_rate: hwCompletionRate,
    });
    riskLevel = data.risk_level || 'low';
    aiSuggestions = data.suggestions || [];
  } catch {
    // AI service down — use rule-based fallback
    if (percentage < 75 || overallAvg < 40) {
      riskLevel = 'high';
      aiSuggestions = ['Schedule a parent-teacher meeting', 'Arrange extra tutoring sessions', 'Monitor daily attendance closely'];
    } else if (percentage < 85 || overallAvg < 60) {
      riskLevel = 'medium';
      aiSuggestions = ['Encourage regular study habits', 'Review weak subjects with teacher', 'Ensure homework is completed on time'];
    } else {
      riskLevel = 'low';
      aiSuggestions = ['Maintain current performance', 'Encourage participation in extracurricular activities'];
    }
  }

  return { present, absent, late, total, percentage, gradeData, overallAvg, hwData, riskLevel, aiSuggestions };
};

// ── send digest to one parent ─────────────────────────────────────────────────

const sendDigestToParent = async (student, parentUser) => {
  if (!parentUser?.email) return;

  const digest = await buildDigestForStudent(student);

  const html = buildWeeklyDigestHtml({
    parentName:   parentUser.name,
    studentName:  student.name,
    studentClass: `${student.class}-${student.section}`,
    weekRange:    weekRange(),
    attendance:   {
      present:    digest.present,
      absent:     digest.absent,
      late:       digest.late,
      total:      digest.total,
      percentage: digest.percentage,
    },
    recentGrades: digest.gradeData,
    overallAvg:   digest.overallAvg,
    pendingHW:    digest.hwData,
    riskLevel:    digest.riskLevel,
    aiSuggestions:digest.aiSuggestions,
  });

  await sendEmail({
    to: parentUser.email,
    subject: `📊 Weekly Progress Report — ${student.name} | SCOPE`,
    html,
  });
};

// ── main job ──────────────────────────────────────────────────────────────────

const runWeeklyDigest = async () => {
  console.log('[WeeklyDigest] Starting weekly digest job...');
  let sent = 0, skipped = 0, failed = 0;

  try {
    // Only students with a linked parent who has an email
    const students = await Student.find({ isActive: true, parent: { $exists: true, $ne: null } })
      .populate('parent', 'name email');

    for (const student of students) {
      const parent = student.parent;
      if (!parent?.email) { skipped++; continue; }

      try {
        await sendDigestToParent(student, parent);
        sent++;
        console.log(`[WeeklyDigest] Sent to ${parent.email} for student ${student.name}`);
        // Small delay to respect SMTP rate limits (Brevo free = 1 email/sec)
        await new Promise(r => setTimeout(r, 1200));
      } catch (err) {
        failed++;
        console.error(`[WeeklyDigest] Failed for ${student.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[WeeklyDigest] Fatal error:', err.message);
  }

  console.log(`[WeeklyDigest] Done — sent: ${sent}, skipped: ${skipped}, failed: ${failed}`);
};

// ── scheduler ─────────────────────────────────────────────────────────────────

/**
 * Schedules the weekly digest.
 * Default: Every Sunday at 8:00 AM.
 * Override with DIGEST_CRON env var, e.g. "0 8 * * 0"
 *
 * To test immediately without waiting for Sunday,
 * set DIGEST_RUN_ON_START=true in .env
 */
const scheduleWeeklyDigest = () => {
  const cronExpr = process.env.DIGEST_CRON || '0 8 * * 0'; // Sunday 8 AM

  cron.schedule(cronExpr, () => {
    console.log('[WeeklyDigest] Cron triggered');
    runWeeklyDigest();
  }, { timezone: 'Asia/Kolkata' });

  console.log(`[WeeklyDigest] Scheduled — cron: "${cronExpr}" (IST)`);

  // Run immediately on server start if env flag is set (useful for testing)
  if (process.env.DIGEST_RUN_ON_START === 'true') {
    console.log('[WeeklyDigest] DIGEST_RUN_ON_START=true — running now...');
    runWeeklyDigest();
  }
};

module.exports = { scheduleWeeklyDigest, runWeeklyDigest };
