import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const menus = {
  admin: [
    { path: '/admin',              label: 'Dashboard',       icon: '🏠', exact: true },
    { path: '/admin/students',     label: 'Students',        icon: '🎓' },
    { path: '/admin/teachers',     label: 'Teachers',        icon: '👨‍🏫' },
    { path: '/admin/parents',      label: 'Parents',         icon: '👨‍👩‍👧' },
    { path: '/admin/users',        label: 'User Management', icon: '👥' },
    { path: '/admin/link-management', label: 'Link Management', icon: '🔗' },
    { path: '/admin/analytics',    label: 'Analytics',       icon: '📊' },
    { path: '/admin/notifications',label: 'Notifications',   icon: '🔔' },
    { path: '/admin/bulk-import',  label: 'Bulk Import',     icon: '📥' },
    { path: '/admin/ai-model',     label: 'AI Model',        icon: '🤖' },
    { path: '/feedback',           label: 'Feedback',        icon: '💬' },
  ],
  teacher: [
    { path: '/teacher',             label: 'Dashboard',      icon: '🏠', exact: true },
    { path: '/teacher/attendance',  label: 'Attendance',     icon: '✅' },
    { path: '/teacher/grades',      label: 'Grades',         icon: '📝' },
    { path: '/teacher/homework',    label: 'Homework',       icon: '📚' },
    { path: '/teacher/chat',        label: 'Messages',       icon: '💬' },
    { path: '/teacher/meetings',       label: 'Meetings',       icon: '📅' },
    { path: '/teacher/notifications',  label: 'Notifications',  icon: '🔔' },
    { path: '/teacher/risk',           label: 'AI Risk Monitor',icon: '🤖' },
    { path: '/feedback',               label: 'Feedback',       icon: '📣' },
  ],
  parent: [
    { path: '/parent',              label: 'Dashboard',        icon: '🏠', exact: true },
    { path: '/parent/attendance',   label: 'Attendance',       icon: '✅' },
    { path: '/parent/grades',       label: 'Performance',      icon: '📊' },
    { path: '/parent/homework',     label: 'Homework',         icon: '📚' },
    { path: '/parent/chat',         label: 'Chat with Teacher',icon: '💬' },
    { path: '/parent/meetings',     label: 'Meetings',         icon: '📅' },
    { path: '/parent/notifications',label: 'Notifications',    icon: '🔔' },
    { path: '/feedback',            label: 'Feedback',         icon: '📣' },
  ],
  student: [
    { path: '/student',                  label: 'Dashboard',    icon: '🏠', exact: true },
    { path: '/student/grades',           label: 'My Grades',    icon: '📝' },
    { path: '/student/homework',         label: 'Homework',     icon: '📚' },
    { path: '/student/attendance',       label: 'Attendance',   icon: '✅' },
    { path: '/student/chat',             label: 'Chat with Teacher', icon: '💬' },
    { path: '/student/recommendations',  label: 'AI Study Tips',icon: '🤖' },
    { path: '/feedback',                 label: 'Feedback',     icon: '📣' },
  ],
};

const roleColors = {
  admin:   '#7c3aed',
  teacher: '#0891b2',
  parent:  '#059669',
  student: '#d97706',
};

const roleLabels = { admin: 'Administrator', teacher: 'Teacher', parent: 'Parent', student: 'Student' };

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const items = menus[user?.role] || [];
  const color = roleColors[user?.role] || '#4f46e5';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{ ...styles.sidebar, width: collapsed ? 64 : 240 }}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>🎓</span>
        {!collapsed && <span style={styles.logoText}>SCOPE</span>}
      </div>

      {!collapsed && (
        <div style={{ ...styles.roleBadge, background: color }}>
          <div style={styles.roleAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={styles.roleName}>{user?.name}</div>
            <div style={styles.roleLabel}>{roleLabels[user?.role]}</div>
          </div>
        </div>
      )}

      <nav style={styles.nav}>
        {items.map(item => (
          <NavLink key={item.path} to={item.path} end={item.exact}
            style={({ isActive }) => ({ ...styles.navItem, background: isActive ? color : 'transparent', color: isActive ? '#fff' : '#c7d2fe' })}>
            <span style={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={styles.bottom}>
        {!collapsed && (
          <select onChange={(e) => i18n.changeLanguage(e.target.value)} defaultValue={i18n.language} style={styles.langSelect}>
            <option value="en">🌐 English</option>
            <option value="hi">🌐 हिंदी</option>
            <option value="mr">🌐 मराठी</option>
          </select>
        )}
        <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
          <span>🚪</span>{!collapsed && <span> Logout</span>}
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar:    { height: '100vh', background: '#1e1b4b', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100, transition: 'width 0.2s ease', overflow: 'hidden' },
  logo:       { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoIcon:   { fontSize: '1.6rem' },
  logoText:   { color: '#fff', fontSize: '1.4rem', fontWeight: 800, letterSpacing: 1 },
  roleBadge:  { display: 'flex', alignItems: 'center', gap: 10, margin: '12px', padding: '10px 12px', borderRadius: 10 },
  roleAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
  roleName:   { color: '#fff', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 },
  roleLabel:  { color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem' },
  nav:        { flex: 1, padding: '8px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem:    { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, transition: 'all 0.15s', fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap', textDecoration: 'none' },
  navIcon:    { fontSize: '1.1rem', flexShrink: 0, width: 22, textAlign: 'center' },
  navLabel:   {},
  bottom:     { padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 8 },
  langSelect: { background: 'rgba(255,255,255,0.1)', color: '#c7d2fe', border: 'none', padding: '8px 10px', borderRadius: 8, fontSize: '0.82rem', width: '100%' },
  logoutBtn:  { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'none', padding: '10px 12px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 500, width: '100%', cursor: 'pointer' },
};

export default Sidebar;
