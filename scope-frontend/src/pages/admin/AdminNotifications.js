import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';

const TYPE_CFG = {
  absence:      { icon: '🚨', color: '#ef4444', bg: '#fef2f2', label: 'Absence',      badge: 'danger'  },
  performance:  { icon: '📊', color: '#f59e0b', bg: '#fffbeb', label: 'Performance',  badge: 'warning' },
  homework:     { icon: '📚', color: '#4f46e5', bg: '#f5f3ff', label: 'Homework',     badge: 'info'    },
  exam:         { icon: '📝', color: '#0891b2', bg: '#ecfeff', label: 'Exam',         badge: 'info'    },
  announcement: { icon: '📢', color: '#059669', bg: '#f0fdf4', label: 'Announcement', badge: 'success' },
  meeting:      { icon: '📅', color: '#7c3aed', bg: '#f5f3ff', label: 'Meeting',      badge: 'purple'  },
};

const EXPIRY_OPTIONS = [
  { label: '1 Day',    days: 1  },
  { label: '7 Days',   days: 7  },
  { label: '15 Days',  days: 15 },
  { label: '30 Days',  days: 30 },
  { label: '60 Days',  days: 60 },
  { label: '90 Days',  days: 90 },
  { label: 'Never',    days: 0  },
];

// Group raw notifications into broadcast batches by title + broadcastGroup + ~same time
const groupIntoBatches = (notifications) => {
  const batches = {};
  notifications.forEach(n => {
    const key = `${n.title}__${n.broadcastGroup || 'single'}__${new Date(n.createdAt).toISOString().slice(0, 16)}`;
    if (!batches[key]) {
      batches[key] = {
        key,
        title: n.title,
        body: n.body,
        type: n.type,
        channels: n.channels,
        broadcastGroup: n.broadcastGroup,
        sentBy: n.sentBy,
        createdAt: n.createdAt,
        expiresAt: n.expiresAt,
        count: 0,
        readCount: 0,
        ids: [],
      };
    }
    batches[key].count++;
    if (n.isRead) batches[key].readCount++;
    batches[key].ids.push(n._id);
  });
  return Object.values(batches).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const daysUntilExpiry = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const AdminNotifications = () => {
  const [batches, setBatches]         = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [filterType, setFilterType]   = useState('all');
  const [search, setSearch]           = useState('');
  const [expiryModal, setExpiryModal] = useState(null); // batch being edited
  const [newExpiry, setNewExpiry]     = useState(30);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [histRes, statsRes] = await Promise.all([
        api.get('/notifications/admin/history?limit=200'),
        api.get('/notifications/admin/stats'),
      ]);
      setBatches(groupIntoBatches(histRes.data.notifications));
      setStats(statsRes.data);
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to load history' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Delete entire broadcast batch
  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Delete "${batch.title}" sent to ${batch.count} recipient(s)? This cannot be undone.`)) return;
    try {
      await api.post('/notifications/admin/delete-broadcast', {
        broadcastGroup: batch.broadcastGroup,
        title: batch.title,
        createdAt: batch.createdAt,
      });
      setBatches(prev => prev.filter(b => b.key !== batch.key));
      setMsg({ type: 'success', text: `Deleted "${batch.title}" (${batch.count} notifications)` });
    } catch {
      setMsg({ type: 'error', text: 'Delete failed' });
    }
    setTimeout(() => setMsg(null), 4000);
  };

  // Update expiry of a batch
  const handleUpdateExpiry = async () => {
    if (!expiryModal) return;
    setSaving(true);
    try {
      const { data } = await api.post('/notifications/admin/update-expiry', {
        broadcastGroup: expiryModal.broadcastGroup,
        title: expiryModal.title,
        createdAt: expiryModal.createdAt,
        expiryDays: newExpiry,
      });
      setBatches(prev => prev.map(b =>
        b.key === expiryModal.key ? { ...b, expiresAt: data.expiresAt } : b
      ));
      setMsg({ type: 'success', text: `Expiry updated — auto-deletes in ${newExpiry || 'never'} days` });
      setExpiryModal(null);
    } catch {
      setMsg({ type: 'error', text: 'Update failed' });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const filtered = batches
    .filter(b => filterType === 'all' || b.type === filterType)
    .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.body?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Notification History</h2>
          <p style={S.sub}>{batches.length} broadcasts sent · {stats?.total || 0} total deliveries</p>
        </div>
        <button onClick={load} style={S.refreshBtn}>🔄 Refresh</button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={S.statsRow}>
          {[
            { label: 'Total Sent',   value: stats.total,                    color: '#4f46e5', icon: '📤' },
            { label: 'Unread',       value: stats.unread,                   color: '#ef4444', icon: '🔴' },
            { label: 'Read Rate',    value: stats.total ? `${Math.round((1 - stats.unread / stats.total) * 100)}%` : '0%', color: '#10b981', icon: '✅' },
            { label: 'Broadcasts',   value: batches.length,                 color: '#f59e0b', icon: '📢' },
          ].map(s => (
            <div key={s.label} style={{ ...S.statCard, borderTop: `3px solid ${s.color}` }}>
              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Msg */}
      {msg && (
        <div style={{ background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: msg.type === 'success' ? '#15803d' : '#dc2626', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem' }}>
          {msg.text}
        </div>
      )}

      {/* Toolbar */}
      <div style={S.toolbar}>
        <input style={S.search} placeholder="🔍  Search notifications..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={S.typeFilters}>
          {['all', ...Object.keys(TYPE_CFG)].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              style={{ ...S.filterBtn, background: filterType === t ? '#4f46e5' : '#fff', color: filterType === t ? '#fff' : '#374151' }}>
              {t === 'all' ? 'All' : TYPE_CFG[t].icon + ' ' + TYPE_CFG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch List */}
      {loading && <div style={S.empty}>Loading history...</div>}
      {!loading && filtered.length === 0 && <div style={S.empty}>No notifications found</div>}

      <div style={S.list}>
        {filtered.map(batch => {
          const cfg = TYPE_CFG[batch.type] || { icon: '📌', color: '#6b7280', bg: '#f3f4f6', label: batch.type };
          const days = daysUntilExpiry(batch.expiresAt);
          const isExpiringSoon = days !== null && days <= 3 && days > 0;
          const isExpired = days !== null && days <= 0;
          const readPct = batch.count ? Math.round((batch.readCount / batch.count) * 100) : 0;

          return (
            <div key={batch.key} style={{ ...S.card, borderLeft: `4px solid ${cfg.color}` }}>
              <div style={S.cardTop}>
                {/* Left */}
                <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{ ...S.iconBox, background: cfg.bg, color: cfg.color }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.cardTitle}>{batch.title}</div>
                    <div style={S.cardBody}>{batch.body}</div>
                    <div style={S.cardMeta}>
                      <Badge label={cfg.label} type={cfg.badge} />
                      {batch.broadcastGroup && (
                        <span style={S.audienceBadge}>📢 {batch.broadcastGroup.replace(/_/g, ' ')}</span>
                      )}
                      {batch.channels?.map(ch => (
                        <span key={ch} style={S.chBadge}>{ch === 'push' ? '🔔' : ch === 'email' ? '📧' : '📱'} {ch}</span>
                      ))}
                      <span style={S.time}>
                        {new Date(batch.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      {batch.sentBy && <span style={S.sentBy}>by {batch.sentBy.name}</span>}
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div style={S.cardRight}>
                  {/* Recipients + read rate */}
                  <div style={S.recipientBox}>
                    <span style={S.recipientNum}>{batch.count}</span>
                    <span style={S.recipientLabel}>recipients</span>
                    <div style={S.progressBar}>
                      <div style={{ ...S.progressFill, width: `${readPct}%` }} />
                    </div>
                    <span style={S.readPct}>{readPct}% read</span>
                  </div>

                  {/* Expiry */}
                  <div style={{ ...S.expiryBox, background: isExpired ? '#fef2f2' : isExpiringSoon ? '#fffbeb' : '#f8fafc', borderColor: isExpired ? '#fecaca' : isExpiringSoon ? '#fde68a' : '#e5e7eb' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Auto-delete</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : '#374151' }}>
                      {isExpired ? 'Expired' : days === null ? 'Never' : days > 365 ? 'Never' : `in ${days}d`}
                    </span>
                    <button onClick={() => { setExpiryModal(batch); setNewExpiry(30); }} style={S.editExpiryBtn}>
                      ✏️ Edit
                    </button>
                  </div>

                  {/* Delete */}
                  <button onClick={() => handleDeleteBatch(batch)} style={S.deleteBtn}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expiry Edit Modal */}
      {expiryModal && (
        <div style={S.overlay} onClick={() => setExpiryModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h3 style={S.modalTitle}>⏱️ Set Auto-Delete Period</h3>
            <p style={S.modalSub}>
              Notification: <strong>"{expiryModal.title}"</strong><br />
              Sent to <strong>{expiryModal.count}</strong> recipients
            </p>

            <div style={S.expiryGrid}>
              {EXPIRY_OPTIONS.map(opt => (
                <button key={opt.days} onClick={() => setNewExpiry(opt.days)}
                  style={{ ...S.expiryOption, background: newExpiry === opt.days ? '#4f46e5' : '#f8fafc', color: newExpiry === opt.days ? '#fff' : '#374151', border: `2px solid ${newExpiry === opt.days ? '#4f46e5' : '#e5e7eb'}` }}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={S.expiryNote}>
              {newExpiry === 0
                ? '⚠️ Notifications will never be auto-deleted'
                : `✅ Notifications will be automatically deleted after ${newExpiry} days`}
            </div>

            <div style={S.modalFooter}>
              <button onClick={() => setExpiryModal(null)} style={S.cancelBtn}>Cancel</button>
              <button onClick={handleUpdateExpiry} disabled={saving} style={S.saveBtn}>
                {saving ? 'Saving...' : 'Update Expiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const S = {
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:         { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub:           { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  refreshBtn:    { background: '#fff', border: '1.5px solid #e5e7eb', padding: '9px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: '#374151' },

  statsRow:      { display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' },
  statCard:      { background: '#fff', borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 120, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },

  toolbar:       { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  search:        { padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', background: '#fff' },
  typeFilters:   { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:     { padding: '6px 12px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },

  list:          { display: 'flex', flexDirection: 'column', gap: 10 },
  empty:         { background: '#fff', borderRadius: 12, padding: '60px', textAlign: 'center', color: '#9ca3af' },

  card:          { background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardTop:       { display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' },
  iconBox:       { width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 },
  cardTitle:     { fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 3 },
  cardBody:      { fontSize: '0.84rem', color: '#374151', marginBottom: 8, lineHeight: 1.5 },
  cardMeta:      { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  audienceBadge: { background: '#f0fdf4', color: '#059669', padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600 },
  chBadge:       { background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 },
  time:          { fontSize: '0.75rem', color: '#9ca3af' },
  sentBy:        { fontSize: '0.75rem', color: '#9ca3af' },

  cardRight:     { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 },
  recipientBox:  { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 14px', minWidth: 90 },
  recipientNum:  { fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' },
  recipientLabel:{ fontSize: '0.7rem', color: '#9ca3af' },
  progressBar:   { width: '100%', height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', background: '#10b981', borderRadius: 2, transition: 'width 0.3s' },
  readPct:       { fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: 2 },

  expiryBox:     { display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1.5px solid', borderRadius: 8, padding: '8px 12px', gap: 3, minWidth: 90 },
  editExpiryBtn: { background: 'none', border: 'none', fontSize: '0.75rem', color: '#4f46e5', cursor: 'pointer', fontWeight: 600, padding: 0 },
  deleteBtn:     { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '7px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },

  // Expiry modal
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:         { background: '#fff', borderRadius: 14, padding: '28px 32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle:    { fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 8 },
  modalSub:      { fontSize: '0.85rem', color: '#6b7280', marginBottom: 20, lineHeight: 1.6 },
  expiryGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 },
  expiryOption:  { padding: '10px 6px', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  expiryNote:    { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#374151', marginBottom: 20 },
  modalFooter:   { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn:     { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  saveBtn:       { padding: '9px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};

export default AdminNotifications;
