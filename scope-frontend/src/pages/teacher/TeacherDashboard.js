import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [homeworkDueToday, setHomeworkDueToday] = useState(0);
  const [recentHomework, setRecentHomework] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      setStudents(data);
      setLoading(false);
      if (data.length === 0) return;

      const today = new Date().toISOString().split('T')[0];
      const todayDate = new Date().toDateString();
      Promise.all(
        data.map(s => api.get(`/attendance/${s._id}?month=${today.slice(0, 7)}`).catch(() => null))
      ).then(results => {
        let present = 0, absent = 0, late = 0;
        results.forEach(r => {
          if (!r) return;
          (r.data.records || []).forEach(rec => {
            if (new Date(rec.date).toDateString() !== todayDate) return;
            if (rec.status === 'present') present++;
            else if (rec.status === 'absent') absent++;
            else if (rec.status === 'late') late++;
          });
        });
        const total = present + absent + late;
        if (total > 0) setTodayAttendance({ present, absent, late, total });
      });

      const classSections = [...new Set(data.map(s => `${s.class}-${s.section}`))];
      Promise.all(
        classSections.map(cs => api.get(`/homework/${cs}`).catch(() => null))
      ).then(results => {
        const allHw = results.flatMap(r => r?.data || []);
        const todayStr = new Date().toDateString();
        setHomeworkDueToday(allHw.filter(h => new Date(h.dueDate).toDateString() === todayStr).length);
        setRecentHomework(allHw.slice(0, 4));
      });
    }).catch(() => setLoading(false));
    api.get('/chat/meetings/list').then(({ data }) => setPendingMeetings(data.filter(m => m.status === 'pending'))).catch(() => {});
  }, []);

  const quickLinks = [
    { label: t('markAttendance'), path: '/teacher/attendance', color: '#10b981' },
    { label: t('addGrade'),       path: '/teacher/grades',     color: '#4f46e5' },
    { label: t('assignHomework'), path: '/teacher/homework',   color: '#f59e0b' },
    { label: t('aiRiskMonitor'),  path: '/teacher/risk',       color: '#ef4444' },
    { label: t('chat'),           path: '/teacher/chat',       color: '#0891b2' },
    { label: t('meetings'),       path: '/teacher/meetings',   color: '#7c3aed' },
  ];

  const linkedParents = students.filter(s => s.parent).length;

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#6b7280' }}>
        <div style={{ width: 22, height: 22, border: '3px solid #e5e7eb', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        {t('loading')}
      </div>
    </AppLayout>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

  return (
    <AppLayout>
      <div style={styles.welcome}>
        <div>
          <h2 style={styles.welcomeTitle}>Good {greeting}, {user?.name?.split(' ')[0]}</h2>
          <p style={styles.welcomeSub}>Here's what's happening in your class today.</p>
        </div>
        {pendingMeetings.length > 0 && (
          <div style={styles.alert}>
            <strong>{pendingMeetings.length}</strong> {t('pendingMeetings')}
            <Link to="/teacher/meetings" style={{ color: '#4f46e5', marginLeft: 8, fontWeight: 600 }}>{t('view')} →</Link>
          </div>
        )}
      </div>

      <div style={styles.statsRow}>
        <StatCard title={t('students')} value={students.length} color="blue" subtitle={`${linkedParents} ${t('parents')} linked`} />
        <StatCard title={t('pendingMeetings')} value={pendingMeetings.length} color="yellow" subtitle="Awaiting confirmation" />
        <StatCard title={t('homework')} value={homeworkDueToday} color="red" subtitle={t('dueToday')} />
        <StatCard title={t('todayAttendance')}
          value={todayAttendance ? `${todayAttendance.present}/${todayAttendance.total}` : t('markAttendance')}
          color={todayAttendance && todayAttendance.absent > 0 ? 'red' : 'green'}
          subtitle={todayAttendance ? `${todayAttendance.absent} ${t('absent')}, ${todayAttendance.late} ${t('late')}` : t('markAttendance')} />
      </div>

      <div style={styles.row}>
        <div style={styles.quickLinksCard}>
          <h3 style={styles.cardTitle}>{t('quickActions')}</h3>
          <div style={styles.quickGrid}>
            {quickLinks.map(q => (
              <Link key={q.label} to={q.path} style={{ ...styles.quickBtn, borderColor: q.color }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{q.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={styles.studentsCard}>
          <h3 style={styles.cardTitle}>{t('students')}</h3>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <p style={{ fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>{t('noData')}</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Ask your admin to assign students to your account.</p>
            </div>
          ) : (
            <div style={styles.studentList}>
              {students.slice(0, 8).map(s => (
                <div key={s._id} style={styles.studentRow}>
                  <div style={styles.sAvatar}>{s.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Roll: {s.rollNumber} · {t('class')} {s.class}-{s.section}</div>
                  </div>
                  <Badge label={s.parent ? 'Parent Linked' : 'No Parent'} type={s.parent ? 'success' : 'gray'} />
                </div>
              ))}
              {students.length > 8 && <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#9ca3af', padding: '8px 0' }}>+{students.length - 8} more students</p>}
            </div>
          )}
        </div>

        {recentHomework.length > 0 && (
          <div style={{ ...styles.studentsCard, minWidth: 240 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={styles.cardTitle}>{t('homework')}</h3>
              <Link to="/teacher/homework" style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>{t('view')} →</Link>
            </div>
            {recentHomework.map(hw => {
              const overdue = new Date(hw.dueDate) < new Date();
              return (
                <div key={hw._id} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '2px 7px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>{hw.subject}</span>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', marginTop: 4 }}>{hw.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{t('dueDate')}: {new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <Badge label={overdue ? t('overdue') : 'Active'} type={overdue ? 'danger' : 'success'} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const styles = {
  welcome: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  welcomeTitle: { fontSize: '1.3rem', fontWeight: 800, color: '#111827' },
  welcomeSub: { fontSize: '0.85rem', color: '#9ca3af', marginTop: 2 },
  alert: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '10px 16px', borderRadius: 8, fontSize: '0.88rem' },
  statsRow: { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  row: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  quickLinksCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 280, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: 16 },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  quickBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', background: '#f8fafc', borderRadius: 10, border: '1.5px solid', textDecoration: 'none', transition: 'background 0.15s' },
  studentsCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 280, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  studentList: { display: 'flex', flexDirection: 'column', gap: 2 },
  studentRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  sAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 },
};

export default TeacherDashboard;
