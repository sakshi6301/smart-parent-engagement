import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '../../components/layout/AppLayout';

const AI_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';

const AIModelManager = () => {
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [retraining, setRetraining] = useState(false);
  const fileRef = useRef();

  const fetchInfo = () => {
    setLoading(true);
    fetch(`${AI_URL}/model/info`)
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false); })
      .catch(() => { setInfo(null); setLoading(false); });
  };

  useEffect(() => { fetchInfo(); }, []);

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 5000); };

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
      showMsg(`✅ ${data.message}`);
      setFile(null);
      fileRef.current.value = '';
      fetchInfo();
    } catch (err) {
      showMsg(`❌ ${err.message}`);
    }
    setUploading(false);
  };

  const handleRetrain = async () => {
    if (!window.confirm('Retrain model on synthetic data?')) return;
    setRetraining(true);
    try {
      const res = await fetch(`${AI_URL}/train`, { method: 'POST' });
      const data = await res.json();
      showMsg(`✅ ${data.message} — Accuracy: ${data.accuracy}%`);
      fetchInfo();
    } catch {
      showMsg('❌ Retraining failed');
    }
    setRetraining(false);
  };

  const sourceColor = info?.source === 'real' ? '#10b981' : info?.source === 'synthetic' ? '#f59e0b' : '#9ca3af';
  const sourceLabel = info?.source === 'real' ? '✅ Real School Data' : info?.source === 'synthetic' ? '⚠️ Synthetic Data' : '—';

  return (
    <AppLayout>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>🤖 AI Model Manager</h2>
          <p style={s.sub}>Retrain the risk prediction model with real school data</p>
        </div>
      </div>

      {msg && (
        <div style={{ ...s.msg, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#15803d' : '#b91c1c', borderColor: msg.startsWith('✅') ? '#bbf7d0' : '#fecaca' }}>
          {msg}
        </div>
      )}

      {/* Model Status */}
      <div style={s.row}>
        <div style={s.card}>
          <p style={s.cardTitle}>📊 Current Model Status</p>
          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.88rem' }}>Loading...</p>
          ) : !info ? (
            <p style={{ color: '#ef4444', fontSize: '0.88rem' }}>⚠️ AI service not reachable. Make sure it's running on port 8000.</p>
          ) : (
            <div style={s.statGrid}>
              <div style={s.statBox}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: sourceColor }}>{info.accuracy}%</span>
                <span style={s.statLabel}>Accuracy</span>
              </div>
              <div style={s.statBox}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5' }}>{info.samples?.toLocaleString()}</span>
                <span style={s.statLabel}>Training Samples</span>
              </div>
              <div style={s.statBox}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: sourceColor }}>{sourceLabel}</span>
                <span style={s.statLabel}>Data Source</span>
              </div>
            </div>
          )}
          {info?.source === 'synthetic' && (
            <div style={s.warning}>
              ⚠️ The model is currently trained on synthetic data. Upload real student data below to improve accuracy.
            </div>
          )}
        </div>
      </div>

      {/* Upload CSV */}
      <div style={s.row}>
        <div style={{ ...s.card, flex: 2 }}>
          <p style={s.cardTitle}>📥 Upload Real School Data (CSV)</p>
          <p style={s.cardSub}>CSV must have these columns: <code style={s.code}>attendance_pct, avg_grade, hw_completion_rate, risk</code></p>
          <p style={s.cardSub}>Valid values for <code style={s.code}>risk</code>: <code style={s.code}>low</code>, <code style={s.code}>medium</code>, <code style={s.code}>high</code> — minimum 20 rows required.</p>

          <form onSubmit={handleUpload} style={s.form}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={e => setFile(e.target.files[0])}
              style={s.fileInput}
            />
            {file && <p style={s.fileName}>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            <div style={s.btnRow}>
              <button type="submit" disabled={!file || uploading} style={{ ...s.btn, background: '#4f46e5', opacity: (!file || uploading) ? 0.6 : 1 }}>
                {uploading ? '⏳ Uploading & Training...' : '🚀 Upload & Retrain'}
              </button>
            </div>
          </form>
        </div>

        {/* CSV Format Guide */}
        <div style={{ ...s.card, flex: 1, minWidth: 240 }}>
          <p style={s.cardTitle}>📋 CSV Format Example</p>
          <pre style={s.pre}>{`attendance_pct,avg_grade,hw_completion_rate,risk
92,85,90,low
60,45,50,medium
30,25,20,high
78,70,80,low
50,40,35,medium`}</pre>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 10 }}>
            You can export this from your student database. All values should be percentages (0–100).
          </p>
        </div>
      </div>

      {/* Fallback retrain on synthetic */}
      <div style={s.card}>
        <p style={s.cardTitle}>🔄 Reset to Synthetic Data</p>
        <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 12 }}>
          Retrain the model on generated synthetic data. Use this to reset if real data causes issues.
        </p>
        <button onClick={handleRetrain} disabled={retraining} style={{ ...s.btn, background: '#f59e0b' }}>
          {retraining ? '⏳ Retraining...' : '🔄 Retrain on Synthetic Data'}
        </button>
      </div>
    </AppLayout>
  );
};

const s = {
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:     { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:       { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  msg:       { border: '1px solid', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem', fontWeight: 600 },
  row:       { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  card:      { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: 1, minWidth: 240, marginBottom: 16 },
  cardTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: '0 0 6px' },
  cardSub:   { fontSize: '0.78rem', color: '#6b7280', margin: '0 0 4px' },
  statGrid:  { display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' },
  statBox:   { flex: 1, minWidth: 100, background: '#f8fafc', borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  statLabel: { fontSize: '0.72rem', color: '#9ca3af' },
  warning:   { marginTop: 14, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#92400e' },
  form:      { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  fileInput: { border: '2px dashed #d1d5db', borderRadius: 8, padding: '14px', fontSize: '0.85rem', cursor: 'pointer', background: '#f9fafb' },
  fileName:  { fontSize: '0.82rem', color: '#4f46e5', fontWeight: 600, margin: 0 },
  btnRow:    { display: 'flex', gap: 10 },
  btn:       { padding: '10px 20px', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  pre:       { background: '#f1f5f9', borderRadius: 8, padding: '12px', fontSize: '0.75rem', color: '#374151', overflowX: 'auto', margin: '10px 0 0', lineHeight: 1.6 },
  code:      { background: '#e0e7ff', color: '#4338ca', padding: '1px 5px', borderRadius: 4, fontSize: '0.78rem' },
};

export default AIModelManager;
