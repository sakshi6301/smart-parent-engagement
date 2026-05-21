import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const riskColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981', unavailable: '#9ca3af' };
const trendIcon = { improving: '▲', declining: '▼', stable: '→' };
const trendColor = { improving: '#10b981', declining: '#ef4444', stable: '#f59e0b' };

const RiskMonitor = () => {
  const [students, setStudents] = useState([]);
  const [results, setResults]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState(false);

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      setStudents(data);
      setLoading(false);
    });
  }, []);

  const runAnalysis = async () => {
    setRunning(true);
    const out = {};
    await Promise.all(students.map(async (s) => {
      const [risk, trend, anomaly] = await Promise.all([
        api.get(`/ai/risk/${s._id}`).catch(() => ({ data: { risk_level: 'unavailable', confidence: 0, suggestions: [] } })),
        api.get(`/ai/grade-trend/${s._id}`).catch(() => ({ data: { trends: {} } })),
        api.get(`/ai/attendance-anomaly/${s._id}`).catch(() => ({ data: { is_anomaly: false, message: '' } })),
      ]);
      out[s._id] = {
        risk: risk.data,
        trends: trend.data.trends || {},
        anomaly: anomaly.data,
      };
    }));
    setResults(out);
    setRunning(false);
  };

  if (loading) return <AppLayout><div style={S.center}>Loading students...</div></AppLayout>;

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>🤖 AI Risk Monitor</h2>
          <p style={S.sub}>Run AI analysis on all students — risk level, grade trends, attendance anomalies</p>
        </div>
        <button onClick={runAnalysis} disabled={running} style={S.runBtn}>
          {running ? '⏳ Analysing...' : '▶ Run AI Analysis'}
        </button>
      </div>

      {Object.keys(results).length === 0 && !running && (
        <div style={S.empty}>
          <span style={{ fontSize: '3rem' }}>🤖</span>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Click "Run AI Analysis" to analyse all {students.length} students</p>
        </div>
      )}

      <div style={S.grid}>
        {students.map(s => {
          const r = results[s._id];
          if (!r) return null;
          const rl = r.risk.risk_level || 'unavailable';
          const trendEntries = Object.entries(r.trends);
          return (
            <div key={s._id} style={{ ...S.card, borderTop: `4px solid ${riskColor[rl] || '#9ca3af'}` }}>
              {/* Student header */}
              <div style={S.cardHead}>
                <div style={{ ...S.avatar, background: riskColor[rl] + '20', color: riskColor[rl] }}>{s.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.name}>{s.name}</div>
                  <div style={S.rollNo}>Roll {s.rollNumber} · Class {s.class}-{s.section}</div>
                </div>
                <span style={{ ...S.riskBadge, background: riskColor[rl] + '20', color: riskColor[rl] }}>
                  {rl.toUpperCase()}
                </span>
              </div>

              {/* Risk details */}
              <div style={S.section}>
                <div style={S.label}>Risk Confidence</div>
                <div style={S.bar}>
                  <div style={{ ...S.barFill, width: `${r.risk.confidence || 0}%`, background: riskColor[rl] }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{r.risk.confidence || 0}%</div>
              </div>

              {/* Attendance anomaly */}
              {r.anomaly.is_anomaly && (
                <div style={S.anomaly}>⚠️ {r.anomaly.message}</div>
              )}

              {/* Grade trends */}
              {trendEntries.length > 0 && (
                <div style={S.section}>
                  <div style={S.label}>Grade Trends</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {trendEntries.map(([sub, t]) => (
                      <span key={sub} style={{ ...S.trendPill, color: trendColor[t.trend], background: trendColor[t.trend] + '15' }}>
                        {trendIcon[t.trend]} {sub} {t.predicted_next !== null ? `→ ${t.predicted_next}%` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {r.risk.suggestions?.length > 0 && (
                <div style={S.section}>
                  <div style={S.label}>Suggestions</div>
                  {r.risk.suggestions.map((sg, i) => (
                    <div key={i} style={S.suggestion}>• {sg}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

const S = {
  center:    { textAlign: 'center', padding: 60, color: '#9ca3af' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title:     { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:       { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  runBtn:    { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
  empty:     { textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card:      { background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardHead:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar:    { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 },
  name:      { fontWeight: 700, fontSize: '0.92rem', color: '#111827' },
  rollNo:    { fontSize: '0.72rem', color: '#9ca3af' },
  riskBadge: { padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800 },
  section:   { marginTop: 10 },
  label:     { fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 },
  bar:       { height: 6, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 4, transition: 'width 0.4s' },
  anomaly:   { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 6, padding: '6px 10px', fontSize: '0.78rem', marginTop: 10 },
  trendPill: { padding: '3px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700 },
  suggestion:{ fontSize: '0.78rem', color: '#374151', marginTop: 3 },
};

export default RiskMonitor;
