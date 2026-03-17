import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const statusConfig = {
  present: { color: '#10b981', bg: '#f0fdf4', label: 'P' },
  absent: { color: '#ef4444', bg: '#fef2f2', label: 'A' },
  late: { color: '#f59e0b', bg: '#fffbeb', label: 'L' },
};

const Attendance = () => {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      setStudents(data);
      const init = {};
      data.forEach(s => { init[s._id] = 'present'; });
      setAttendance(init);
    });
  }, []);

  const toggle = (id, status) => setAttendance(prev => ({ ...prev, [id]: status }));

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'present' }));
    await api.post('/attendance', { records, date });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 4000);
  };

  const counts = { present: 0, absent: 0, late: 0 };
  students.forEach(s => { counts[attendance[s._id] || 'present']++; });

  const filtered = filter === 'all' ? students : students.filter(s => attendance[s._id] === filter);

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Mark Attendance</h2>
          <p style={styles.sub}>Absent parents will be notified automatically</p>
        </div>
        <div style={styles.headerRight}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.dateInput} />
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </div>
      </div>

      {saved && (
        <div style={styles.successBanner}>
          ✅ Attendance saved! Parents of absent students have been notified via email & push notification.
        </div>
      )}

      {/* Summary */}
      <div style={styles.summaryRow}>
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} style={{ ...styles.summaryCard, borderColor: statusConfig[status].color, background: statusConfig[status].bg }}>
            <span style={{ fontSize: '1.4rem' }}>{status === 'present' ? '✅' : status === 'absent' ? '❌' : '⏰'}</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: statusConfig[status].color }}>{count}</span>
            <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'capitalize' }}>{status}</span>
          </div>
        ))}
        <div style={{ ...styles.summaryCard, borderColor: '#4f46e5', background: '#f5f3ff' }}>
          <span style={{ fontSize: '1.4rem' }}>📊</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5' }}>
            {students.length ? Math.round(counts.present / students.length * 100) : 0}%
          </span>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Attendance Rate</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.filterBtns}>
          {['all', 'present', 'absent', 'late'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...styles.filterBtn, background: filter === f ? '#4f46e5' : '#fff', color: filter === f ? '#fff' : '#374151' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${counts[f] || 0})`}
            </button>
          ))}
        </div>
        <div style={styles.markAllBtns}>
          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Mark all:</span>
          {['present', 'absent', 'late'].map(s => (
            <button key={s} onClick={() => markAll(s)}
              style={{ ...styles.markAllBtn, background: statusConfig[s].bg, color: statusConfig[s].color, border: `1px solid ${statusConfig[s].color}` }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Student Grid */}
      <div style={styles.grid}>
        {filtered.map(s => {
          const status = attendance[s._id] || 'present';
          const cfg = statusConfig[status];
          return (
            <div key={s._id} style={{ ...styles.studentCard, borderColor: cfg.color, background: cfg.bg }}>
              <div style={styles.cardTop}>
                <div style={{ ...styles.avatar, background: cfg.color }}>{s.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.sName}>{s.name}</div>
                  <div style={styles.sRoll}>Roll: {s.rollNumber} · {s.class}-{s.section}</div>
                </div>
                <div style={{ ...styles.statusBadge, background: cfg.color }}>{cfg.label}</div>
              </div>
              <div style={styles.btnRow}>
                {['present', 'absent', 'late'].map(st => (
                  <button key={st} onClick={() => toggle(s._id, st)}
                    style={{ ...styles.statusBtn, background: status === st ? statusConfig[st].color : '#fff', color: status === st ? '#fff' : statusConfig[st].color, border: `1.5px solid ${statusConfig[st].color}` }}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub: { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
  dateInput: { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  saveBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' },
  successBanner: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem', fontWeight: 500 },
  summaryRow: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  summaryCard: { flex: 1, minWidth: 100, background: '#fff', border: '2px solid', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  filterBtns: { display: 'flex', gap: 6 },
  filterBtn: { padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600 },
  markAllBtns: { display: 'flex', gap: 6, alignItems: 'center' },
  markAllBtn: { padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
  studentCard: { background: '#fff', border: '2px solid', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 },
  cardTop: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  sName: { fontWeight: 600, fontSize: '0.88rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sRoll: { fontSize: '0.72rem', color: '#9ca3af' },
  statusBadge: { color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 },
  btnRow: { display: 'flex', gap: 6 },
  statusBtn: { flex: 1, padding: '5px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 },
};

export default Attendance;
