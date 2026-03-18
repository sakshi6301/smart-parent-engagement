import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';

const HomeworkTracker = () => {
  const [student, setStudent]   = useState(null);
  const [homework, setHomework] = useState([]);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      if (data.length === 0) { setLoading(false); return; }
      const s = data[0];
      setStudent(s);
      api.get(`/homework/${s.class}-${s.section}`)
        .then(r => setHomework(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><div style={S.empty}>Loading...</div></AppLayout>;

  if (!student) return (
    <AppLayout>
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>No child linked</div>
        <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>No child linked to your account</p>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>Contact your school admin to link your child.</p>
      </div>
    </AppLayout>
  );

  const isSubmitted = (hw) => hw.submissions?.some(s => s.student === student._id || s.student?._id === student._id);
  const isOverdue   = (hw) => new Date(hw.dueDate) < new Date() && !isSubmitted(hw);
  const daysLeft    = (hw) => Math.ceil((new Date(hw.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

  const getStatus = (hw) => isSubmitted(hw) ? 'submitted' : isOverdue(hw) ? 'overdue' : 'pending';

  const STATUS_CFG = {
    submitted: { color: '#10b981', bg: '#f0fdf4', label: 'Submitted', icon: '✅' },
    overdue:   { color: '#ef4444', bg: '#fef2f2', label: 'Overdue',   icon: '⚠️' },
    pending:   { color: '#f59e0b', bg: '#fffbeb', label: 'Pending',   icon: '📌' },
  };

  const filtered = homework.filter(hw => filter === 'all' || getStatus(hw) === filter);

  const counts = { all: homework.length, pending: 0, overdue: 0, submitted: 0 };
  homework.forEach(hw => counts[getStatus(hw)]++);

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Homework Tracker</h2>
          <p style={S.sub}>{student ? `${student.name} · Class ${student.class}-${student.section}` : 'Loading...'}</p>
        </div>
      </div>

      {/* Summary */}
      <div style={S.summaryRow}>
        {[['all','📚','#4f46e5'],['pending','📌','#f59e0b'],['overdue','⚠️','#ef4444'],['submitted','✅','#10b981']].map(([key, icon, color]) => (
          <div key={key} onClick={() => setFilter(key)}
            style={{ ...S.summaryCard, borderTop: `3px solid ${filter === key ? color : '#e5e7eb'}`, cursor: 'pointer', opacity: filter === key ? 1 : 0.7 }}>
            <span style={{ fontSize: '1.4rem' }}>{icon}</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{counts[key]}</span>
            <span style={{ fontSize: '0.78rem', color: '#6b7280', textTransform: 'capitalize' }}>{key}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={S.empty}>
          <span style={{ fontSize: '3rem' }}>🎉</span>
          <p style={{ fontWeight: 600, color: '#374151' }}>No homework in this category!</p>
        </div>
      )}

      <div style={S.list}>
        {filtered.map(hw => {
          const status = getStatus(hw);
          const cfg = STATUS_CFG[status];
          const dl = daysLeft(hw);
          return (
            <div key={hw._id} style={{ ...S.card, borderLeft: `4px solid ${cfg.color}`, background: cfg.bg }}>
              <div style={S.cardTop}>
                <div style={{ flex: 1 }}>
                  <div style={S.subjectTag}>{hw.subject}</div>
                  <h3 style={S.hwTitle}>{hw.title}</h3>
                  {hw.description && <p style={S.hwDesc}>{hw.description}</p>}
                </div>
                <Badge label={cfg.label} type={status === 'submitted' ? 'success' : status === 'overdue' ? 'danger' : 'warning'} />
              </div>
              <div style={S.cardFooter}>
                <span style={S.metaItem}>📅 Due: <strong>{new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                <span style={S.metaItem}>👨🏫 {hw.teacher?.name || 'Teacher'}</span>
                {status === 'pending' && (
                  <span style={{ ...S.metaItem, color: dl <= 1 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                    {dl <= 0 ? '⚠️ Due today!' : `⏰ ${dl} day${dl > 1 ? 's' : ''} left`}
                  </span>
                )}
                {status === 'overdue' && <span style={{ ...S.metaItem, color: '#ef4444', fontWeight: 600 }}>⚠️ Overdue by {Math.abs(dl)} day{Math.abs(dl) > 1 ? 's' : ''}</span>}
                {status === 'submitted' && <span style={{ ...S.metaItem, color: '#10b981', fontWeight: 600 }}>✅ Submitted</span>}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

const S = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:       { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:         { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  summaryRow:  { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  summaryCard: { flex: 1, minWidth: 100, background: '#fff', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', transition: 'all 0.15s' },
  list:        { display: 'flex', flexDirection: 'column', gap: 12 },
  empty:       { background: '#fff', borderRadius: 12, padding: '60px 20px', textAlign: 'center', color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  card:        { background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  subjectTag:  { display: 'inline-block', background: '#e0e7ff', color: '#4f46e5', padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, marginBottom: 6 },
  hwTitle:     { fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  hwDesc:      { fontSize: '0.85rem', color: '#6b7280', margin: 0 },
  cardFooter:  { display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' },
  metaItem:    { fontSize: '0.82rem', color: '#9ca3af' },
};

export default HomeworkTracker;
