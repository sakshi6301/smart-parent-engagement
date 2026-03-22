import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const STATUS_CFG = {
  present: { color: '#10b981', bg: '#f0fdf4', label: 'Present' },
  absent:  { color: '#ef4444', bg: '#fef2f2', label: 'Absent'  },
  late:    { color: '#f59e0b', bg: '#fffbeb', label: 'Late'    },
};

const ParentAttendance = () => {
  const [student, setStudent]   = useState(null);
  const [data, setData]         = useState(null);
  const [anomaly, setAnomaly]   = useState(null);
  const [month, setMonth]       = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    api.get('/students').then(({ data: students }) => {
      if (!students.length) { setLoading(false); return; }
      const s = students[0];
      setStudent(s);
      api.get(`/ai/attendance-anomaly/${s._id}`).then(r => setAnomaly(r.data)).catch(() => {});
      loadMonth(s._id, month);
    }).catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadMonth = (id, m) => {
    setLoading(true);
    api.get(`/attendance/${id}?month=${m}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    if (student) loadMonth(student._id, e.target.value);
  };

  const records = data?.records || [];
  const summary = data?.summary || {};

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  if (!student && !loading) return (
    <AppLayout>
      <div style={S.empty}>
        <p style={{ fontWeight: 700, color: '#92400e' }}>No child linked to your account</p>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Contact your school admin to link your child.</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Attendance</h2>
          <p style={S.sub}>{student ? `${student.name} · Class ${student.class}-${student.section}` : ''}</p>
        </div>
        <input type="month" value={month} onChange={handleMonthChange} style={S.monthInput} />
      </div>

      {anomaly?.is_anomaly && (
        <div style={S.anomalyAlert}>
          <strong>Attendance Alert:</strong> {anomaly.message}
        </div>
      )}

      {/* Summary cards */}
      <div style={S.summaryRow}>
        {[
          { key: 'percentage', label: 'Attendance Rate', value: summary.percentage != null ? `${summary.percentage}%` : '—', color: summary.percentage < 75 ? '#ef4444' : '#10b981' },
          { key: 'present',   label: 'Present',          value: summary.present  ?? '—', color: '#10b981' },
          { key: 'absent',    label: 'Absent',           value: summary.absent   ?? '—', color: '#ef4444' },
          { key: 'late',      label: 'Late',             value: summary.late     ?? '—', color: '#f59e0b' },
        ].map(c => (
          <div key={c.key} style={{ ...S.summaryCard, borderTop: `3px solid ${c.color}` }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color }}>{c.value}</span>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={S.filterRow}>
        {['all', 'present', 'absent', 'late'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...S.filterBtn, background: filter === f ? '#4f46e5' : '#fff', color: filter === f ? '#fff' : '#374151' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span style={S.filterCount}>{records.filter(r => r.status === f).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={S.center}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontWeight: 600, color: '#374151' }}>No records for {month}</p>
          <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Try selecting a different month.</p>
        </div>
      ) : (
        <div style={S.list}>
          {filtered.map((r, i) => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.present;
            return (
              <div key={i} style={{ ...S.record, borderLeft: `4px solid ${cfg.color}`, background: cfg.bg }}>
                <span style={S.recordDate}>
                  {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span style={{ ...S.statusPill, color: cfg.color, background: '#fff', border: `1px solid ${cfg.color}` }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

const S = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:        { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:          { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  monthInput:   { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  anomalyAlert: { background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', padding: '12px 18px', borderRadius: 10, marginBottom: 16, fontSize: '0.88rem' },
  summaryRow:   { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  summaryCard:  { flex: 1, minWidth: 100, background: '#fff', borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  filterRow:    { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn:    { padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  filterCount:  { background: 'rgba(255,255,255,0.25)', padding: '0 6px', borderRadius: 10, fontSize: '0.72rem' },
  center:       { textAlign: 'center', padding: 40, color: '#9ca3af' },
  empty:        { background: '#fff', borderRadius: 12, padding: '60px 20px', textAlign: 'center', color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  list:         { display: 'flex', flexDirection: 'column', gap: 8 },
  record:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  recordDate:   { fontSize: '0.88rem', fontWeight: 600, color: '#374151' },
  statusPill:   { padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 },
};

export default ParentAttendance;
