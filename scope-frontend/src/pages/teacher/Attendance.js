import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const statusConfig = {
  present: { color: '#10b981', bg: '#f0fdf4', label: 'P' },
  absent:  { color: '#ef4444', bg: '#fef2f2', label: 'A' },
  late:    { color: '#f59e0b', bg: '#fffbeb', label: 'L' },
};

const Attendance = () => {
  const [students, setStudents]     = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate]             = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [filter, setFilter]         = useState('all');
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState('mark'); // 'mark' | 'history'
  const [history, setHistory]       = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histMonth, setHistMonth]   = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    api.get('/students')
      .then(({ data }) => {
        setStudents(data);
        const init = {};
        data.forEach(s => { init[s._id] = 'present'; });
        setAttendance(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadHistory = useCallback(async () => {
    if (!students.length) return;
    setHistLoading(true);
    try {
      const results = await Promise.all(
        students.map(s => api.get(`/attendance/${s._id}?month=${histMonth}`).catch(() => null))
      );
      const rows = [];
      results.forEach((r, i) => {
        if (!r) return;
        (r.data.records || []).forEach(rec => {
          rows.push({ student: students[i], date: rec.date, status: rec.status });
        });
      });
      rows.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(rows);
    } catch {}
    setHistLoading(false);
  }, [students, histMonth]);

  useEffect(() => {
    if (view === 'history') loadHistory();
  }, [view, loadHistory]);

  const toggle = (id, status) => setAttendance(prev => ({ ...prev, [id]: status }));
  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'present' }));
      await api.post('/attendance', { records, date });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save attendance. Please try again.');
    }
    setSaving(false);
  };

  const exportCSV = () => {
    const rows = [['Student Name', 'Roll Number', 'Class', 'Date', 'Status']];
    if (view === 'mark') {
      students.forEach(s => {
        rows.push([s.name, s.rollNumber, `${s.class}-${s.section}`, date, attendance[s._id] || 'present']);
      });
    } else {
      history.forEach(r => {
        rows.push([r.student.name, r.student.rollNumber, `${r.student.class}-${r.student.section}`, new Date(r.date).toLocaleDateString('en-IN'), r.status]);
      });
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${view === 'mark' ? date : histMonth}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const counts = { present: 0, absent: 0, late: 0 };
  students.forEach(s => { counts[attendance[s._id] || 'present']++; });
  const filtered = filter === 'all' ? students : students.filter(s => attendance[s._id] === filter);

  // Group history by date for display
  const histByDate = {};
  history.forEach(r => {
    const d = new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!histByDate[d]) histByDate[d] = [];
    histByDate[d].push(r);
  });

  if (loading) return (
    <AppLayout>
      <div style={styles.loadingBox}>
        <div style={styles.spinner} />
        <span>Loading students...</span>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Attendance</h2>
          <p style={styles.sub}>
            {view === 'mark' ? 'Absent parents will be notified automatically' : `Showing history for ${histMonth}`}
          </p>
        </div>
        <div style={styles.headerRight}>
          {/* View toggle */}
          <div style={styles.viewToggle}>
            {[['mark', 'Mark Today'], ['history', 'View History']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ ...styles.toggleBtn, background: view === v ? '#4f46e5' : '#fff', color: view === v ? '#fff' : '#374151' }}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} style={styles.exportBtn}>Export CSV</button>
          {view === 'mark' && (
            <>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.dateInput} />
              <button onClick={handleSave} disabled={saving || !students.length} style={styles.saveBtn}>
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </>
          )}
          {view === 'history' && (
            <input type="month" value={histMonth} onChange={e => setHistMonth(e.target.value)} style={styles.dateInput} />
          )}
        </div>
      </div>

      {saved && (
        <div style={styles.successBanner}>
          Attendance saved! Parents of absent students have been notified via email and push notification.
        </div>
      )}
      {saveError && (
        <div style={styles.errorBanner}>{saveError}</div>
      )}

      {students.length === 0 && (
        <div style={styles.empty}>
          <h3>No students assigned</h3>
          <p style={{ color: '#9ca3af' }}>Ask your admin to assign students to your account.</p>
        </div>
      )}

      {/* ── MARK VIEW ── */}
      {view === 'mark' && students.length > 0 && (
        <>
          <div style={styles.summaryRow}>
            {Object.entries(counts).map(([status, count]) => (
              <div key={status} style={{ ...styles.summaryCard, borderColor: statusConfig[status].color, background: statusConfig[status].bg }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: statusConfig[status].color }}>{count}</span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'capitalize' }}>{status}</span>
              </div>
            ))}
            <div style={{ ...styles.summaryCard, borderColor: '#4f46e5', background: '#f5f3ff' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5' }}>
                {students.length ? Math.round(counts.present / students.length * 100) : 0}%
              </span>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Attendance Rate</span>
            </div>
          </div>

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
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Mark all as:</span>
              {['present', 'absent', 'late'].map(s => (
                <button key={s} onClick={() => markAll(s)}
                  style={{ ...styles.markAllBtn, background: statusConfig[s].bg, color: statusConfig[s].color, border: `1px solid ${statusConfig[s].color}` }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

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
        </>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <div style={styles.historyBox}>
          {histLoading ? (
            <div style={styles.loadingBox}><div style={styles.spinner} /><span>Loading history...</span></div>
          ) : Object.keys(histByDate).length === 0 ? (
            <div style={styles.empty}>
              <h3>No attendance records</h3>
              <p style={{ color: '#9ca3af' }}>No records found for {histMonth}. Try a different month.</p>
            </div>
          ) : (
            Object.entries(histByDate).map(([dateStr, records]) => {
              const present = records.filter(r => r.status === 'present').length;
              const total = records.length;
              return (
                <div key={dateStr} style={styles.histDateGroup}>
                  <div style={styles.histDateHeader}>
                    <span style={styles.histDate}>{dateStr}</span>
                    <span style={styles.histSummary}>
                      {present}/{total} present · {Math.round(present / total * 100)}%
                    </span>
                  </div>
                  <div style={styles.histGrid}>
                    {records.map((r, i) => {
                      const cfg = statusConfig[r.status];
                      return (
                        <div key={i} style={{ ...styles.histCard, borderLeft: `3px solid ${cfg.color}`, background: cfg.bg }}>
                          <div style={{ ...styles.histAvatar, background: cfg.color }}>{r.student.name[0]}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{r.student.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Roll: {r.student.rollNumber}</div>
                          </div>
                          <span style={{ ...styles.histStatus, color: cfg.color, background: '#fff' }}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </AppLayout>
  );
};

const styles = {
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  title:         { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:           { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  headerRight:   { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  viewToggle:    { display: 'flex', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  toggleBtn:     { padding: '8px 14px', border: 'none', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  exportBtn:     { background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  dateInput:     { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  saveBtn:       { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  successBanner: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem' },
  errorBanner:   { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem' },
  loadingBox:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '60px 0', color: '#6b7280' },
  spinner:       { width: 20, height: 20, border: '3px solid #e5e7eb', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty:         { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  summaryRow:    { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  summaryCard:   { flex: 1, minWidth: 100, border: '2px solid', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  toolbar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  filterBtns:    { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn:     { padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  markAllBtns:   { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  markAllBtn:    { padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  grid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
  studentCard:   { background: '#fff', border: '2px solid', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 },
  cardTop:       { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:        { width: 36, height: 36, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  sName:         { fontWeight: 600, fontSize: '0.88rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sRoll:         { fontSize: '0.72rem', color: '#9ca3af' },
  statusBadge:   { color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 },
  btnRow:        { display: 'flex', gap: 6 },
  statusBtn:     { flex: 1, padding: '5px 4px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
  historyBox:    { display: 'flex', flexDirection: 'column', gap: 20 },
  histDateGroup: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  histDateHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' },
  histDate:      { fontWeight: 700, fontSize: '0.9rem', color: '#111827' },
  histSummary:   { fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 },
  histGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, padding: 12, gap: 8 },
  histCard:      { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid #f3f4f6' },
  histAvatar:    { width: 30, height: 30, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 },
  histStatus:    { padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, border: '1px solid #e5e7eb' },
};

export default Attendance;
