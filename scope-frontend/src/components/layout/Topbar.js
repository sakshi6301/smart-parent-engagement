import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const pageTitles = {
  '/admin': 'Dashboard', '/admin/students': 'Manage Students', '/admin/teachers': 'Manage Teachers',
  '/admin/users': 'User Management', '/admin/analytics': 'Analytics', '/admin/notifications': 'Send Notifications',
  '/teacher': 'Dashboard', '/teacher/attendance': 'Mark Attendance', '/teacher/grades': 'Grade Manager',
  '/teacher/homework': 'Homework Manager', '/teacher/chat': 'Messages', '/teacher/meetings': 'Meetings', '/teacher/risk': 'AI Risk Monitor',
  '/parent': 'Dashboard', '/parent/attendance': 'Attendance', '/parent/grades': 'Academic Performance',
  '/parent/homework': 'Homework Tracker', '/parent/chat': 'Chat with Teacher', '/parent/meetings': 'Meeting Requests', '/parent/notifications': 'Notifications',
  '/student': 'Dashboard', '/student/grades': 'My Grades', '/student/homework': 'My Homework',
  '/student/attendance': 'My Attendance', '/student/recommendations': 'AI Study Recommendations',
  '/feedback': 'Feedback & Concerns',
};

const Topbar = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const title = pageTitles[location.pathname] || 'SCOPE';

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setUnread(data.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, [location.pathname]);

  return (
    <header style={styles.topbar}>
      <div style={styles.left}>
        <button onClick={() => setCollapsed(!collapsed)} style={styles.toggleBtn} title="Toggle Sidebar">
          {collapsed ? '☰' : '✕'}
        </button>
        <div>
          <h1 style={styles.title}>{title}</h1>
          <p style={styles.breadcrumb}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      <div style={styles.right}>
        <div style={styles.notifWrap}>
          <span style={styles.notifIcon}>🔔</span>
          {unread > 0 && <span style={styles.badge}>{unread}</span>}
        </div>
        <div style={styles.userChip}>
          <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userRole}>{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

const styles = {
  topbar: { height: 64, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  toggleBtn: { background: 'none', border: 'none', fontSize: '1.2rem', color: '#6b7280', padding: '6px', borderRadius: 6, lineHeight: 1 },
  title: { fontSize: '1.1rem', fontWeight: 700, color: '#111827' },
  breadcrumb: { fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 },
  right: { display: 'flex', alignItems: 'center', gap: 20 },
  notifWrap: { position: 'relative', cursor: 'pointer' },
  notifIcon: { fontSize: '1.3rem' },
  badge: { position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userChip: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: '#f3f4f6', borderRadius: 30 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' },
  userName: { fontSize: '0.85rem', fontWeight: 600, color: '#111827' },
  userRole: { fontSize: '0.72rem', color: '#6b7280', textTransform: 'capitalize' },
};

export default Topbar;
