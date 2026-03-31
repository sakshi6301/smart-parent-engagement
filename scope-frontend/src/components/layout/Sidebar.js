import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const menus = {
  admin: [
    { path: '/admin',                 key: 'dashboard',      icon: '⊞', exact: true },
    { path: '/admin/students',        key: 'students',       icon: '◎' },
    { path: '/admin/teachers',        key: 'teachers',       icon: '◈' },
    { path: '/admin/parents',         key: 'parents',        icon: '◉' },
    { path: '/admin/users',           key: 'userManagement', icon: '▤' },
    { path: '/admin/link-management', key: 'linkManagement', icon: '⇌' },
    { path: '/admin/analytics',       key: 'analytics',      icon: '▦' },
    { path: '/admin/notifications',   key: 'notifications',  icon: '◫' },
    { path: '/admin/bulk-import',     key: 'bulkImport',     icon: '↧' },
    { path: '/admin/ai-model',        key: 'aiModel',        icon: '◈' },
    { path: '/feedback',              key: 'feedback',       icon: '◷' },
  ],
  teacher: [
    { path: '/teacher',               key: 'dashboard',      icon: '⊞', exact: true },
    { path: '/teacher/attendance',    key: 'attendance',     icon: '◎' },
    { path: '/teacher/grades',        key: 'grades',         icon: '▤' },
    { path: '/teacher/homework',      key: 'homework',       icon: '▦' },
    { path: '/teacher/chat',          key: 'chat',           icon: '◫' },
    { path: '/teacher/meetings',      key: 'meetings',       icon: '◷' },
    { path: '/teacher/notifications', key: 'notifications',  icon: '◫' },
    { path: '/teacher/risk',          key: 'aiRiskMonitor',  icon: '◈' },
    { path: '/feedback',              key: 'feedback',       icon: '◉' },
  ],
  parent: [
    { path: '/parent',                key: 'dashboard',      icon: '⊞', exact: true },
    { path: '/parent/attendance',     key: 'attendance',     icon: '◎' },
    { path: '/parent/grades',         key: 'performance',    icon: '▦' },
    { path: '/parent/homework',       key: 'homework',       icon: '▤' },
    { path: '/parent/engagement',     key: 'engagement',     icon: '◈' },
    { path: '/parent/chat',           key: 'chatWithTeacher',icon: '◫' },
    { path: '/parent/meetings',       key: 'meetings',       icon: '◷' },
    { path: '/parent/notifications',  key: 'notifications',  icon: '◫' },
    { path: '/feedback',              key: 'feedback',       icon: '◉' },
  ],
  student: [
    { path: '/student',                 key: 'dashboard',      icon: '⊞', exact: true },
    { path: '/student/grades',          key: 'myGrades',       icon: '▤' },
    { path: '/student/homework',        key: 'homework',       icon: '▦' },
    { path: '/student/attendance',      key: 'attendance',     icon: '◎' },
    { path: '/student/chat',            key: 'chatWithTeacher',icon: '◫' },
    { path: '/student/notifications',   key: 'notifications',  icon: '◫' },
    { path: '/student/recommendations', key: 'aiStudyTips',    icon: '◈' },
    { path: '/feedback',                key: 'feedback',       icon: '◉' },
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
  const [unread, setUnread] = useState(0);
  const items = menus[user?.role] || [];
  const color = roleColors[user?.role] || '#4f46e5';

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setUnread(data.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{ ...styles.sidebar, width: collapsed ? 64 : 240 }}>
      <div style={styles.logo}>
        <div style={styles.logoMark}>SC</div>
        {!collapsed && <span style={styles.logoText}>SCOPE</span>}
      </div>

      {!collapsed && (
        <div style={{ ...styles.roleBadge, background: color }}>
          <div style={styles.roleAvatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.roleName}>{user?.name}</div>
            <div style={styles.roleLabel}>{roleLabels[user?.role]}</div>
          </div>
        </div>
      )}

      <nav style={styles.nav}>
        {items.map(item => (
          <NavLink key={item.path} to={item.path} end={item.exact}
            style={({ isActive }) => ({
              ...styles.navItem,
              background: isActive ? color : 'transparent',
              color: isActive ? '#fff' : '#c7d2fe',
            })}>
            <span style={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span style={styles.navLabel}>{t(item.key)}</span>}
            {!collapsed && item.key === 'notifications' && unread > 0 && (
              <span style={styles.unreadBadge}>{unread > 99 ? '99+' : unread}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={styles.bottom}>
        {!collapsed && (
          <select
            onChange={e => i18n.changeLanguage(e.target.value)}
            value={i18n.language}
            style={styles.langSelect}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        )}
        <button onClick={handleLogout} style={styles.logoutBtn} title={t('logout')}>
          <span style={styles.logoutIcon}>←</span>
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar:    { height: '100vh', background: '#1e1b4b', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100, transition: 'width 0.2s ease', overflow: 'hidden' },
  logo:       { display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoMark:   { width: 32, height: 32, borderRadius: 8, background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.78rem', letterSpacing: 1, flexShrink: 0 },
  logoText:   { color: '#fff', fontSize: '1.3rem', fontWeight: 800, letterSpacing: 2 },
  roleBadge:  { display: 'flex', alignItems: 'center', gap: 10, margin: '12px', padding: '10px 12px', borderRadius: 10 },
  roleAvatar: { width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  roleName:   { color: '#fff', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 },
  roleLabel:  { color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', marginTop: 1 },
  nav:        { flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem:    { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, transition: 'background 0.15s', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', textDecoration: 'none' },
  navIcon:    { fontSize: '1rem', flexShrink: 0, width: 20, textAlign: 'center', opacity: 0.85 },
  navLabel:   {},
  unreadBadge: { marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 700, borderRadius: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center' },
  bottom:     { padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 8 },
  langSelect: { background: 'rgba(255,255,255,0.08)', color: '#c7d2fe', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 10px', borderRadius: 8, fontSize: '0.82rem', width: '100%', outline: 'none' },
  logoutBtn:  { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: 'none', padding: '9px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500, width: '100%', cursor: 'pointer' },
  logoutIcon: { fontSize: '1rem', fontWeight: 700 },
};

export default Sidebar;
