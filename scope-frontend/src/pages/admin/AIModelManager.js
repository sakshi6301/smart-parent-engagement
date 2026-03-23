import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const AI_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';

const RISK_META = {
  high:    { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'High Risk' },
  medium:  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Medium Risk' },
  low:     { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', label: 'Low Risk' },
  unknown: { color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', label: 'Unknown' },
};

const AIModelManager = () => {
  const [info, setInfo]             = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [file, setFile]             = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [msg, setMsg]               = useState('');
  const fileRef = useRef();

  // Risk table state
  const [risks, setRisks]           = useState([]);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskLoaded, setRiskLoaded] = useState(false);
  const [riskFilter, setRiskFilter] = useState('all');
  const [riskSearch, setRiskSearch] = useState('');

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 5000); };
  const isOk = msg.startsWith('OK:');
  const msgText = msg.startsWith('OK:') || msg.startsWith('ERR:') ? msg.slice(3) : msg;

  const fetchInfo = () => {
    setInfoLoading(true);
    fetch(`${AI_URL}/model/info`)
      .then(r => r.json())
      .then(d => { setInfo(d); setInfoLoading(false); })
      .catch(() => { setInfo(null); setInfoLoading(false); });
  };

  useEffect(() => { fetchInfo(); }, []);

  const fetchRisks = async () => {
    setRiskLoading(true);
    try {
      const { data } = await api.get('/ai/risk-all');
      setRisks(data);
      setRiskLoaded(true);
    } catch {
      showMsg('ERR:Failed to load risk data.');
    }
    setRiskLoading(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${AI_URL}/train/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      showMsg(`OK:${data.message}`);
      setFile(null);
      fileRef.current.value = '';
      fetchInfo();
    } catch (err) {
      showMsg(`ERR:${err.message}`);
    }
    setUploading(false);
  };

  const handleRetrain = async () => {
    if (!window.confirm('Retrain model on synthetic data?')) return;
    setRetraining(true);
    try {
      const res = await fetch(`${AI_URL}/train`, { method: 'POST' });
      const data = await res.json();
      showMsg(`OK:${data.message} — Accuracy: ${data.accuracy}%`);
      fetchInfo();
    } catch {
      showMsg('ERR:Retraining failed');
    }
    setRetraining(false);
  };

  const sourceColor = info?.source === 'real' ? '#10b981' : info?.source === 'synthetic' ? '#f59e0b' : '#9ca3af';
  const sourceLabel = info?.source === 'real' ? 'Real Data' : info?.source === 'synthetic' ? 'Synthetic' : '—';

  const highCount   = risks.filter(r => r.risk_level === 'high').length;
  const mediumCount = risks.filter(r => r.risk_level === 'medium').length;
  const lowCount    = risks.filter(r => r.risk_level === 'low').length;

  const filtered = risks.filter(r => {
    const matchFilter = riskFilter === 'all' || r.risk_level === riskFilter;
    const matchSearch = !riskSearch ||
      r.name.toLowerCase().includes(riskSearch.toLowerCase()) ||
      r.rollNumber?.toLowerCase().includes(riskSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <AppLayout>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>AI Risk Monitor</h2>
          <p style={s.sub}>Live student risk predictions · Model management</p>
        </div>
      </div>

      {msg && (
        <div style={{ ...s.msg, background: isOk ? '#f0fdf4' : '#fef2f2', color: isOk ? '#15803d' : '#b91c1c', borderColor: isOk ? '#bbf7d0' : '#fecaca' }}>
          {msgText}
        </div>
      )}

      {/* ── Model Status ── */}
      <div style={s.row}>
        <div style={{ ...s.card, flex: 1 }}>
          <p style={s.cardTitle}>Model Status</p>
          {infoLoading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Loading...</p>
          ) : !info ? (
            <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>AI service not reachable on port 8000.</p>
          ) : (
            <div style={s.statGrid}>
              <div style={s.statBox}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: sourceColor }}>{info.accuracy}%</span>
                <span style={s.statLabel}>Accuracy</span>
              </div>
              <div style={s.statBox}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5' }}>{info.samples?.toLocaleString()}</span>
                <span style={s.statLabel}>Samples</span>
              </div>
              <div style={s.statBox}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: sourceColor }}>{sourceLabel}</span>
                <span style={s.statLabel}>Data Source</span>
              </div>
            </div>
          )}
          {info?.source === 'synthetic' && (
            <div style={s.warning}>Trained on synthetic data. Upload real data below to improve accuracy.</div>
          )}
        </div>

        {/* Upload CSV */}
        <div style={{ ...s.card, flex: 2 }}>
          <p style={s.cardTitle}>Upload Real Data to Retrain</p>
          <p style={s.cardSub}>CSV columns: <code style={s.code}>attendance_pct, avg_grade, hw_completion_rate, risk</code> — min 20 rows</p>
          <form onSubmit={handleUpload} style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input ref={fileRef} type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} style={s.fileInput} />
            <button type="submit" disabled={!file || uploading} style={{ ...s.btn, background: '#4f46e5', opacity: (!file || uploading) ? 0.6 : 1 }}>
              {uploading ? 'Training...' : 'Upload & Retrain'}
            </button>
            <button type="button" onClick={handleRetrain} disabled={retraining} style={{ ...s.btn, background: '#f59e0b' }}>
              {retraining ? 'Retraining...' : 'Reset to Synthetic'}
            </button>
          </form>
        </div>
      </div>

      {/* ── At-Risk Students ── */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div>
            <p style={s.cardTitle}>Live Student Risk Analysis</p>
            <p style={s.cardSub}>AI-predicted risk based on attendance, grades and homework completion</p>
          </div>
          <button onClick={fetchRisks} disabled={riskLoading} style={{ ...s.btn, background: '#4f46e5' }}>
            {riskLoading ? 'Analysing...' : riskLoaded ? 'Refresh' : 'Run Analysis'}
          </button>
        </div>

        {riskLoaded && (
          <>
            {/* Summary chips */}
            <div style={s.summaryRow}>
              {[
                { key: 'all',    label: `All (${risks.length})`,       color: '#6b7280', bg: '#f3f4f6' },
                { key: 'high',   label: `High (${highCount})`,    color: '#b91c1c', bg: '#fef2f2' },
                { key: 'medium', label: `Medium (${mediumCount})`, color: '#92400e', bg: '#fffbeb' },
                { key: 'low',    label: `Low (${lowCount})`,       color: '#15803d', bg: '#f0fdf4' },
              ].map(f => (
                <button key={f.key} onClick={() => setRiskFilter(f.key)}
                  style={{ ...s.chip, background: riskFilter === f.key ? f.bg : '#fff', color: f.color, borderColor: riskFilter === f.key ? f.color : '#e5e7eb', fontWeight: riskFilter === f.key ? 700 : 500 }}>
                  {f.label}
                </button>
              ))}
              <input
                placeholder="Search student..."
                value={riskSearch}
                onChange={e => setRiskSearch(e.target.value)}
                style={s.searchInput}
              />
            </div>

            {/* Table */}
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Student', 'Class', 'Teacher', 'Attendance', 'Avg Grade', 'Homework', 'Risk Level'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '0.85rem' }}>No students match this filter.</td></tr>
                ) : filtered.map((r, i) => {
                  const meta = RISK_META[r.risk_level] || RISK_META.unknown;
                  return (
                    <tr key={r._id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ ...s.avatar, background: meta.bg, color: meta.color }}>{r.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{r.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}>{r.class}-{r.section}</td>
                      <td style={s.td}>{r.teacher?.name || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={s.td}><StatBar value={r.attendancePct} low={60} mid={75} /></td>
                      <td style={s.td}><StatBar value={r.avgGrade} low={40} mid={60} /></td>
                      <td style={s.td}><StatBar value={r.hwCompletionRate} low={40} mid={60} /></td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: meta.bg, color: meta.color, borderColor: meta.border }}>
                          {meta.label}
                          {r.confidence != null && <span style={{ opacity: 0.7, marginLeft: 4 }}>({r.confidence}%)</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {!riskLoaded && !riskLoading && (
          <div style={s.empty}>Click "Run Analysis" to predict risk levels for all students using the AI model.</div>
        )}
        {riskLoading && (
          <div style={s.empty}>Running predictions for all students... this may take a few seconds.</div>
        )}
      </div>
    </AppLayout>
  );
};

// Mini progress bar with colour coding
const StatBar = ({ value, low, mid }) => {
  const color = value < low ? '#ef4444' : value < mid ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: '0.78rem', color, fontWeight: 600 }}>{value}%</span>
    </div>
  );
};

