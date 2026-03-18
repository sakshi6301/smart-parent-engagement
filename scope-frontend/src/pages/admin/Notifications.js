import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const TYPE_CFG = {
  absence:      { label: 'Absence Alert',  color: '#ef4444', bg: '#fef2f2' },
  performance:  { label: 'Performance',    color: '#f59e0b', bg: '#fffbeb' },
  homework:     { label: 'Homework',       color: '#4f46e5', bg: '#f5f3ff' },
  exam:         { label: 'Exam',           color: '#0891b2', bg: '#ecfeff' },
  announcement: { label: 'Announcement',   color: '#059669', bg: '#f0fdf4' },
  meeting:      { label: 'Meeting',        color: '#7c3aed', bg: '#f5f3ff' },
};

const CHANNEL_LABELS = { push: 'Push', email: 'Email', sms: 'SMS' };

const badge = (label, color, bg) => (
  <span style={{ background: bg, color, padding: '2px 10px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 }}>
    {label}
  </span>
);

const AdminNotifications = () => {
  const [tab, setTab] = useState('compose'); // compose | history | stats
  const [form, setForm] = useState({ title: '', body: '', type: 'announcement', channels: ['push', 'email'], audience: 'all_parents' });
  const [classes, setClasses] = useState([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const [history, setHistory] = useState([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histPage, setHistPage] = useState(1);
  const [histFilter, setHistFilter] = useState('');
  const [histLoading, setHistLoading] = useState(false);

  const [stats, setStats] = useState(null);

  // load distinct classes for class-targeting
  useEffect(() => {
    api.get('/students?limit=500').then(({ data }) => {
      const set = new Set();
      (data.students || data).forEach(s => set.add(`${s.class}_${s.section}`));
      setClasses([...set].sort());
    }).catch(() => {});
  }, []);

  const loadHistory = useCallback(async (page = 1, type = '') => {
    setHistLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (type) params.set('type', type);
      const { data } = await api.get(`/notifications/admin/history?${params}`);
      setHistory(data.notifications || []);
      setHistTotal(data.total || 0);
      setHistPage(page);
    } catch (err) {
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/admin/stats');
      setStats(data);
    } catch (err) { setStats(null); }
  }, []);

  useEffect(() => {
    if (tab === 'history') loadHistory(1, histFilter);
    if (tab === 'stats') loadStats();
  }, [tab, loadHistory, loadStats, histFilter]);

  const toggleChannel = (ch) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }));
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return setMsg('ERR:Title and message are required.');
    if (!form.channels.length) return setMsg('ERR:Select at least one channel.');
    setSending(true); setMsg('');
    try {
      const { data } = await api.post('/notifications/broadcast', form);
      setMsg(`OK:Sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}.`);
      setForm(f => ({ ...f, title: '', body: '' }));
    } catch (err) {
      setMsg(`ERR:${err.response?.data?.message || 'Failed to send.'}`);
    } finally {
      setSending(false);
    }
  };

  const isOk = msg.startsWith('OK:');
  const msgText = msg.startsWith('OK:') || msg.startsWith('ERR:') ? msg.slice(4) : msg;

  const audienceLabel = (a) => {
    if (!a) return '—';
    if (a === 'all_parents') return 'All Parents';
    if (a === 'all_teachers') return 'All Teachers';
    if (a.startsWith('class_')) { const p = a.split('_'); return `Class ${p[1]}-${p[2]}`; }
    return a;
  };

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Notifications</h2>
          <p style={S.sub}>Compose, broadcast and track school notifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[['compose','Compose & Send'],['history','Sent History'],['stats','Stats']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ ...S.tab, ...(tab === k ? S.tabActive : {}) }}>{l}</button>
        ))}
      </div>

      {/* ── COMPOSE ── */}
      {tab === 'compose' && (
        <div style={S.card}>
          <div style={S.grid2}>
            {/* Left: form */}
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
                  placeholder="e.g. School closed tomorrow" style={S.input} maxLength={100} />
              </div>

              <div>
                <label style={S.label}>Message</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Write your message here..." style={{ ...S.input, height: 100, resize: 'vertical' }} maxLength={500} />
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

            {/* Right: audience + preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Send To</label>
                <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} style={S.select}>
                  <option value="all_parents">All Parents</option>
                  <option value="all_teachers">All Teachers</option>
                  {classes.map(c => {
                    const [cls, sec] = c.split('_');
                    return <option key={c} value={`class_${c}`}>Class {cls}-{sec} Parents</option>;
                  })}
                </select>
              </div>

              {/* Preview card */}
              <div>
                <label style={S.label}>Preview</label>
                <div style={{
                  ...S.previewCard,
                  borderLeft: `4px solid ${TYPE_CFG[form.type]?.color || '#4f46e5'}`,
                  background: TYPE_CFG[form.type]?.bg || '#f5f3ff',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: 4 }}>
                    {form.title || <span style={{ color: '#9ca3af' }}>Your title here</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
                    {form.body || <span style={{ color: '#9ca3af' }}>Your message here</span>}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {badge(TYPE_CFG[form.type]?.label, TYPE_CFG[form.type]?.color, '#fff')}
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>→ {audienceLabel(form.audience)}</span>
                  </div>
                </div>
              </div>

              {msg && (
                <div style={{ ...S.msgBox, background: isOk ? '#f0fdf4' : '#fef2f2', color: isOk ? '#059669' : '#dc2626', border: `1px solid ${isOk ? '#bbf7d0' : '#fecaca'}` }}>
                  {isOk ? '✓' : '✕'} {msgText}
                </div>
              )}

              <button onClick={handleSend} disabled={sending} style={{ ...S.sendBtn, opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <div style={S.card}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Filter by type:</span>
            {['', ...Object.keys(TYPE_CFG)].map(t => (
              <button key={t} onClick={() => { setHistFilter(t); loadHistory(1, t); }}
                style={{ ...S.filterBtn, background: histFilter === t ? '#4f46e5' : '#fff', color: histFilter === t ? '#fff' : '#374151' }}>
                {t === '' ? 'All' : TYPE_CFG[t].label}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#9ca3af' }}>{histTotal} total</span>
          </div>

          {histLoading ? (
            <div style={S.loading}>Loading...</div>
          ) : history.length === 0 ? (
            <div style={S.empty}>No notifications sent yet.</div>
          ) : (
            <>
              <table style={S.table}>
                <thead>
                  <tr style={S.thead}>
                    <th style={S.th}>Title</th>
                    <th style={S.th}>Type</th>
                    <th style={S.th}>Audience</th>
                    <th style={S.th}>Channels</th>
                    <th style={S.th}>Sent By</th>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Read</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(n => {
                    const cfg = TYPE_CFG[n.type] || { label: n.type, color: '#6b7280', bg: '#f3f4f6' };
                    return (
                      <tr key={n._id} style={S.tr}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{n.body.slice(0, 60)}{n.body.length > 60 ? '…' : ''}</div>
                        </td>
                        <td style={S.td}>{badge(cfg.label, cfg.color, cfg.bg)}</td>
                        <td style={S.td}><span style={{ fontSize: '0.8rem' }}>{audienceLabel(n.broadcastGroup)}</span></td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(n.channels || []).map(ch => (
                              <span key={ch} style={S.chBadge}>{CHANNEL_LABELS[ch] || ch}</span>
                            ))}
                          </div>
                        </td>
                        <td style={S.td}><span style={{ fontSize: '0.8rem' }}>{n.sentBy?.name || '—'}</span></td>
                        <td style={S.td}><span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span></td>
                        <td style={S.td}>
                          <span style={{ fontSize: '0.8rem', color: n.isRead ? '#059669' : '#f59e0b', fontWeight: 600 }}>
                            {n.isRead ? 'Read' : 'Unread'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                <button onClick={() => loadHistory(histPage - 1, histFilter)} disabled={histPage === 1} style={S.pageBtn}>← Prev</button>
                <span style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#374151' }}>Page {histPage}</span>
                <button onClick={() => loadHistory(histPage + 1, histFilter)} disabled={history.length < 20} style={S.pageBtn}>Next →</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STATS ── */}
      {tab === 'stats' && (
        <div>
          {!stats ? (
            <div style={S.loading}>Loading stats...</div>
          ) : (
            <>
              <div style={S.statRow}>
                {[
                  { label: 'Total Sent', value: stats.total, color: '#4f46e5' },
                  { label: 'Unread', value: stats.unread, color: '#f59e0b' },
                  { label: 'Read', value: stats.total - stats.unread, color: '#059669' },
                  { label: 'Read Rate', value: stats.total ? `${Math.round(((stats.total - stats.unread) / stats.total) * 100)}%` : '0%', color: '#0891b2' },
                ].map(s => (
                  <div key={s.label} style={S.statCard}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={S.grid2}>
                {/* By type */}
                <div style={S.card}>
                  <div style={S.cardTitle}>By Type</div>
                  {stats.byType.map(t => {
                    const cfg = TYPE_CFG[t._id] || { label: t._id, color: '#6b7280', bg: '#f3f4f6' };
                    const pct = stats.total ? Math.round((t.count / stats.total) * 100) : 0;
                    return (
                      <div key={t._id} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                          <span style={{ color: '#6b7280' }}>{t.count} ({pct}%)</span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8 }}>
                          <div style={{ width: `${pct}%`, background: cfg.color, height: 8, borderRadius: 4, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Last 7 days */}
                <div style={S.card}>
                  <div style={S.cardTitle}>Last 7 Days</div>
                  {stats.last7.length === 0 && <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>No data</div>}
                  {stats.last7.map(d => {
                    const max = Math.max(...stats.last7.map(x => x.count), 1);
                    const pct = Math.round((d.count / max) * 100);
                    return (
                      <div key={d._id} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                          <span style={{ color: '#374151' }}>{d._id}</span>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>{d.count}</span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8 }}>
                          <div style={{ width: `${pct}%`, background: '#4f46e5', height: 8, borderRadius: 4, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
};

const S = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub: { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 0 },
  tab: { padding: '10px 20px', border: 'none', background: 'none', fontWeight: 600, fontSize: '0.88rem', color: '#6b7280', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -2 },
  tabActive: { color: '#4f46e5', borderBottom: '2px solid #4f46e5' },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 },
  cardTitle: { fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  select: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' },
  checkLabel: { display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#374151', cursor: 'pointer', padding: '6px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8 },
  previewCard: { padding: '14px 16px', borderRadius: 10, minHeight: 90 },
  msgBox: { padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 },
  sendBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%' },
  filterBtn: { padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f9fafb' },
  th: { padding: '10px 12px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 12px', verticalAlign: 'top' },
  chBadge: { background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 },
  loading: { textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: '0.9rem' },
  empty: { textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: '0.9rem' },
  pageBtn: { padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  statCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', textAlign: 'center' },
};

export default AdminNotifications;
