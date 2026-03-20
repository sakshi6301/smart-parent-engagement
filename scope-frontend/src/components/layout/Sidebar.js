import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const menus = {
  admin: [
    { path: '/admin',                 key: 'dashboard',      icon: '🏠', exact: true },
    { path: '/admin/students',        key: 'students',       icon: '🎓' },
    { path: '/admin/teachers',        key: 'teachers',       icon: '👨🏫' },
    { path: '/admin/parents',         key: 'parents',        icon: '👨‍👩‍👧' },
    { path: '/admin/users',           key: 'userManagement', icon: '👥' },
    { path: '/admin/link-management', key: 'linkManagement', icon: '🔗' },
    { path: '/admin/analytics',       key: 'analytics',      icon: '📊' },
    { path: '/admin/notifications',   key: 'notifications',  icon: '🔔' },
    { path: '/admin/bulk-import',     key: 'bulkImport',     icon: '📥' },
    { path: '/admin/ai-model',        key: 'aiModel',        icon: '🤖' },
    { path: '/feedback',              key: 'feedback',       icon: '💬' },
  ],
  teacher: [
    { path: '/teacher',               key: 'dashboard',      icon: '🏠', exact: true },
    { path: '/teacher/attendance',    key: 'attendance',     icon: '✅' },
    { path: '/teacher/grades',        key: 'grades',         icon: '📝' },
    { path: '/teacher/homework',      key: 'homework',       icon: '📚' },
    { path: '/teacher/chat',          key: 'chat',           icon: '💬' },
    { path: '/teacher/meetings',      key: 'meetings',       icon: '📅' },
    { path: '/teacher/notifications', key: 'notifications',  icon: '🔔' },
    { path: '/teacher/risk',          key: 'aiRiskMonitor',  icon: '🤖' },
    { path: '/feedback',              key: 'feedback',       icon: '📣' },
  ],
  parent: [
    { path: '/parent',                key: 'dashboard',      icon: '🏠', exact: true },
    { path: '/parent/attendance',     key: 'attendance',     icon: '✅' },
    { path: '/parent/grades',         key: 'performance',    icon: '📊' },
    { path: '/parent/homework',       key: 'homework',       icon: '📚' },
    { path: '/parent/chat',           key: 'chatWithTeacher',icon: '💬' },
    { path: '/parent/meetings',       key: 'meetings',       icon: '📅' },
    { path: '/parent/notifications',  key: 'notifications',  icon: '🔔' },
    { path: '/feedback',              key: 'feedback',       icon: '📣' },
  ],
  student: [
    { path: '/student',                 key: 'dashboard',      icon: '🏠', exact: true },
    { path: '/student/grades',          key: 'myGrades',       icon: '📝' },
    { path: '/student/homework',        key: 'homework',       icon: '📚' },
    { path: '/student/attendance',      key: 'attendance',     icon: '✅' },
    { path: '/student/chat',            key: 'chatWithTeacher',icon: '💬' },
    { path: '/student/notifications',   key: 'notifications',  icon: '🔔' },
    { path: '/student/recommendations', key: 'aiStudyTips',    icon: '🤖' },
    { path: '/feedback',                key: 'feedback',       icon: '📣' },
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
  const { t, i18n } = useTranslation();
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
            {!collapsed && <span style={styles.navLabel}>{t(item.key)}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={styles.bottom}>
        {!collapsed && (
          <select onChange={(e) => i18n.changeLanguage(e.target.value)} value={i18n.language} style={styles.langSelect}>
            <option value="en">🌐 English</option>
            <option value="hi">🌐 हिंदी</option>
            <option value="mr">🌐 मराठी</option>
          </select>
        )}
        <button onClick={handleLogout} style={styles.logoutBtn} title={t('logout')}>
          <span>🚪</span>{!collapsed && <span> {t('logout')}</span>}
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
