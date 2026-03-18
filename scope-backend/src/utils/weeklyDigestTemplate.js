/**
 * Builds the weekly progress digest HTML email for a parent.
 *
 * @param {Object} opts
 * @param {string}   opts.parentName
 * @param {string}   opts.studentName
 * @param {string}   opts.studentClass   e.g. "9-A"
 * @param {string}   opts.weekRange      e.g. "2 Jun – 8 Jun 2025"
 * @param {Object}   opts.attendance     { present, absent, late, total, percentage }
 * @param {Array}    opts.recentGrades   [{ subject, examType, marksObtained, totalMarks, percentage }]
 * @param {number}   opts.overallAvg     overall grade average %
 * @param {Array}    opts.pendingHW      [{ subject, title, dueDate }]
 * @param {string}   opts.riskLevel      'low' | 'medium' | 'high'
 * @param {Array}    opts.aiSuggestions  string[]
 */
const buildWeeklyDigestHtml = ({
  parentName, studentName, studentClass, weekRange,
  attendance, recentGrades, overallAvg,
  pendingHW, riskLevel, aiSuggestions,
}) => {

  const riskCfg = {
    low:    { color: '#10b981', bg: '#d1fae5', label: 'Low Risk',    icon: '✅' },
    medium: { color: '#f59e0b', bg: '#fef3c7', label: 'Medium Risk', icon: '⚠️' },
    high:   { color: '#ef4444', bg: '#fee2e2', label: 'High Risk',   icon: '🚨' },
  };
  const rc = riskCfg[riskLevel] || riskCfg.low;

  const attColor = attendance.percentage >= 90 ? '#10b981'
                 : attendance.percentage >= 75 ? '#f59e0b'
                 : '#ef4444';

  const gradeColor = (p) => p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444';
  const gradeLetter = (p) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'F';

  const gradeRows = recentGrades.length > 0
    ? recentGrades.map(g => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:0.85rem;color:#374151;">${g.subject}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:0.82rem;color:#6b7280;text-transform:capitalize;">${g.examType.replace('_', ' ')}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:0.85rem;font-weight:600;color:#111827;">${g.marksObtained}/${g.totalMarks}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;">
            <span style="background:${gradeColor(g.percentage)}20;color:${gradeColor(g.percentage)};padding:3px 10px;border-radius:10px;font-size:0.8rem;font-weight:700;">
              ${g.percentage}% · ${gradeLetter(g.percentage)}
            </span>
          </td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:20px;text-align:center;color:#9ca3af;font-size:0.85rem;">No grades recorded this week.</td></tr>`;

  const hwRows = pendingHW.length > 0
    ? pendingHW.map(h => {
        const due = new Date(h.dueDate);
        const daysLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
        const urgent = daysLeft <= 1;
        return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:0.85rem;color:#374151;">${h.subject}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:0.85rem;color:#111827;font-weight:500;">${h.title}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;">
            <span style="background:${urgent ? '#fee2e2' : '#fef3c7'};color:${urgent ? '#ef4444' : '#92400e'};padding:3px 10px;border-radius:10px;font-size:0.78rem;font-weight:700;">
              ${daysLeft <= 0 ? 'Due today!' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft} days left`}
            </span>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="3" style="padding:20px;text-align:center;color:#10b981;font-size:0.85rem;">🎉 No pending homework!</td></tr>`;

  const suggestionItems = aiSuggestions.length > 0
    ? aiSuggestions.map(s => `
        <tr>
          <td style="padding:8px 14px;font-size:0.85rem;color:#374151;border-bottom:1px solid #f3f4f6;">
            💡 ${s}
          </td>
        </tr>`).join('')
    : `<tr><td style="padding:12px 14px;font-size:0.85rem;color:#10b981;">✅ ${studentName} is performing well. Keep it up!</td></tr>`;

  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#1e1b4b 0%,#4f46e5 60%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:8px;">🎓</div>
        <h1 style="margin:0;color:#ffffff;font-size:1.8rem;font-weight:800;letter-spacing:-0.5px;">SCOPE</h1>
        <p style="margin:4px 0 16px;color:#c4b5fd;font-size:0.82rem;letter-spacing:1.5px;text-transform:uppercase;">Smart Parent Engagement System</p>
        <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 20px;display:inline-block;">
          <p style="margin:0;color:#e0e7ff;font-size:0.9rem;font-weight:600;">📅 Weekly Progress Report</p>
          <p style="margin:4px 0 0;color:#c4b5fd;font-size:0.8rem;">${weekRange}</p>
        </div>
      </td>
    </tr>

    <!-- Student Banner -->
    <tr>
      <td style="background:#4f46e5;padding:16px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0;color:#c4b5fd;font-size:0.78rem;">Student</p>
              <p style="margin:2px 0 0;color:#ffffff;font-size:1.1rem;font-weight:700;">${studentName}</p>
              <p style="margin:2px 0 0;color:#a5b4fc;font-size:0.82rem;">Class ${studentClass}</p>
            </td>
            <td align="right">
              <div style="background:${rc.bg};border-radius:20px;padding:8px 18px;display:inline-block;">
                <span style="color:${rc.color};font-weight:700;font-size:0.88rem;">${rc.icon} ${rc.label}</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="background:#ffffff;padding:24px 40px 16px;">
        <p style="margin:0;font-size:0.95rem;color:#374151;">
          Dear <strong>${parentName}</strong>,<br><br>
          Here is <strong>${studentName}'s</strong> weekly progress summary. Please review and reach out to the teacher if you have any concerns.
        </p>
      </td>
    </tr>

    <!-- Attendance Section -->
    <tr>
      <td style="background:#ffffff;padding:8px 40px 20px;">
        <h3 style="margin:0 0 14px;font-size:1rem;font-weight:700;color:#111827;border-left:4px solid #4f46e5;padding-left:10px;">✅ Attendance This Week</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr style="background:#f8fafc;">
            <td style="padding:12px 16px;text-align:center;">
              <div style="font-size:1.8rem;font-weight:800;color:${attColor};">${attendance.percentage}%</div>
              <div style="font-size:0.75rem;color:#6b7280;margin-top:2px;">Attendance Rate</div>
            </td>
            <td style="padding:12px 16px;text-align:center;border-left:1px solid #e5e7eb;">
              <div style="font-size:1.5rem;font-weight:800;color:#10b981;">${attendance.present}</div>
              <div style="font-size:0.75rem;color:#6b7280;margin-top:2px;">Present</div>
            </td>
            <td style="padding:12px 16px;text-align:center;border-left:1px solid #e5e7eb;">
              <div style="font-size:1.5rem;font-weight:800;color:#ef4444;">${attendance.absent}</div>
              <div style="font-size:0.75rem;color:#6b7280;margin-top:2px;">Absent</div>
            </td>
            <td style="padding:12px 16px;text-align:center;border-left:1px solid #e5e7eb;">
              <div style="font-size:1.5rem;font-weight:800;color:#f59e0b;">${attendance.late}</div>
              <div style="font-size:0.75rem;color:#6b7280;margin-top:2px;">Late</div>
            </td>
          </tr>
        </table>
        ${attendance.percentage < 75 ? `
        <div style="margin-top:10px;background:#fee2e2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:0.82rem;color:#b91c1c;">
          ⚠️ <strong>Attendance Warning:</strong> ${studentName}'s attendance is below 75%. Please ensure regular attendance.
        </div>` : ''}
      </td>
    </tr>

    <!-- Grades Section -->
    <tr>
      <td style="background:#ffffff;padding:8px 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
          <tr>
            <td><h3 style="margin:0;font-size:1rem;font-weight:700;color:#111827;border-left:4px solid #0891b2;padding-left:10px;">📊 Recent Grades</h3></td>
            <td align="right">
              <span style="background:${gradeColor(overallAvg)}20;color:${gradeColor(overallAvg)};padding:4px 14px;border-radius:20px;font-size:0.82rem;font-weight:700;">
                Overall Avg: ${overallAvg}% · ${gradeLetter(overallAvg)}
              </span>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 14px;text-align:left;font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Subject</th>
              <th style="padding:10px 14px;text-align:left;font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Exam</th>
              <th style="padding:10px 14px;text-align:left;font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Marks</th>
              <th style="padding:10px 14px;text-align:left;font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Score</th>
            </tr>
          </thead>
          <tbody>${gradeRows}</tbody>
        </table>
      </td>
    </tr>

    <!-- Homework Section -->
    <tr>
      <td style="background:#ffffff;padding:8px 40px 20px;">
        <h3 style="margin:0 0 14px;font-size:1rem;font-weight:700;color:#111827;border-left:4px solid #f59e0b;padding-left:10px;">📚 Pending Homework</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 14px;text-align:left;font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Subject</th>
              <th style="padding:10px 14px;text-align:left;font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Title</th>
              <th style="padding:10px 14px;text-align:left;font-size:0.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Due</th>
            </tr>
          </thead>
          <tbody>${hwRows}</tbody>
        </table>
      </td>
    </tr>

    <!-- AI Suggestions -->
    <tr>
      <td style="background:#ffffff;padding:8px 40px 28px;">
        <h3 style="margin:0 0 14px;font-size:1rem;font-weight:700;color:#111827;border-left:4px solid #7c3aed;padding-left:10px;">🤖 AI Recommendations</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;background:#faf5ff;">
          <tbody>${suggestionItems}</tbody>
        </table>
      </td>
    </tr>

    <!-- Divider -->
    <tr><td style="background:#ffffff;padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr>

    <!-- Footer -->
    <tr>
      <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:20px 40px 28px;text-align:center;">
        <p style="margin:0 0 6px;font-size:0.82rem;color:#6b7280;">
          Login to <strong style="color:#4f46e5;">SCOPE Portal</strong> to view detailed reports, chat with teachers, or request a meeting.
        </p>
        <p style="margin:0 0 4px;font-size:0.75rem;color:#9ca3af;">Sent on ${date}</p>
        <p style="margin:0;font-size:0.75rem;color:#9ca3af;">© ${new Date().getFullYear()} SCOPE – Smart Parent Engagement System</p>
        <p style="margin:8px 0 0;font-size:0.72rem;color:#d1d5db;">This is an automated weekly digest. Please do not reply to this email.</p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
};

module.exports = buildWeeklyDigestHtml;