const s = {
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:      { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:        { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  msg:        { border: '1px solid', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', fontWeight: 600 },
  row:        { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  card:       { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 16 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardTitle:  { fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: '0 0 4px' },
  cardSub:    { fontSize: '0.78rem', color: '#6b7280', margin: 0 },
  statGrid:   { display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  statBox:    { flex: 1, minWidth: 90, background: '#f8fafc', borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  statLabel:  { fontSize: '0.7rem', color: '#9ca3af' },
  warning:    { marginTop: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#92400e' },
  fileInput:  { border: '1.5px dashed #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', cursor: 'pointer', background: '#f9fafb' },
  btn:        { padding: '9px 18px', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  code:       { background: '#e0e7ff', color: '#4338ca', padding: '1px 5px', borderRadius: 4, fontSize: '0.75rem' },
  summaryRow: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  chip:       { padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: '0.8rem', cursor: 'pointer', background: '#fff' },
  searchInput:{ marginLeft: 'auto', padding: '6px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.82rem', outline: 'none', minWidth: 180 },
  table:      { width: '100%', borderCollapse: 'collapse' },
  thead:      { background: '#f8fafc' },
  th:         { padding: '9px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' },
  td:         { padding: '10px 12px', fontSize: '0.83rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  avatar:     { width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 },
  badge:      { display: 'inline-block', padding: '4px 10px', borderRadius: 20, border: '1px solid', fontSize: '0.75rem', fontWeight: 600 },
  empty:      { textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '0.85rem', background: '#f9fafb', borderRadius: 8 },
};

export default AIModelManager;
