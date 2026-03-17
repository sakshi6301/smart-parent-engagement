const TYPE_CONFIG = {
  absence:      { label: 'Absence Alert',   color: '#ef4444', icon: '🔴' },
  performance:  { label: 'Performance',     color: '#f59e0b', icon: '📊' },
  homework:     { label: 'Homework',        color: '#4f46e5', icon: '📚' },
  exam:         { label: 'Exam',            color: '#0891b2', icon: '📝' },
  announcement: { label: 'Announcement',    color: '#059669', icon: '📢' },
  meeting:      { label: 'Meeting',         color: '#7c3aed', icon: '🤝' },
};

const buildEmailHtml = ({ recipientName, title, body, type = 'announcement' }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.announcement;
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
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="font-size:2rem;margin-bottom:8px;">🎓</div>
            <h1 style="margin:0;color:#ffffff;font-size:1.6rem;font-weight:800;letter-spacing:-0.5px;">SCOPE</h1>
            <p style="margin:4px 0 0;color:#c4b5fd;font-size:0.85rem;letter-spacing:1px;text-transform:uppercase;">Smart Parent Engagement System</p>
          </td>
        </tr>

        <!-- Type Badge -->
        <tr>
          <td style="background:#ffffff;padding:0 40px;">
            <div style="margin-top:24px;display:inline-block;background:${cfg.color}15;border:1.5px solid ${cfg.color}40;border-radius:20px;padding:6px 16px;font-size:0.78rem;font-weight:700;color:${cfg.color};">
              ${cfg.icon}&nbsp;&nbsp;${cfg.label}
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:20px 40px 32px;">
            <p style="margin:0 0 8px;font-size:0.85rem;color:#9ca3af;">Dear <strong style="color:#374151;">${recipientName || 'Parent/Guardian'}</strong>,</p>
            <h2 style="margin:12px 0 16px;font-size:1.25rem;font-weight:700;color:#111827;line-height:1.4;">${title}</h2>
            <div style="background:#f9fafb;border-left:4px solid ${cfg.color};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:0.95rem;color:#374151;line-height:1.7;">${body}</p>
            </div>
            <p style="margin:0;font-size:0.82rem;color:#6b7280;">If you have any questions, please contact your child's teacher or visit the SCOPE portal.</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="background:#ffffff;padding:0 40px;">
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:20px 40px 28px;text-align:center;">
            <p style="margin:0 0 4px;font-size:0.78rem;color:#9ca3af;">Sent on ${date}</p>
            <p style="margin:0;font-size:0.78rem;color:#9ca3af;">© ${new Date().getFullYear()} SCOPE – Smart Parent Engagement System. All rights reserved.</p>
            <p style="margin:8px 0 0;font-size:0.75rem;color:#d1d5db;">This is an automated message. Please do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

module.exports = buildEmailHtml;
