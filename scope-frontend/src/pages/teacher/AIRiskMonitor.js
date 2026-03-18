import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';

const riskConfig = {
  low:         { color: '#10b981', bg: '#f0fdf4', badge: 'success',  label: 'Low' },
  medium:      { color: '#f59e0b', bg: '#fffbeb', badge: 'warning',  label: 'Medium' },
  high:        { color: '#ef4444', bg: '#fef2f2', badge: 'danger',   label: 'High' },
  unavailable: { color: '#9ca3af', bg: '#f9fafb', badge: 'info',     label: 'N/A' },
};

const AIRiskMonitor = () => {
  const [students, setStudents]   = useState([]);
  const [results, setResults]     = useState({});   // { [id]: riskData }
  const [trends, setTrends]       = useState({});   // { [id]: trendData }
  const [anomalies, setAnomalies] = useState({});   // { [id]: anomalyData }
  const [loading, setLoading]     = useState({});
  const [expanded, setExpanded]   = useState({});   // { [id]: 'trend' | null }
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter]       = useState('all');
  const [alerting, setAlerting]   = useState({});

  useEffect(() => {
    api.get('/students').then(({ data }) => setStudents(data)).catch(() => {});
  }, []);

  const analyzeStudent = async (id) => {
    setLoading(prev => ({ ...prev, [id]: true }));
    try {
      const [risk, anomaly] = await Promise.all([
        api.get(`/ai/risk/${id}`).then(r => r.data).catch(() => ({ error: true })),
        api.get(`/ai/attendance-anomaly/${id}`).then(r => r.data).catch(() => null),
      ]);
      setResults(prev => ({ ...prev, [id]: risk }));
      if (anomaly) setAnomalies(prev => ({ ...prev, [id]: anomaly }));
    } catch {}
    setLoading(prev => ({ ...prev, [id]: false }));
  };

  const loadTrend = async (id) => {
    if (trends[id]) { setExpanded(prev => ({ ...prev, [id]: expanded[id] === 'trend' ? null : 'trend' })); return; }
    try {
      const { data } = await api.get(`/ai/grade-trend/${id}`);
      setTrends(prev => ({ ...prev, [id]: data }));
      setExpanded(prev => ({ ...prev, [id]: 'trend' }));
    } catch {}
  };

  const analyzeAll = async () => {
    setAnalyzing(true);
    await Promise.all(students.map(s => analyzeStudent(s._id)));
    setAnalyzing(false);
  };

  const sendAlert = async (student) => {
    if (!student.parent) { alert('No parent linked to this student.'); return; }
    setAlerting(prev => ({ ...prev, [student._id]: true }));
    const result = results[student._id];
    try {
      await api.post('/notifications/send', {
        recipientId: student.parent._id || student.parent,
        title: 'Student At Risk Alert',
        body: `Your child ${student.name} has been flagged as ${result.risk_level} risk. Attendance: ${result.attendance_pct?.toFixed(1)}%, Avg Grade: ${result.avg_grade?.toFixed(1)}%.`,
        type: 'alert',
        channels: ['push', 'email'],
        relatedStudent: student._id,
      });
      alert(`Alert sent to ${student.name}'s parent.`);
    } catch {
      alert('Failed to send alert.');
    }
    setAlerting(prev => ({ ...prev, [student._id]: false }));
  };

  const analyzed = Object.keys(results).length;
  const counts = { low: 0, medium: 0, high: 0 };
  Object.values(results).forEach(r => { if (counts[r.risk_level] !== undefined) counts[r.risk_level]++; });

  const filtered = students.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'unanalyzed') return !results[s._id];
    return results[s._id]?.risk_level === filter;
  });

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>AI Risk Monitor</h2>
          <p style={styles.sub}>ML-powered risk prediction based on attendance, grades and homework</p>
        </div>
        <button onClick={analyzeAll} disabled={analyzing || !students.length} style={styles.analyzeBtn}>
          {analyzing ? 'Analyzing...' : 'Analyze All Students'}
        </button>
      </div>

      {/* Summary cards */}
      {analyzed > 0 && (
        <div style={styles.summaryRow}>
          {[['low','#10b981','#f0fdf4','Low Risk'], ['medium','#f59e0b','#fffbeb','Medium Risk'], ['high','#ef4444','#fef2f2','High Risk']].map(([k, color, bg, label]) => (
            <div key={k} style={{ ...styles.summaryCard, borderColor: color, background: bg, cursor: 'pointer', outline: filter === k ? `2px solid ${color}` : 'none' }}
              onClick={() => setFilter(filter === k ? 'all' : k)}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{counts[k]}</span>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{label}</span>
            </div>
          ))}
          <div style={{ ...styles.summaryCard, borderColor: '#4f46e5', background: '#f5f3ff' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5' }}>{analyzed}/{students.length}</span>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Analyzed</span>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {students.length > 0 && (
        <div style={styles.filterBar}>
          {['all', 'high', 'medium', 'low', 'unanalyzed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#9ca3af' }}>{filtered.length} students</span>
        </div>
      )}

      {students.length === 0 && (
        <div style={styles.empty}>
          <span style={{ fontSize: '3rem' }}>👥</span>
          <h3>No students assigned</h3>
          <p style={{ color: '#9ca3af' }}>Students will appear here once assigned to you.</p>
        </div>
      )}

      <div style={styles.grid}>
        {filtered.map(s => {
          const result   = results[s._id];
          const anomaly  = anomalies[s._id];
          const trend    = trends[s._id];
          const isLoading = loading[s._id];
          const cfg = result?.risk_level ? (riskConfig[result.risk_level] || riskConfig.unavailable) : null;
          const showTrend = expanded[s._id] === 'trend';

          return (
            <div key={s._id} style={{ ...styles.card, background: cfg ? cfg.bg : '#fff', borderColor: cfg ? cfg.color : '#e5e7eb' }}>
              {/* Card header */}
              <div style={styles.cardHeader}>
                <div style={styles.sAvatar}>{s.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.sName}>{s.name}</div>
                  <div style={styles.sInfo}>Roll: {s.rollNumber} · Class {s.class}-{s.section}</div>
                </div>
                {cfg && <Badge label={cfg.label} type={cfg.badge} />}
              </div>

              {/* Anomaly banner */}
              {anomaly?.is_anomaly && (
                <div style={styles.anomalyBanner}>
                  Attendance anomaly: {anomaly.risk_type || anomaly.message}
                </div>
              )}

              {/* Metrics */}
              {result && !result.error && (
                <div style={styles.metrics}>
                  {[
                    ['Attendance', `${result.attendance_pct?.toFixed(1)}%`, result.attendance_pct < 75 ? '#ef4444' : '#10b981'],
                    ['Avg Grade',  `${result.avg_grade?.toFixed(1)}%`,      result.avg_grade < 50      ? '#ef4444' : '#10b981'],
                    ['HW Done',    `${result.hw_completion_rate?.toFixed(1)}%`, result.hw_completion_rate < 60 ? '#f59e0b' : '#10b981'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={styles.metric}>
                      <span style={styles.metricLabel}>{label}</span>
                      <span style={{ ...styles.metricVal, color }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {result?.suggestions?.length > 0 && (
                <div style={styles.suggestions}>
                  {result.suggestions.map((sg, i) => <div key={i} style={styles.suggestion}>💡 {sg}</div>)}
                </div>
              )}

              {/* Grade trend section */}
              {result && !result.error && (
                <button onClick={() => loadTrend(s._id)} style={styles.trendToggle}>
                  {showTrend ? 'Hide Grade Trend' : 'Show Grade Trend'}
                </button>
              )}

              {showTrend && trend?.trends && (
                <div style={styles.trendBox}>
                  {Object.entries(trend.trends).map(([subject, t]) => (
                    <div key={subject} style={styles.trendRow}>
                      <span style={styles.trendSubject}>{subject}</span>
                      <span style={{ fontSize: '0.78rem', color: t.direction === 'improving' ? '#10b981' : t.direction === 'declining' ? '#ef4444' : '#6b7280' }}>
                        {t.direction === 'improving' ? '↑' : t.direction === 'declining' ? '↓' : '→'} {t.direction}
                      </span>
                      {t.predicted_next !== undefined && (
                        <span style={styles.trendPred}>Next: {t.predicted_next?.toFixed(1)}%</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={styles.cardActions}>
                {!result && (
                  <button onClick={() => analyzeStudent(s._id)} disabled={isLoading} style={styles.analyzeOneBtn}>
                    {isLoading ? 'Analyzing...' : 'Analyze Risk'}
                  </button>
                )}
                {result && (result.risk_level === 'high' || result.risk_level === 'medium') && (
                  <button onClick={() => sendAlert(s)} disabled={alerting[s._id]} style={styles.alertBtn}>
                    {alerting[s._id] ? 'Sending...' : 'Alert Parent'}
                  </button>
                )}
                {result && (
                  <button onClick={() => analyzeStudent(s._id)} disabled={isLoading} style={styles.reanalyzeBtn}>
                    {isLoading ? '...' : 'Re-analyze'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

const styles = {
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title:          { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:            { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  analyzeBtn:     { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  summaryRow:     { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  summaryCard:    { flex: 1, minWidth: 90, border: '2px solid', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  filterBar:      { display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  filterBtn:      { padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, background: '#fff', color: '#6b7280', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
  filterBtnActive:{ background: '#4f46e5', color: '#fff', borderColor: '#4f46e5' },
  empty:          { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  card:           { border: '2px solid', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  cardHeader:     { display: 'flex', alignItems: 'center', gap: 10 },
  sAvatar:        { width: 36, height: 36, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 },
  sName:          { fontWeight: 600, fontSize: '0.9rem', color: '#111827' },
  sInfo:          { fontSize: '0.72rem', color: '#9ca3af' },
  anomalyBanner:  { background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px', fontSize: '0.78rem', color: '#92400e', fontWeight: 600 },
  metrics:        { display: 'flex', gap: 8 },
  metric:         { flex: 1, background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  metricLabel:    { fontSize: '0.7rem', color: '#6b7280' },
  metricVal:      { fontSize: '1rem', fontWeight: 800 },
  suggestions:    { display: 'flex', flexDirection: 'column', gap: 4 },
  suggestion:     { fontSize: '0.78rem', color: '#374151', background: 'rgba(255,255,255,0.8)', padding: '5px 8px', borderRadius: 6 },
  trendToggle:    { background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 10px', fontSize: '0.78rem', color: '#4f46e5', cursor: 'pointer', fontWeight: 600, textAlign: 'left' },
  trendBox:       { background: 'rgba(255,255,255,0.8)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 },
  trendRow:       { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' },
  trendSubject:   { fontWeight: 600, color: '#374151', minWidth: 80 },
  trendPred:      { marginLeft: 'auto', color: '#6b7280', fontSize: '0.75rem' },
  cardActions:    { display: 'flex', gap: 8, flexWrap: 'wrap' },
  analyzeOneBtn:  { flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '8px', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  alertBtn:       { flex: 1, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '7px 10px', borderRadius: 8, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' },
  reanalyzeBtn:   { background: 'rgba(255,255,255,0.7)', color: '#6b7280', border: '1px solid #e5e7eb', padding: '7px 10px', borderRadius: 8, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' },
};

export default AIRiskMonitor;
