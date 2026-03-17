import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [homeworkDueToday, setHomeworkDueToday] = useState(0);
  const [recentHomework, setRecentHomework] = useState([]);
  const [pendingMeetings, setPendingMeetings] = useState([]);

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      setStudents(data);
      if (data.length > 0) {
        const s = data[0];
        // Today's attendance summary
        const today = new Date().toISOString().split('T')[0];
        api.get(`/attendance/${s._id}?month=${today.slice(0, 7)}`).then(r => {
          // Count today's records across all students
          const todayRecords = r.data.records?.filter(rec =>
            new Date(rec.date).toDateString() === new Date().toDateString()
          ) || [];
          if (todayRecords.length > 0) {
            const present = todayRecords.filter(r => r.status === 'present').length;
            const absent  = todayRecords.filter(r => r.status === 'absent').length;
            const late    = todayRecords.filter(r => r.status === 'late').length;
            setTodayAttendance({ present, absent, late, total: todayRecords.length });
          }
        }).catch(() => {});
        // Homework
        api.get(`/homework/${s.class}-${s.section}`).then(r => {
          const todayStr = new Date().toDateString();
          setHomeworkDueToday(r.data.filter(h => new Date(h.dueDate).toDateString() === todayStr).length);
          setRecentHomework(r.data.slice(0, 4));
        }).catch(() => {});
      }
    });
    api.get('/chat/meetings/list').then(({ data }) => setPendingMeetings(data.filter(m => m.status === 'pending'))).catch(() => {});
  }, []);

  const quickLinks = [
    { label: 'Mark Attendance', icon: '✅', path: '/teacher/attendance', color: '#10b981' },
    { label: 'Add Grades', icon: '📝', path: '/teacher/grades', color: '#4f46e5' },
    { label: 'Post Homework', icon: '📚', path: '/teacher/homework', color: '#f59e0b' },
    { label: 'AI Risk Monitor', icon: '🤖', path: '/teacher/risk', color: '#ef4444' },
    { label: 'Messages', icon: '💬', path: '/teacher/chat', color: '#0891b2' },
    { label: 'Meetings', icon: '📅', path: '/teacher/meetings', color: '#7c3aed' },
  ];

  const linkedParents = students.filter(s => s.parent).length;

  return (
    <AppLayout>
      <div style={styles.welcome}>
        <div>
          <h2 style={styles.welcomeTitle}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h2>
          <p style={styles.welcomeSub}>Here's what's happening in your class today.</p>
        </div>
        {pendingMeetings.length > 0 && (
          <div style={styles.alert}>
            📅 <strong>{pendingMeetings.length}</strong> pending meeting request{pendingMeetings.length > 1 ? 's' : ''}
            <Link to="/teacher/meetings" style={{ color: '#4f46e5', marginLeft: 8, fontWeight: 600 }}>View →</Link>
          </div>
        )}
      </div>

      <div style={styles.statsRow}>
        <StatCard title="My Students" value={students.length} icon="🎓" color="blue" subtitle={`${linkedParents} parents linked`} />
        <StatCard title="Pending Meetings" value={pendingMeetings.length} icon="📅" color="yellow" subtitle="Awaiting confirmation" />
        <StatCard title="HW Due Today" value={homeworkDueToday} icon="📚" color="red" subtitle="Assignments due today" />
        <StatCard title="Today Attendance"
          value={todayAttendance ? `${todayAttendance.present}/${todayAttendance.total}` : 'Not marked'}
          icon="✅" color={todayAttendance && todayAttendance.absent > 0 ? 'red' : 'green'}
          subtitle={todayAttendance ? `${todayAttendance.absent} absent, ${todayAttendance.late} late` : 'Mark attendance'} />
      </div>

      <div style={styles.row}>
        <div style={styles.quickLinksCard}>
          <h3 style={styles.cardTitle}>Quick Actions</h3>
          <div style={styles.quickGrid}>
            {quickLinks.map(q => (
              <Link key={q.label} to={q.path} style={{ ...styles.quickBtn, borderColor: q.color }}>
                <span style={{ fontSize: '1.6rem' }}>{q.icon}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{q.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={styles.studentsCard}>
          <h3 style={styles.cardTitle}>My Students</h3>
          <div style={styles.studentList}>
            {students.slice(0, 8).map(s => (
              <div key={s._id} style={styles.studentRow}>
                <div style={styles.sAvatar}>{s.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Roll: {s.rollNumber} · Class {s.class}-{s.section}</div>
                </div>
                <Badge label={s.parent ? 'Parent Linked' : 'No Parent'} type={s.parent ? 'success' : 'gray'} />
              </div>
            ))}
            {students.length > 8 && <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#9ca3af', padding: '8px 0' }}>+{students.length - 8} more students</p>}
          </div>
        </div>

        {/* Recent Homework */}
        {recentHomework.length > 0 && (
          <div style={{ ...styles.studentsCard, minWidth: 240 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={styles.cardTitle}>Recent Homework</h3>
              <Link to="/teacher/homework" style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600 }}>View All →</Link>
            </div>
            {recentHomework.map(hw => {
              const overdue = new Date(hw.dueDate) < new Date();
              return (
                <div key={hw._id} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '2px 7px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>{hw.subject}</span>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', marginTop: 4 }}>{hw.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Due: {new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <Badge label={overdue ? 'Overdue' : 'Active'} type={overdue ? 'danger' : 'success'} />
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
