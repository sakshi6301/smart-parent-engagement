import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const ParentDashboard = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [grades, setGrades] = useState([]);
  const [risk, setRisk] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [homework, setHomework] = useState([]);

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      if (data.length > 0) {
        const s = data[0];
        setStudent(s);
        api.get(`/attendance/${s._id}`).then(r => setAttendance(r.data)).catch(() => {});
        api.get(`/grades/${s._id}`).then(r => setGrades(r.data.grades || [])).catch(() => {});
        api.get(`/ai/risk/${s._id}`).then(r => setRisk(r.data)).catch(() => {});
        api.get(`/homework/${s.class}-${s.section}`).then(r => setHomework(r.data)).catch(() => {});
        api.get(`/analytics/engagement/${user._id}`).then(r => setEngagement(r.data[0])).catch(() => {});
      }
    });
    api.get('/notifications').then(({ data }) => setNotifications(data.slice(0, 6))).catch(() => {});
  }, [user._id]);

  const riskConfig = { low: { color: '#10b981', bg: '#f0fdf4', badge: 'success' }, medium: { color: '#f59e0b', bg: '#fffbeb', badge: 'warning' }, high: { color: '#ef4444', bg: '#fef2f2', badge: 'danger' } };
  const rc = risk?.risk_level ? riskConfig[risk.risk_level] : null;

  const gradeChartData = {
    labels: grades.slice(-8).map(g => `${g.subject.slice(0, 4)} (${g.examType.slice(0, 3)})`),
    datasets: [{ label: 'Score %', data: grades.slice(-8).map(g => +((g.marksObtained / g.totalMarks) * 100).toFixed(1)), borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.08)', tension: 0.4, pointBackgroundColor: '#4f46e5', pointRadius: 5 }]
  };

  const pendingHW = homework.filter(h => new Date(h.dueDate) >= new Date());
  const notifTypes = { absence: '🚨', performance: '📊', homework: '📚', exam: '📝', announcement: '📢', meeting: '📅' };

  return (
    <AppLayout>
      {student && (
        <div style={styles.childBanner}>
          <div style={styles.childAvatar}>{student.name[0]}</div>
          <div>
            <h2 style={styles.childName}>{student.name}</h2>
            <p style={styles.childInfo}>Class {student.class}-{student.section} · Roll No: {student.rollNumber}</p>
          </div>
          {rc && <div style={{ ...styles.riskPill, background: rc.bg, color: rc.color, border: `1.5px solid ${rc.color}` }}>
            AI Risk: <strong>{risk.risk_level.toUpperCase()}</strong>
          </div>}
        </div>
      )}

      <div style={styles.statsRow}>
        <StatCard title="Attendance" value={attendance ? `${attendance.summary.percentage}%` : '—'} icon="✅" color={attendance?.summary.percentage < 75 ? 'red' : 'green'} subtitle={attendance ? `${attendance.summary.present} present / ${attendance.summary.absent} absent` : 'Loading...'} />
        <StatCard title="Pending Homework" value={pendingHW.length} icon="📚" color="yellow" subtitle="Due assignments" />
        <StatCard title="Engagement Score" value={engagement ? `${engagement.score}/100` : '—'} icon="⭐" color="purple" subtitle={engagement ? `Level: ${engagement.level}` : 'Not calculated yet'} />
        <StatCard title="Unread Alerts" value={notifications.filter(n => !n.isRead).length} icon="🔔" color="red" subtitle="New notifications" />
      </div>

      <div style={styles.mainRow}>
        {/* Performance Chart */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📊 Academic Performance</h3>
            <Link to="/parent/grades" style={styles.viewAll}>View All →</Link>
          </div>
          {grades.length > 0
            ? <Line data={gradeChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }} />
            : <div style={styles.noData}>No grades recorded yet</div>}
        </div>

        {/* Notifications */}
        <div style={styles.notifCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>🔔 Recent Alerts</h3>
            <Link to="/parent/notifications" style={styles.viewAll}>View All →</Link>
          </div>
          {notifications.length === 0 && <div style={styles.noData}>No notifications yet</div>}
          {notifications.map(n => (
            <div key={n._id} style={{ ...styles.notifItem, background: n.isRead ? '#fff' : '#f5f3ff' }}>
              <span style={styles.notifIcon}>{notifTypes[n.type] || '📌'}</span>
              <div style={{ flex: 1 }}>
                <div style={styles.notifTitle}>{n.title}</div>
                <div style={styles.notifBody}>{n.body}</div>
              </div>
              <div style={styles.notifTime}>{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      {risk?.suggestions?.length > 0 && (
        <div style={styles.suggestCard}>
          <h3 style={styles.cardTitle}>🤖 AI Recommendations for {student?.name}</h3>
          <div style={styles.suggestGrid}>
            {risk.suggestions.map((s, i) => (
              <div key={i} style={styles.suggestItem}>
                <span style={styles.suggestIcon}>💡</span>
                <span style={styles.suggestText}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const styles = {
  childBanner: { display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)', borderRadius: 14, padding: '20px 24px', marginBottom: 20, flexWrap: 'wrap' },
  childAvatar: { width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0 },
  childName: { color: '#fff', fontSize: '1.2rem', fontWeight: 800 },
  childInfo: { color: '#c7d2fe', fontSize: '0.85rem', marginTop: 2 },
  riskPill: { marginLeft: 'auto', padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  mainRow: { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  chartCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', flex: 2, minWidth: 300, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  notifCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 260, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', maxHeight: 420, overflowY: 'auto' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#111827' },
  viewAll: { fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600 },
  noData: { textAlign: 'center', color: '#9ca3af', padding: '30px', fontSize: '0.88rem' },
  notifItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px', borderRadius: 8, marginBottom: 6 },
  notifIcon: { fontSize: '1.1rem', flexShrink: 0 },
  notifTitle: { fontWeight: 600, fontSize: '0.85rem', color: '#111827' },
  notifBody: { fontSize: '0.78rem', color: '#6b7280', marginTop: 2 },
  notifTime: { fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap' },
  suggestCard: { background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  suggestGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginTop: 12 },
  suggestItem: { display: 'flex', gap: 10, background: '#fff', borderRadius: 8, padding: '12px', alignItems: 'flex-start' },
  suggestIcon: { fontSize: '1.1rem', flexShrink: 0 },
  suggestText: { fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 },
};

export default ParentDashboard;
