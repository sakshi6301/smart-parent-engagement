import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';

const pct  = (g) => +((g.marksObtained / g.totalMarks) * 100).toFixed(1);
const letter = (p) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'F';
const color  = (p) => p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444';

const EXAM_LABELS = { unit_test: 'Unit Test', midterm: 'Midterm', final: 'Final', assignment: 'Assignment' };

const TrendArrow = ({ trend, slope }) => {
  if (trend === 'improving') return <span style={{ color: '#10b981', fontWeight: 700 }}>▲ Improving ({slope > 0 ? '+' : ''}{slope}/exam)</span>;
  if (trend === 'declining') return <span style={{ color: '#ef4444', fontWeight: 700 }}>▼ Declining ({slope}/exam)</span>;
  return <span style={{ color: '#f59e0b', fontWeight: 700 }}>→ Stable</span>;
};

const ParentGrades = () => {
  const [student, setStudent]   = useState(null);
  const [grades, setGrades]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [trends, setTrends]     = useState({});
  const [anomaly, setAnomaly]   = useState(null);

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      if (data.length === 0) { setLoading(false); return; }
      const s = data[0];
      setStudent(s);
      api.get(`/grades/${s._id}`).then(r => {
        setGrades(r.data.grades || []);
        setLoading(false);
      }).catch(() => setLoading(false));
      api.get(`/ai/grade-trend/${s._id}`).then(r => setTrends(r.data.trends || {})).catch(() => {});
      api.get(`/ai/attendance-anomaly/${s._id}`).then(r => setAnomaly(r.data)).catch(() => {});
    }).catch(() => setLoading(false));
  }, []);

  // Subject averages
  const subjectMap = {};
  grades.forEach(g => {
    if (!subjectMap[g.subject]) subjectMap[g.subject] = [];
    subjectMap[g.subject].push(pct(g));
  });
  const subjects = Object.keys(subjectMap).sort();
  const subjectAvgs = subjects.map(sub => {
    const scores = subjectMap[sub];
    const avg = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    return { subject: sub, avg, count: scores.length };
  });

  const overallAvg = grades.length
    ? +(grades.reduce((sum, g) => sum + pct(g), 0) / grades.length).toFixed(1)
    : 0;

  const examTypes = [...new Set(grades.map(g => g.examType))];

  const filtered = grades.filter(g =>
    (filter === 'all' || g.subject === filter) &&
    (examFilter === 'all' || g.examType === examFilter)
  );

  if (loading) return <AppLayout><div style={S.center}>Loading grades...</div></AppLayout>;

  if (!student) return (
    <AppLayout>
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>👨👩👧</div>
        <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>No child linked to your account</p>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>Contact your school admin to link your child.</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>📊 Academic Performance</h2>
          <p style={S.sub}>{student?.name} · Class {student?.class}-{student?.section}</p>
        </div>
        <div style={S.overallBadge}>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Overall Avg</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: color(overallAvg) }}>{overallAvg}%</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: color(overallAvg) }}>{letter(overallAvg)}</span>
        </div>
      </div>

      {/* AI Anomaly Alert */}
      {anomaly?.is_anomaly && (
        <div style={S.anomalyAlert}>
          ⚠️ <strong>Attendance Alert:</strong> {anomaly.message}
        </div>
      )}

      {grades.length === 0 ? (
        <div style={S.empty}>
          <span style={{ fontSize: '3rem' }}>📝</span>
          <h3 style={{ color: '#374151' }}>No grades recorded yet</h3>
          <p style={{ color: '#9ca3af' }}>Grades will appear here once your child's teacher uploads them.</p>
        </div>
      ) : (
        <>
          {/* AI Grade Trend Panel */}
          {Object.keys(trends).length > 0 && (
            <div style={S.trendCard}>
              <h3 style={S.trendTitle}>🤖 AI Grade Trend Forecast</h3>
              <div style={S.trendGrid}>
                {Object.entries(trends).map(([sub, t]) => (
                  <div key={sub} style={S.trendItem}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: 4 }}>{sub}</div>
                    <TrendArrow trend={t.trend} slope={t.slope} />
                    {t.predicted_next !== null && (
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>
                        Predicted next: <strong style={{ color: color(t.predicted_next) }}>{t.predicted_next}%</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject Summary Cards */}
          <div style={S.subjectGrid}>
            {subjectAvgs.map(({ subject, avg, count }) => (
              <div
                key={subject}
                onClick={() => setFilter(filter === subject ? 'all' : subject)}
                style={{ ...S.subjectCard, borderTop: `4px solid ${color(avg)}`, background: filter === subject ? '#f5f3ff' : '#fff', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#374151', marginBottom: 6 }}>{subject}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: color(avg) }}>{avg}%</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{letter(avg)} · {count} exam{count !== 1 ? 's' : ''}</div>
                {/* Mini bar */}
                <div style={{ marginTop: 8, height: 4, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${avg}%`, height: '100%', background: color(avg), borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={S.filterRow}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={S.filterLabel}>Subject:</span>
              {['all', ...subjects].map(sub => (
                <button key={sub} onClick={() => setFilter(sub)}
                  style={{ ...S.filterBtn, background: filter === sub ? '#4f46e5' : '#fff', color: filter === sub ? '#fff' : '#374151' }}>
                  {sub === 'all' ? 'All' : sub}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={S.filterLabel}>Exam:</span>
              {['all', ...examTypes].map(et => (
                <button key={et} onClick={() => setExamFilter(et)}
                  style={{ ...S.filterBtn, background: examFilter === et ? '#0891b2' : '#fff', color: examFilter === et ? '#fff' : '#374151' }}>
                  {et === 'all' ? 'All' : EXAM_LABELS[et] || et}
                </button>
              ))}
            </div>
          </div>

          {/* Grades Table */}
          <div style={S.tableCard}>
            <div style={S.tableHeader}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                {filter !== 'all' ? ` · ${filter}` : ''}
                {examFilter !== 'all' ? ` · ${EXAM_LABELS[examFilter] || examFilter}` : ''}
              </span>
            </div>
            <table style={S.table}>
              <thead>
                <tr style={S.thead}>
                  {['Subject', 'Exam Type', 'Marks', 'Score', 'Grade', 'Date'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => {
                  const p = pct(g);
                  return (
                    <tr key={g._id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={S.td}>
                        <span style={S.subTag}>{g.subject}</span>
                      </td>
                      <td style={S.td}>
                        <Badge label={EXAM_LABELS[g.examType] || g.examType} type="info" />
                      </td>
                      <td style={S.td}>
                        <strong>{g.marksObtained}</strong>
                        <span style={{ color: '#9ca3af' }}>/{g.totalMarks}</span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${p}%`, height: '100%', background: color(p), borderRadius: 4 }} />
                          </div>
                          <span style={{ color: color(p), fontWeight: 700, fontSize: '0.85rem' }}>{p}%</span>
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.gradePill, background: color(p) + '20', color: color(p) }}>
                          {letter(p)}
                        </span>
                      </td>
                      <td style={S.td}>
                        {new Date(g.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={S.noData}>No grades match the selected filters.</div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
};

const S = {
  center:      { textAlign: 'center', padding: 60, color: '#9ca3af' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title:       { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:         { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  overallBadge:{ background: '#fff', borderRadius: 12, padding: '12px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  empty:       { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  subjectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 },
  subjectCard: { borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', transition: 'box-shadow 0.15s' },
  filterRow:   { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  filterLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' },
  filterBtn:   { padding: '5px 12px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  tableCard:   { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  tableHeader: { padding: '14px 20px', borderBottom: '1px solid #f3f4f6' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { background: '#f8fafc' },
  th:          { padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' },
  td:          { padding: '12px 16px', fontSize: '0.85rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  subTag:      { background: '#e0e7ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700 },
  gradePill:   { padding: '3px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800 },
  noData:      { textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '0.88rem' },
  anomalyAlert: { background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', padding: '12px 18px', borderRadius: 10, marginBottom: 16, fontSize: '0.88rem' },
  trendCard:    { background: '#fff', borderRadius: 12, padding: '18px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 20 },
  trendTitle:   { fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: 14 },
  trendGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  trendItem:    { background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1px solid #e5e7eb' },
};

export default ParentGrades;
