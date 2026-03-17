import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const TYPE_CFG = {
  absence:      { icon: '🚨', color: '#ef4444', bg: '#fef2f2', label: 'Absence Alert' },
  performance:  { icon: '📊', color: '#f59e0b', bg: '#fffbeb', label: 'Performance' },
  homework:     { icon: '📚', color: '#4f46e5', bg: '#f5f3ff', label: 'Homework' },
  exam:         { icon: '📝', color: '#0891b2', bg: '#ecfeff', label: 'Exam' },
  announcement: { icon: '📢', color: '#059669', bg: '#f0fdf4', label: 'Announcement' },
  meeting:      { icon: '📅', color: '#7c3aed', bg: '#f5f3ff', label: 'Meeting' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const types = ['all', ...Object.keys(TYPE_CFG)];

  const filtered = notifications
    .filter(n => filter === 'all' || n.type === filter)
    .filter(n => !showUnreadOnly || !n.isRead);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppLayout>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Notifications</h2>
          <p style={S.sub}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            {' · '}{notifications.length} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={S.toggleLabel}>
            <input type="checkbox" checked={showUnreadOnly} onChange={e => setShowUnreadOnly(e.target.checked)} style={{ marginRight: 6 }} />
            Unread only
          </label>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={S.markAllBtn}>✓ Mark all read</button>
          )}
        </div>
      </div>

      {/* Type filters */}
      <div style={S.filters}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ ...S.filterBtn, background: filter === t ? '#4f46e5' : '#fff', color: filter === t ? '#fff' : '#374151', borderColor: filter === t ? '#4f46e5' : '#e5e7eb' }}>
            {t === 'all' ? 'All' : TYPE_CFG[t].label}
            {t !== 'all' && (
              <span style={{ marginLeft: 6, background: filter === t ? 'rgba(255,255,255,0.25)' : '#f3f4f6', borderRadius: 10, padding: '0 6px', fontSize: '0.7rem' }}>
                {notifications.filter(n => n.type === t).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={S.list}>
        {loading && <div style={S.empty}><p>Loading...</p></div>}

        {!loading && filtered.length === 0 && (
          <div style={S.empty}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔔</div>
            <p style={{ fontWeight: 600, color: '#374151' }}>No notifications</p>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
              {showUnreadOnly ? 'No unread notifications.' : 'You\'re all caught up!'}
            </p>
          </div>
        )}

        {filtered.map(n => {
          const cfg = TYPE_CFG[n.type] || { icon: '📌', color: '#6b7280', bg: '#f3f4f6', label: n.type };
          return (
            <div key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              style={{
                ...S.card,
                background: n.isRead ? '#fff' : cfg.bg,
                borderLeft: `4px solid ${cfg.color}`,
                cursor: n.isRead ? 'default' : 'pointer',
              }}>
              {/* Icon */}
              <div style={{ ...S.iconBox, background: n.isRead ? '#f3f4f6' : '#fff', color: cfg.color }}>
                {cfg.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.cardTitle}>
                  {n.title}
                  {!n.isRead && <span style={S.unreadDot} />}
                </div>
                <div style={S.cardBody}>{n.body}</div>
                <div style={S.cardMeta}>
                  <span style={{ ...S.typeBadge, background: n.isRead ? '#f3f4f6' : '#fff', color: cfg.color }}>{cfg.label}</span>
                  {n.channels?.length > 0 && n.channels.map(ch => (
                    <span key={ch} style={S.chBadge}>{ch}</span>
                  ))}
                  <span style={S.time}>{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                {!n.isRead && <span style={S.newBadge}>NEW</span>}
                <button onClick={(e) => deleteOne(e, n._id)} style={S.deleteBtn} title="Delete">✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

const S = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub: { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  toggleLabel: { display: 'flex', alignItems: 'center', fontSize: '0.82rem', fontWeight: 600, color: '#374151', cursor: 'pointer' },
  markAllBtn: { background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  filters: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn: { padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  empty: { background: '#fff', borderRadius: 12, padding: '60px 20px', textAlign: 'center', color: '#9ca3af' },
  card: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' },
  iconBox: { width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
  cardTitle: { fontWeight: 700, fontSize: '0.9rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', display: 'inline-block', flexShrink: 0 },
  cardBody: { fontSize: '0.85rem', color: '#374151', lineHeight: 1.5, marginBottom: 6 },
  cardMeta: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  typeBadge: { padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 },
  chBadge: { background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 },
  time: { fontSize: '0.75rem', color: '#9ca3af' },
  newBadge: { background: '#4f46e5', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 },
  deleteBtn: { background: 'none', border: 'none', color: '#d1d5db', fontSize: '0.85rem', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 },
};

export default Notifications;
