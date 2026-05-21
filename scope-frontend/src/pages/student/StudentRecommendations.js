import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const priorityMeta = {
  high:   { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Needs Urgent Attention' },
  medium: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Needs Improvement' },
};

const StudentRecommendations = () => {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [risk, setRisk]       = useState(null);

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      if (!data.length) { setLoading(false); return; }
      const s = data[0];
      setStudentId(s._id);

      Promise.all([
        api.get(`/ai/recommendations/${s._id}`).catch(() => ({ data: { recommendations: [] } })),
        api.get(`/ai/risk/${s._id}`).catch(() => ({ data: null })),
      ]).then(([recRes, riskRes]) => {
        setRecommendations(recRes.data.recommendations || []);
        setRisk(riskRes.data);
        setLoading(false);
      });
    }).catch(() => { setError('Unable to load student data.'); setLoading(false); });
  }, []);

  if (loading) return (
    <AppLayout>
      <div style={S.center}><div style={S.spinner} />Loading AI recommendations...</div>
    </AppLayout>
  );

  return (
    <AppLayout>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>🤖 AI Study Recommendations</h2>
          <p style={S.sub}>Personalised suggestions based on your academic performance</p>
        </div>
        {risk && (
          <div style={{ ...S.riskBadge, background: risk.risk_level === 'low' ? '#f0fdf4' : risk.risk_level === 'medium' ? '#fffbeb' : '#fef2f2' }}>
            <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: 2 }}>Overall Risk</span>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: risk.risk_level === 'low' ? '#15803d' : risk.risk_level === 'medium' ? '#92400e' : '#b91c1c' }}>
              {risk.risk_level?.toUpperCase() || '—'}
            </span>
            {risk.confidence != null && (
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{risk.confidence}% confidence</span>
            )}
          </div>
        )}
      </div>

      {error && <div style={S.errBox}>{error}</div>}

      {/* AI Suggestions from risk predictor */}
      {risk?.suggestions?.length > 0 && (
        <div style={S.suggestCard}>
          <p style={S.sectionTitle}>💡 AI Suggestions</p>
          <ul style={S.suggestList}>
            {risk.suggestions.map((sg, i) => (
              <li key={i} style={S.suggestItem}>{sg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Subject Recommendations */}
      {recommendations.length === 0 && !loading && (
        <div style={S.emptyState}>
          <span style={{ fontSize: '3rem' }}>🌟</span>
          <p style={{ color: '#6b7280', marginTop: 10, fontSize: '0.95rem' }}>
            No weak subjects detected — you're performing well across all subjects!
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: 4 }}>
            AI recommendations appear here for subjects where your average is below 60%.
          </p>
        </div>
      )}

      {recommendations.length > 0 && (
        <>
          <p style={S.sectionTitle}>📚 Subject-wise Study Plan</p>
          <div style={S.recGrid}>
            {recommendations.map((r, i) => {
              const meta = priorityMeta[r.priority] || priorityMeta.medium;
              return (
                <div key={i} style={{ ...S.recCard, borderTop: `4px solid ${meta.color}` }}>
                  {/* Subject header */}
                  <div style={S.recHead}>
                    <div style={{ ...S.subjectBadge, background: meta.bg, color: meta.color }}>
                      {r.subject}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: meta.color }}>{r.average_score?.toFixed(0)}%</div>
                      <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>avg score</div>
                    </div>
                  </div>

                  {/* Priority label */}
                  <div style={{ ...S.priorityLabel, background: meta.bg, color: meta.color, borderColor: meta.border }}>
                    {meta.label}
                  </div>

                  {/* Progress bar */}
                  <div style={S.progressWrap}>
                    <div style={{ ...S.progressBar, width: `${Math.min(r.average_score || 0, 100)}%`, background: meta.color }} />
                  </div>

                  {/* Practice exercises */}
                  {r.recommendations?.exercises?.length > 0 && (
                    <div style={S.section}>
                      <p style={S.sectionLabel}>✏️ Practice Exercises</p>
                      <ul style={S.list}>
                        {r.recommendations.exercises.map((e, j) => (
                          <li key={j} style={S.listItem}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Video resources */}
                  {r.recommendations?.videos?.length > 0 && (
                    <div style={S.section}>
                      <p style={S.sectionLabel}>🎥 Video Resources</p>
                      <ul style={S.list}>
                        {r.recommendations.videos.map((v, j) => (
                          <li key={j} style={S.listItem}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {r.recommendations?.tips?.length > 0 && (
                    <div style={S.section}>
                      <p style={S.sectionLabel}>💡 Study Tips</p>
                      <ul style={S.list}>
                        {r.recommendations.tips.map((tip, j) => (
                          <li key={j} style={S.listItem}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
};

const S = {
  center:       { textAlign: 'center', padding: '80px 20px', color: '#9ca3af', fontSize: '0.92rem' },
  spinner:      { width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title:        { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:          { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  riskBadge:    { borderRadius: 12, padding: '12px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  errBox:       { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: '0.88rem' },
  suggestCard:  { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '18px 20px', marginBottom: 20 },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: '0 0 12px' },
  suggestList:  { paddingLeft: 20, margin: 0 },
  suggestItem:  { fontSize: '0.88rem', color: '#1e40af', lineHeight: 1.8 },
  emptyState:   { textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  recGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 },
  recCard:      { background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  recHead:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subjectBadge: { fontSize: '1rem', fontWeight: 800, padding: '6px 14px', borderRadius: 8 },
  priorityLabel:{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid', marginBottom: 10 },
  progressWrap: { height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  progressBar:  { height: '100%', borderRadius: 4, transition: 'width 0.5s' },
  section:      { marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f6' },
  sectionLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 6px' },
  list:         { paddingLeft: 16, margin: 0 },
  listItem:     { fontSize: '0.82rem', color: '#374151', lineHeight: 1.75 },
};

export default StudentRecommendations;
