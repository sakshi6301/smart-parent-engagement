import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';

const AIRiskMonitor = () => {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { api.get('/students').then(({ data }) => setStudents(data)); }, []);

  const analyzeStudent = async (studentId) => {
    setLoading(prev => ({ ...prev, [studentId]: true }));
    try {
      const { data } = await api.get(`/ai/risk/${studentId}`);
      setResults(prev => ({ ...prev, [studentId]: data }));
    } catch {
      setResults(prev => ({ ...prev, [studentId]: { error: true } }));
    }
    setLoading(prev => ({ ...prev, [studentId]: false }));
  };

  const analyzeAll = async () => {
    setAnalyzing(true);
    for (const s of students) await analyzeStudent(s._id);
    setAnalyzing(false);
  };

  const riskConfig = {
    low: { color: '#10b981', bg: '#f0fdf4', icon: '🟢', badge: 'success' },
    medium: { color: '#f59e0b', bg: '#fffbeb', icon: '🟡', badge: 'warning' },
    high: { color: '#ef4444', bg: '#fef2f2', icon: '🔴', badge: 'danger' },
  };

  const analyzed = Object.keys(results).length;
  const highRisk = Object.values(results).filter(r => r.risk_level === 'high').length;
  const medRisk = Object.values(results).filter(r => r.risk_level === 'medium').length;

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🤖 AI Risk Monitor</h2>
          <p style={styles.sub}>ML-powered student risk prediction based on attendance, grades & homework</p>
        </div>
        <button onClick={analyzeAll} disabled={analyzing} style={styles.analyzeBtn}>
          {analyzing ? '⏳ Analyzing...' : '🔍 Analyze All Students'}
        </button>
      </div>

      {analyzed > 0 && (
        <div style={styles.summaryRow}>
          <div style={{ ...styles.summaryCard, borderColor: '#10b981', background: '#f0fdf4' }}>
            <span style={{ fontSize: '1.8rem' }}>🟢</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{Object.values(results).filter(r => r.risk_level === 'low').length}</span>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Low Risk</span>
          </div>
          <div style={{ ...styles.summaryCard, borderColor: '#f59e0b', background: '#fffbeb' }}>
            <span style={{ fontSize: '1.8rem' }}>🟡</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{medRisk}</span>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Medium Risk</span>
          </div>
          <div style={{ ...styles.summaryCard, borderColor: '#ef4444', background: '#fef2f2' }}>
            <span style={{ fontSize: '1.8rem' }}>🔴</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{highRisk}</span>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>High Risk</span>
          </div>
          <div style={{ ...styles.summaryCard, borderColor: '#4f46e5', background: '#f5f3ff' }}>
            <span style={{ fontSize: '1.8rem' }}>📊</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5' }}>{analyzed}/{students.length}</span>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Analyzed</span>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {students.map(s => {
          const result = results[s._id];
          const isLoading = loading[s._id];
          const cfg = result?.risk_level ? riskConfig[result.risk_level] : null;

          return (
            <div key={s._id} style={{ ...styles.card, background: cfg ? cfg.bg : '#fff', borderColor: cfg ? cfg.color : '#e5e7eb' }}>
              <div style={styles.cardHeader}>
                <div style={styles.sAvatar}>{s.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.sName}>{s.name}</div>
                  <div style={styles.sInfo}>Roll: {s.rollNumber} · Class {s.class}-{s.section}</div>
                </div>
                {cfg && <Badge label={`${cfg.icon} ${result.risk_level.toUpperCase()}`} type={cfg.badge} />}
              </div>

              {result && !result.error && (
                <div style={styles.metrics}>
                  {[
                    ['Attendance', `${result.attendance_pct?.toFixed(1)}%`, result.attendance_pct < 75 ? '#ef4444' : '#10b981'],
                    ['Avg Grade', `${result.avg_grade?.toFixed(1)}%`, result.avg_grade < 50 ? '#ef4444' : '#10b981'],
                    ['HW Done', `${result.hw_completion_rate?.toFixed(1)}%`, result.hw_completion_rate < 60 ? '#f59e0b' : '#10b981'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={styles.metric}>
                      <span style={styles.metricLabel}>{label}</span>
                      <span style={{ ...styles.metricVal, color }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              {result?.suggestions?.length > 0 && (
                <div style={styles.suggestions}>
                  {result.suggestions.map((sg, i) => <div key={i} style={styles.suggestion}>💡 {sg}</div>)}
                </div>
              )}

              {!result && (
                <button onClick={() => analyzeStudent(s._id)} disabled={isLoading} style={styles.analyzeOneBtn}>
                  {isLoading ? '⏳ Analyzing...' : '🔍 Analyze Risk'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub: { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  analyzeBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' },
  summaryRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  summaryCard: { flex: 1, minWidth: 100, border: '2px solid', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  card: { border: '2px solid', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10 },
  sAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 },
  sName: { fontWeight: 600, fontSize: '0.9rem', color: '#111827' },
  sInfo: { fontSize: '0.72rem', color: '#9ca3af' },
  metrics: { display: 'flex', gap: 8 },
  metric: { flex: 1, background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: '0.7rem', color: '#6b7280' },
  metricVal: { fontSize: '1rem', fontWeight: 800 },
  suggestions: { display: 'flex', flexDirection: 'column', gap: 4 },
  suggestion: { fontSize: '0.78rem', color: '#374151', background: 'rgba(255,255,255,0.8)', padding: '5px 8px', borderRadius: 6 },
  analyzeOneBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '8px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', width: '100%' },
};

export default AIRiskMonitor;
