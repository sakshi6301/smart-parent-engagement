import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const STATUS_CFG = {
  present: { color: '#10b981', bg: '#f0fdf4', label: 'Present', icon: '✅' },
  absent:  { color: '#ef4444', bg: '#fef2f2', label: 'Absent',  icon: '❌' },
  late:    { color: '#f59e0b', bg: '#fffbeb', label: 'Late',    icon: '⏰' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StudentAttendance = () => {
  const [student, setStudent]     = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      if (data.length > 0) {
        setStudent(data[0]);
        api.get(`/attendance/${data[0]._id}`).then(r => setAttendance(r.data)).catch(() => {});
      }
    });
  }, []);

  const records = attendance?.records || [];
  const summary = attendance?.summary || { present: 0, absent: 0, late: 0, percentage: 0 };

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  // Group by month
  const byMonth = {};
  filtered.forEach(r => {
    const d = new Date(r.date);
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(r);
  });

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>My Attendance</h2>
          <p style={S.sub}>{student?.name} · Class {student?.class}-{student?.section}</p>
        </div>
        <div style={{ ...S.pctBadge, background: summary.percentage < 75 ? '#fef2f2' : '#f0fdf4', color: summary.percentage < 75 ? '#ef4444' : '#10b981' }}>
          {summary.percentage}% Attendance
          {summary.percentage < 75 && ' ⚠️'}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={S.summaryRow}>
        {[['present','✅','#10b981'],['absent','❌','#ef4444'],['late','⏰','#f59e0b']].map(([key, icon, clr]) => (
          <div key={key} onClick={() => setFilter(filter === key ? 'all' : key)}
            style={{ ...S.summaryCard, borderTop: `3px solid ${filter === key ? clr : '#e5e7eb'}`, cursor: 'pointer' }}>
            <span style={{ fontSize: '1.4rem' }}>{icon}</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: clr }}>{summary[key] || 0}</span>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', textTransform: 'capitalize' }}>{key}</span>
          </div>
        ))}
        <div style={{ ...S.summaryCard, borderTop: `3px solid #4f46e5`, flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Attendance Rate</span>
            <span style={{ fontWeight: 800, color: '#4f46e5' }}>{summary.percentage}%</span>
          </div>
          <div style={S.progressBg}>
            <div style={{ ...S.progressFill, width: `${summary.percentage}%`, background: summary.percentage < 75 ? '#ef4444' : '#10b981' }} />
          </div>
          {summary.percentage < 75 && <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: '6px 0 0', fontWeight: 600 }}>⚠️ Below 75% — attendance shortage!</p>}
        </div>
      </div>

      {/* Records */}
      {Object.keys(byMonth).length === 0 ? (
        <div style={S.empty}>No attendance records found.</div>
      ) : (
        Object.entries(byMonth).reverse().map(([month, recs]) => (
          <div key={month} style={S.monthSection}>
            <div style={S.monthHeader}>{month} <span style={{ fontWeight: 400, color: '#9ca3af' }}>({recs.length} days)</span></div>
            <div style={S.recordGrid}>
              {recs.map(r => {
                const cfg = STATUS_CFG[r.status] || STATUS_CFG.present;
                return (
                  <div key={r._id} style={{ ...S.recordCard, background: cfg.bg, borderColor: cfg.color }}>
                    <div style={{ fontSize: '1.1rem' }}>{cfg.icon}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>
                      {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 700 }}>{cfg.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </AppLayout>
  );
};

const S = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  title:       { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:         { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  pctBadge:    { padding: '8px 18px', borderRadius: 20, fontSize: '0.88rem', fontWeight: 700 },
  summaryRow:  { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  summaryCard: { flex: 1, minWidth: 100, background: '#fff', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer' },
  progressBg:  { width: '100%', height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 99, transition: 'width 0.4s' },
  empty:       { background: '#fff', borderRadius: 12, padding: '60px 20px', textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  monthSection:{ marginBottom: 20 },
  monthHeader: { fontSize: '0.88rem', fontWeight: 700, color: '#374151', marginBottom: 10, padding: '6px 0', borderBottom: '2px solid #e5e7eb' },
  recordGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 },
  recordCard:  { background: '#fff', border: '1.5px solid', borderRadius: 8, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
};

export default StudentAttendance;
