import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const StudentDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [homework, setHomework] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      if (data.length === 0) return;
      const s = data[0];
      setStudent(s);
      api.get(`/grades/${s._id}`).then(r => setGrades(r.data.grades || [])).catch(() => {});
      api.get(`/homework/${s.class}-${s.section}`).then(r => setHomework(r.data)).catch(() => {});
      api.get(`/attendance/${s._id}`).then(r => setAttendance(r.data)).catch(() => {});
      api.get(`/ai/recommendations/${s._id}`).then(r => setRecommendations(r.data.recommendations || [])).catch(() => {});
    }).catch(() => {});
  }, []);

  const subjectAvg = {};
  grades.forEach(g => {
    if (!subjectAvg[g.subject]) subjectAvg[g.subject] = [];
    subjectAvg[g.subject].push((g.marksObtained / g.totalMarks) * 100);
  });
  const subjects = Object.keys(subjectAvg);
  const avgScores = subjects.map(s => +(subjectAvg[s].reduce((a, b) => a + b, 0) / subjectAvg[s].length).toFixed(1));

  const radarData = {
    labels: subjects,
    datasets: [{ label: t('score') + ' %', data: avgScores, backgroundColor: 'rgba(79,70,229,0.15)', borderColor: '#4f46e5', pointBackgroundColor: '#4f46e5', pointRadius: 5 }]
  };

  const pendingHW = homework.filter(h => new Date(h.dueDate) >= new Date());
  const overdueHW = homework.filter(h => new Date(h.dueDate) < new Date());

  return (
    <AppLayout>
      {!student && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎓</div>
          <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>Your student profile is not linked yet</p>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>Contact your school admin to link your account.</p>
        </div>
      )}
      {student && (<>
      <div style={styles.banner}>
        <div style={styles.bannerLeft}>
          <div style={styles.avatar}>{user?.name?.[0]}</div>
          <div>
            <h2 style={styles.bannerName}>{t('welcome')}, {user?.name?.split(' ')[0]}! 👋</h2>
            {student && <p style={styles.bannerInfo}>{t('class')} {student.class}-{student.section} · Roll No: {student.rollNumber}</p>}
          </div>
        </div>
        <div style={styles.bannerRight}>
          <div style={styles.bannerStat}>
            <span style={styles.bannerStatVal}>{attendance?.summary.percentage || 0}%</span>
            <span style={styles.bannerStatLabel}>{t('attendance')}</span>
          </div>
          <div style={styles.bannerStat}>
            <span style={styles.bannerStatVal}>{grades.length}</span>
            <span style={styles.bannerStatLabel}>{t('grades')}</span>
          </div>
          <div style={styles.bannerStat}>
            <span style={styles.bannerStatVal}>{pendingHW.length}</span>
            <span style={styles.bannerStatLabel}>{t('pending')}</span>
          </div>
        </div>
      </div>

      <div style={styles.statsRow}>
        <StatCard title={t('attendance')} value={`${attendance?.summary.percentage || 0}%`} icon="✅" color={attendance?.summary.percentage < 75 ? 'red' : 'green'} subtitle={`${attendance?.summary.present || 0} days ${t('present')}`} />
        <StatCard title={t('homework')} value={pendingHW.length} icon="📚" color="yellow" subtitle={t('pending')} />
        <StatCard title={t('overdue')} value={overdueHW.length} icon="⚠️" color="red" subtitle={t('overdue')} />
        <StatCard title={t('subject')} value={subjects.length} icon="📖" color="purple" subtitle="Being tracked" />
      </div>

      <div style={styles.mainRow}>
        {subjects.length > 0 && (
          <div style={styles.chartCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>📊 {t('subjectPerformance')}</h3>
              <Link to="/student/grades" style={styles.viewAll}>{t('view')} →</Link>
            </div>
            <Radar data={radarData} options={{ responsive: true, scales: { r: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }} />
          </div>
        )}

        <div style={styles.hwCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📚 {t('homework')}</h3>
            <Link to="/student/homework" style={styles.viewAll}>{t('view')} →</Link>
          </div>
          {pendingHW.length === 0 && <div style={styles.noData}>🎉 {t('noPending')}</div>}
          {pendingHW.slice(0, 5).map(hw => {
            const daysLeft = Math.ceil((new Date(hw.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div key={hw._id} style={styles.hwItem}>
                <div style={styles.hwSubject}>{hw.subject}</div>
                <div style={styles.hwTitle}>{hw.title}</div>
                <div style={styles.hwFooter}>
                  <span style={{ fontSize: '0.75rem', color: daysLeft <= 1 ? '#ef4444' : '#9ca3af' }}>
                    {daysLeft <= 0 ? t('dueToday') : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                  </span>
                  <Badge label={daysLeft <= 1 ? 'Urgent' : t('pending')} type={daysLeft <= 1 ? 'danger' : 'warning'} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div style={styles.recSection}>
          <h3 style={styles.cardTitle}>🤖 {t('recommendations')}</h3>
          <div style={styles.recGrid}>
            {recommendations.map((r, i) => (
              <div key={i} style={{ ...styles.recCard, borderTop: `3px solid ${r.priority === 'high' ? '#ef4444' : '#f59e0b'}` }}>
                <div style={styles.recHeader}>
                  <span style={styles.recSubject}>{r.subject}</span>
                  <Badge label={`${t('average')}: ${r.average_score}%`} type={r.average_score < 40 ? 'danger' : 'warning'} />
                </div>
                <div style={styles.recSection2}>
                  <p style={styles.recLabel}>📝 Practice:</p>
                  <ul style={styles.recList}>{r.recommendations.exercises.slice(0, 2).map((e, j) => <li key={j}>{e}</li>)}</ul>
                </div>
                <div style={styles.recSection2}>
                  <p style={styles.recLabel}>🎥 Watch:</p>
                  <ul style={styles.recList}>{r.recommendations.videos.slice(0, 2).map((v, j) => <li key={j}>{v}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </AppLayout>
  );
};

const styles = {
  banner: { background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)', borderRadius: 14, padding: '20px 28px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  avatar: { width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem' },
  bannerName: { color: '#fff', fontSize: '1.2rem', fontWeight: 800 },
  bannerInfo: { color: '#c7d2fe', fontSize: '0.85rem', marginTop: 2 },
  bannerRight: { display: 'flex', gap: 24 },
  bannerStat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  bannerStatVal: { color: '#fff', fontSize: '1.6rem', fontWeight: 800 },
  bannerStatLabel: { color: '#c7d2fe', fontSize: '0.75rem' },
  statsRow: { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  mainRow: { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  chartCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 280, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  hwCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 260, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#111827' },
  viewAll: { fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600 },
  noData: { textAlign: 'center', color: '#9ca3af', padding: '30px', fontSize: '0.88rem' },
  hwItem: { padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  hwSubject: { display: 'inline-block', background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, marginBottom: 3 },
  hwTitle: { fontWeight: 600, fontSize: '0.88rem', color: '#111827', marginBottom: 4 },
  hwFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  recSection: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  recGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginTop: 14 },
  recCard: { background: '#f8fafc', borderRadius: 10, padding: '16px' },
  recHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recSubject: { fontWeight: 700, fontSize: '0.95rem', color: '#111827' },
  recSection2: { marginBottom: 8 },
  recLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', marginBottom: 4 },
  recList: { paddingLeft: 16, fontSize: '0.82rem', color: '#374151', lineHeight: 1.7 },
};

export default StudentDashboard;
