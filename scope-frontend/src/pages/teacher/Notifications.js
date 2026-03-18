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

const CHANNEL_LABELS = { push: 'Push', email: 'Email', sms: 'SMS' };

const TeacherNotifications = () => {
  const [tab, setTab] = useState('inbox');

  // Inbox
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Compose
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', type: 'announcement', channels: ['push'], audience: 'my_class' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  useEffect(() => {
    api.get('/students').then(({ data }) => setStudents(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // Inbox actions
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

  // Compose
  const toggleChannel = (ch) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }));
  };

  // Build audience options from teacher's students
  const classSections = [...new Set(students.map(s => `${s.class}_${s.section}`))].sort();

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return setMsg('ERR:Title and message are required.');
    if (!form.channels.length) return setMsg('ERR:Select at least one channel.');
    setSending(true); setMsg('');
    try {
      let audience = form.audience;
      if (audience === 'my_class') {
        if (!classSections.length) { setMsg('ERR:No students assigned to you.'); setSending(false); return; }
        // Send to all class-sections one by one
        let totalSent = 0;
        for (const cs of classSections) {
          try {
            const { data } = await api.post('/notifications/broadcast', { ...form, audience: `class_${cs}` });
            totalSent += data.sent || 0;
          } catch {}
        }
        setMsg(`OK:Sent to ${totalSent} parent${totalSent !== 1 ? 's' : ''} across ${classSections.length} class-section${classSections.length > 1 ? 's' : ''}.`);
        setForm(f => ({ ...f, title: '', body: '' }));
        setSending(false);
        return;
      }
      const { data } = await api.post('/notifications/broadcast', { ...form, audience });
      setMsg(`OK:Sent to ${data.sent} parent${data.sent !== 1 ? 's' : ''}.`);
      setForm(f => ({ ...f, title: '', body: '' }));
    } catch (err) {
      setMsg(`ERR:${err.response?.data?.message || 'Failed to send.'}`);
    } finally {
      setSending(false);
    }
  };

  const isOk = msg.startsWith('OK:');
  const msgText = msg.slice(4);

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Notifications</h2>
          <p style={S.sub}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · {notifications.length} total</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[['inbox', 'Inbox'], ['compose', 'Send to Parents']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ ...S.tab, ...(tab === k ? S.tabActive : {}) }}>
            {l}
            {k === 'inbox' && unreadCount > 0 && (
              <span style={S.tabBadge}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── INBOX ── */}
      {tab === 'inbox' && (
        <>
          <div style={S.inboxHeader}>
            <div style={S.filters}>
              {['all', ...Object.keys(TYPE_CFG)].map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  style={{ ...S.filterBtn, background: filter === t ? '#0891b2' : '#fff', color: filter === t ? '#fff' : '#374151', borderColor: filter === t ? '#0891b2' : '#e5e7eb' }}>
                  {t === 'all' ? 'All' : TYPE_CFG[t].label}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={S.markAllBtn}>✓ Mark all read</button>
            )}
          </div>

          <div style={S.list}>
            {loading && <div style={S.empty}><p>Loading...</p></div>}
            {!loading && filtered.length === 0 && (
              <div style={S.empty}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔔</div>
                <p style={{ fontWeight: 600, color: '#374151' }}>No notifications</p>
              </div>
            )}
            {filtered.map(n => {
              const cfg = TYPE_CFG[n.type] || { icon: '📌', color: '#6b7280', bg: '#f3f4f6', label: n.type };
              return (
                <div key={n._id} onClick={() => !n.isRead && markRead(n._id)}
                  style={{ ...S.card, background: n.isRead ? '#fff' : cfg.bg, borderLeft: `4px solid ${cfg.color}`, cursor: n.isRead ? 'default' : 'pointer' }}>
                  <div style={{ ...S.iconBox, background: n.isRead ? '#f3f4f6' : '#fff', color: cfg.color }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.cardTitle}>
                      {n.title}
                      {!n.isRead && <span style={S.unreadDot} />}
                    </div>
                    <div style={S.cardBody}>{n.body}</div>
                    <div style={S.cardMeta}>
                      <span style={{ ...S.typeBadge, background: n.isRead ? '#f3f4f6' : '#fff', color: cfg.color }}>{cfg.label}</span>
                      <span style={S.time}>{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {!n.isRead && <span style={S.newBadge}>NEW</span>}
                    <button onClick={(e) => deleteOne(e, n._id)} style={S.deleteBtn} title="Delete">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── COMPOSE ── */}
      {tab === 'compose' && (
        <div style={S.composeCard}>
          <div style={S.grid2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Notification Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={S.select}>
                  {Object.entries(TYPE_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Homework due tomorrow" style={S.input} maxLength={100} />
              </div>
              <div>
                <label style={S.label}>Message</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Write your message..." style={{ ...S.input, height: 100, resize: 'vertical' }} maxLength={500} />
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'right', marginTop: 2 }}>{form.body.length}/500</div>
              </div>
              <div>
                <label style={S.label}>Delivery Channels</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {Object.entries(CHANNEL_LABELS).map(([ch, lbl]) => (
                    <label key={ch} style={S.checkLabel}>
                      <input type="checkbox" checked={form.channels.includes(ch)} onChange={() => toggleChannel(ch)} style={{ marginRight: 6 }} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Send To (Class-Section Parents)</label>
                <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} style={S.select}>
                  {classSections.length === 0
                    ? <option value="my_class">My Class (auto)</option>
                    : classSections.map(c => {
                        const [cls, sec] = c.split('_');
                        return <option key={c} value={`class_${c}`}>Class {cls}-{sec} Parents</option>;
                      })
                  }
                </select>
              </div>

              {/* Preview */}
              <div>
                <label style={S.label}>Preview</label>
                <div style={{ ...S.previewCard, borderLeft: `4px solid ${TYPE_CFG[form.type]?.color || '#0891b2'}`, background: TYPE_CFG[form.type]?.bg || '#ecfeff' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: 4 }}>
                    {form.title || <span style={{ color: '#9ca3af' }}>Your title here</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
                    {form.body || <span style={{ color: '#9ca3af' }}>Your message here</span>}
                  </div>
                </div>
              </div>

              {msg && (
                <div style={{ ...S.msgBox, background: isOk ? '#f0fdf4' : '#fef2f2', color: isOk ? '#059669' : '#dc2626', border: `1px solid ${isOk ? '#bbf7d0' : '#fecaca'}` }}>
                  {isOk ? '✓' : '✕'} {msgText}
                </div>
              )}

              <button onClick={handleSend} disabled={sending} style={{ ...S.sendBtn, opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Sending...' : 'Send to Parents'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const S = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub: { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e5e7eb' },
  tab: { padding: '10px 20px', border: 'none', background: 'none', fontWeight: 600, fontSize: '0.88rem', color: '#6b7280', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 8 },
  tabActive: { color: '#0891b2', borderBottom: '2px solid #0891b2' },
  tabBadge: { background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 },
  inboxHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  markAllBtn: { background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', padding: '7px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  empty: { background: '#fff', borderRadius: 12, padding: '60px 20px', textAlign: 'center', color: '#9ca3af' },
  card: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  iconBox: { width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
  cardTitle: { fontWeight: 700, fontSize: '0.9rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: '50%', background: '#0891b2', display: 'inline-block', flexShrink: 0 },
  cardBody: { fontSize: '0.85rem', color: '#374151', lineHeight: 1.5, marginBottom: 6 },
  cardMeta: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  typeBadge: { padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 },
  time: { fontSize: '0.75rem', color: '#9ca3af' },
  newBadge: { background: '#0891b2', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 },
  deleteBtn: { background: 'none', border: 'none', color: '#d1d5db', fontSize: '0.85rem', cursor: 'pointer', padding: '2px 4px' },
  composeCard: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  select: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' },
  checkLabel: { display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#374151', cursor: 'pointer', padding: '6px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8 },
  previewCard: { padding: '14px 16px', borderRadius: 10, minHeight: 80 },
  msgBox: { padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 },
  sendBtn: { background: '#0891b2', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%' },
};

export default TeacherNotifications;
