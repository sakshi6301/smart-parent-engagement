import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const StudentHomework = () => {
  const { user } = useAuth();
  const [student, setStudent]   = useState(null);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('pending'); // pending | overdue | submitted | all
  const [submitting, setSubmitting] = useState({});
  const [msg, setMsg]           = useState('');
  const [fileMap, setFileMap]   = useState({}); // hwId -> File

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      if (data.length > 0) {
        const s = data[0];
        setStudent(s);
        api.get(`/homework/${s.class}-${s.section}`).then(r => {
          setHomework(r.data);
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  const isOverdue = (hw) => new Date(hw.dueDate) < new Date();
  const isSubmitted = (hw) => hw.submissions?.some(s =>
    s.student === student?._id || s.student?._id === student?._id
  );

  const daysLeft = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleSubmit = async (hwId) => {
    if (!student) return;
    setSubmitting(prev => ({ ...prev, [hwId]: true }));
    try {
      const formData = new FormData();
      formData.append('homeworkId', hwId);
      formData.append('studentId', student._id);
      if (fileMap[hwId]) formData.append('file', fileMap[hwId]);
      await api.post('/homework/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHomework(prev => prev.map(hw =>
        hw._id === hwId
          ? { ...hw, submissions: [...(hw.submissions || []), { student: student._id, submittedAt: new Date(), status: 'submitted' }] }
          : hw
      ));
      setFileMap(prev => { const n = { ...prev }; delete n[hwId]; return n; });
      setMsg('✅ Homework submitted!');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('❌ Failed to submit. Try again.');
      setTimeout(() => setMsg(''), 3000);
    }
    setSubmitting(prev => ({ ...prev, [hwId]: false }));
  };

  const pending   = homework.filter(hw => !isOverdue(hw) && !isSubmitted(hw));
  const overdue   = homework.filter(hw => isOverdue(hw) && !isSubmitted(hw));
  const submitted = homework.filter(hw => isSubmitted(hw));

  const tabData = { pending, overdue, submitted, all: homework };
  const displayed = tabData[tab] || [];

  const tabs = [
    { key: 'pending',   label: 'Pending',   count: pending.length,   color: '#f59e0b' },
    { key: 'overdue',   label: 'Overdue',   count: overdue.length,   color: '#ef4444' },
    { key: 'submitted', label: 'Submitted', count: submitted.length, color: '#10b981' },
    { key: 'all',       label: 'All',       count: homework.length,  color: '#6b7280' },
  ];

  if (loading) return <AppLayout><div style={S.center}>Loading homework...</div></AppLayout>;

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>📚 Homework</h2>
          <p style={S.sub}>{student?.name} · Class {student?.class}-{student?.section}</p>
        </div>
      </div>

      {msg && (
        <div style={{ ...S.msgBox, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#15803d' : '#b91c1c', borderColor: msg.startsWith('✅') ? '#bbf7d0' : '#fecaca' }}>
          {msg}
        </div>
      )}

      {/* Summary Cards */}
      <div style={S.summaryRow}>
        {tabs.slice(0, 3).map(t => (
          <div key={t.key} onClick={() => setTab(t.key)}
            style={{ ...S.summaryCard, borderTop: `3px solid ${t.color}`, cursor: 'pointer', background: tab === t.key ? '#f8fafc' : '#fff' }}>
            <span style={{ fontSize: '1.4rem' }}>
              {t.key === 'pending' ? '⏳' : t.key === 'overdue' ? '⚠️' : '✅'}
            </span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: t.color }}>{t.count}</span>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{t.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ ...S.tab, borderBottom: tab === t.key ? `2px solid ${t.color}` : '2px solid transparent', color: tab === t.key ? t.color : '#6b7280', fontWeight: tab === t.key ? 700 : 500 }}>
            {t.label}
            <span style={{ ...S.tabCount, background: tab === t.key ? t.color : '#e5e7eb', color: tab === t.key ? '#fff' : '#6b7280' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Homework List */}
      {displayed.length === 0 ? (
        <div style={S.empty}>
          <span style={{ fontSize: '3rem' }}>
            {tab === 'pending' ? '🎉' : tab === 'overdue' ? '✅' : '📚'}
          </span>
          <h3 style={{ color: '#374151' }}>
            {tab === 'pending' ? 'No pending homework!' : tab === 'overdue' ? 'No overdue homework!' : 'No homework found'}
          </h3>
        </div>
      ) : (
        <div style={S.list}>
          {displayed.map(hw => {
            const done = isSubmitted(hw);
            const late = isOverdue(hw);
            const days = daysLeft(hw.dueDate);
            const sub  = hw.submissions?.find(s => s.student === student?._id || s.student?._id === student?._id);

            return (
              <div key={hw._id} style={{ ...S.card, borderLeft: `4px solid ${done ? '#10b981' : late ? '#ef4444' : '#f59e0b'}` }}>
                <div style={S.cardTop}>
                  <div style={S.cardLeft}>
                    <span style={S.subjectTag}>{hw.subject}</span>
                    <h3 style={S.hwTitle}>{hw.title}</h3>
                    {hw.description && <p style={S.hwDesc}>{hw.description}</p>}
                    <div style={S.meta}>
                      <span>👨🏫 {hw.teacher?.name || 'Teacher'}</span>
                      <span>🏫 Class {hw.class}-{hw.section}</span>
                      <span style={{ color: done ? '#10b981' : late ? '#ef4444' : days <= 1 ? '#f59e0b' : '#6b7280', fontWeight: 600 }}>
                        📅 {done ? `Submitted ${sub?.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-IN') : ''}` :
                            late ? `Overdue since ${new Date(hw.dueDate).toLocaleDateString('en-IN')}` :
                            days === 0 ? 'Due today!' :
                            days === 1 ? 'Due tomorrow!' :
                            `Due in ${days} days (${new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`}
                      </span>
                    </div>
                  </div>
                  <div style={S.cardRight}>
                    <Badge
                      label={done ? 'Submitted' : late ? 'Overdue' : days <= 1 ? 'Urgent' : 'Pending'}
                      type={done ? 'success' : late ? 'danger' : days <= 1 ? 'warning' : 'info'}
                    />
                    {!done && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <label style={S.fileLabel}>
                          📎 {fileMap[hw._id] ? fileMap[hw._id].name : 'Attach file (optional)'}
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip" style={{ display: 'none' }}
                            onChange={e => setFileMap(prev => ({ ...prev, [hw._id]: e.target.files[0] }))} />
                        </label>
                        <button
                          onClick={() => handleSubmit(hw._id)}
                          disabled={submitting[hw._id]}
                          style={{ ...S.submitBtn, background: late ? '#fef2f2' : '#f0fdf4', color: late ? '#b91c1c' : '#15803d', border: `1px solid ${late ? '#fecaca' : '#bbf7d0'}` }}>
                          {submitting[hw._id] ? 'Submitting...' : '✓ Submit'}
                        </button>
                      </div>
                    )}
                    {done && sub?.status && (
                      <span style={S.submittedLabel}>
                        {sub.status === 'late' ? '⏰ Late' : '✅ On time'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

const S = {
  center:       { textAlign: 'center', padding: 60, color: '#9ca3af' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:        { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:          { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  msgBox:       { border: '1px solid', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', fontWeight: 600 },
  summaryRow:   { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  summaryCard:  { flex: 1, minWidth: 100, background: '#fff', borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  tabs:         { display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb', marginBottom: 16 },
  tab:          { padding: '10px 18px', border: 'none', background: 'none', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1 },
  tabCount:     { padding: '1px 7px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 },
  empty:        { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  list:         { display: 'flex', flexDirection: 'column', gap: 12 },
  card:         { background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  cardLeft:     { flex: 1 },
  cardRight:    { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 },
  subjectTag:   { display: 'inline-block', background: '#e0e7ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, marginBottom: 6 },
  hwTitle:      { fontSize: '1rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  hwDesc:       { fontSize: '0.85rem', color: '#6b7280', margin: '0 0 8px', lineHeight: 1.5 },
  meta:         { display: 'flex', gap: 14, fontSize: '0.78rem', color: '#9ca3af', flexWrap: 'wrap' },
  submitBtn:    { padding: '7px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  submittedLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#10b981' },
  fileLabel:    { fontSize: '0.75rem', color: '#4f46e5', cursor: 'pointer', background: '#eff6ff', border: '1px dashed #93c5fd', borderRadius: 6, padding: '5px 10px', fontWeight: 600 },
};

export default StudentHomework;
