import React, { useState, useRef } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

const ACCEPTED = '.csv,.xlsx,.xls';

const BulkImport = () => {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const inputRef                = useRef();

  const handleFile = (f) => {
    setResult(null);
    setError('');
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Only .csv or .xlsx files are supported.');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/bulk-import/students', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplate = async () => {
    try {
      const { data } = await api.get('/bulk-import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_import_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not download template.');
    }
  };

  const successRate = result
    ? Math.round((result.inserted / (result.total || 1)) * 100)
    : 0;

  return (
    <AppLayout>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>📥 Bulk Import Data</h2>
            <p style={s.subtitle}>Upload a CSV or Excel file to import students, parents, and teachers at once.</p>
          </div>
          <button onClick={handleTemplate} style={s.templateBtn}>
            ⬇️ Download Template
          </button>
        </div>

        {/* Instructions */}
        <div style={s.infoBox}>
          <strong>Required columns:</strong> StudentID, StudentName, Class, ParentName, ParentPhone
          &nbsp;|&nbsp;
          <strong>Optional:</strong> Section, Gender, DateOfBirth, AcademicYear, ParentEmail, TeacherName, FatherName, MotherName
        </div>

        {/* Drop Zone */}
        <div
          style={{ ...s.dropZone, ...(dragging ? s.dropZoneActive : {}), ...(file ? s.dropZoneReady : {}) }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <>
              <span style={s.fileIcon}>📄</span>
              <p style={s.fileName}>{file.name}</p>
              <p style={s.fileSize}>{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </>
          ) : (
            <>
              <span style={s.fileIcon}>☁️</span>
              <p style={s.dropText}>Drag & drop your file here, or <span style={s.browse}>browse</span></p>
              <p style={s.dropSub}>Supports .csv and .xlsx — max 5 MB</p>
            </>
          )}
        </div>

        {error && <div style={s.errorBanner}>⚠️ {error}</div>}

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          style={{ ...s.uploadBtn, opacity: (!file || loading) ? 0.5 : 1 }}
        >
          {loading ? '⏳ Processing...' : '🚀 Upload & Import'}
        </button>

        {/* Results */}
        {result && (
          <div style={s.resultCard}>
            <h3 style={s.resultTitle}>Import Complete</h3>

            {/* Summary Stats */}
            <div style={s.statsRow}>
              <div style={{ ...s.statBox, borderColor: '#6366f1' }}>
                <span style={s.statNum}>{result.total}</span>
                <span style={s.statLabel}>Total Rows</span>
              </div>
              <div style={{ ...s.statBox, borderColor: '#10b981' }}>
                <span style={{ ...s.statNum, color: '#10b981' }}>{result.inserted}</span>
                <span style={s.statLabel}>✅ Inserted</span>
              </div>
              <div style={{ ...s.statBox, borderColor: '#f59e0b' }}>
                <span style={{ ...s.statNum, color: '#f59e0b' }}>{result.skipped}</span>
                <span style={s.statLabel}>⚠️ Skipped</span>
              </div>
              <div style={{ ...s.statBox, borderColor: '#e5e7eb' }}>
                <span style={{ ...s.statNum, color: '#6366f1' }}>{successRate}%</span>
                <span style={s.statLabel}>Success Rate</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={s.progressTrack}>
              <div style={{ ...s.progressFill, width: `${successRate}%`, background: successRate === 100 ? '#10b981' : successRate > 50 ? '#f59e0b' : '#ef4444' }} />
            </div>

            {/* Error Report */}
            {result.errors?.length > 0 && (
              <div style={s.errorReport}>
                <div style={s.errorReportHeader}>
                  ❌ {result.errors.length} issue{result.errors.length > 1 ? 's' : ''} found
                  <button
                    style={s.downloadErrBtn}
                    onClick={() => {
                      const blob = new Blob([result.errors.join('\n')], { type: 'text/plain' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = 'import_errors.txt';
                      a.click();
                    }}
                  >
                    ⬇️ Download Error Report
                  </button>
                </div>
                <ul style={s.errorList}>
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i} style={s.errorItem}>• {e}</li>
                  ))}
                  {result.errors.length > 20 && (
                    <li style={{ ...s.errorItem, color: '#9ca3af' }}>
                      ...and {result.errors.length - 20} more. Download the full report above.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const s = {
  page:            { maxWidth: 780, margin: '0 auto' },
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title:           { fontSize: '1.4rem', fontWeight: 700, color: '#111827', margin: 0 },
  subtitle:        { fontSize: '0.85rem', color: '#6b7280', marginTop: 4 },
  templateBtn:     { background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', padding: '9px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  infoBox:         { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#1e40af', marginBottom: 20 },
  dropZone:        { border: '2px dashed #d1d5db', borderRadius: 12, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all 0.2s', marginBottom: 16 },
  dropZoneActive:  { borderColor: '#6366f1', background: '#eef2ff' },
  dropZoneReady:   { borderColor: '#10b981', background: '#f0fdf4' },
  fileIcon:        { fontSize: '2.5rem' },
  fileName:        { fontWeight: 600, color: '#111827', margin: '8px 0 2px' },
  fileSize:        { fontSize: '0.8rem', color: '#9ca3af' },
  dropText:        { color: '#374151', fontWeight: 500, margin: '8px 0 4px' },
  dropSub:         { fontSize: '0.8rem', color: '#9ca3af' },
  browse:          { color: '#6366f1', textDecoration: 'underline' },
  errorBanner:     { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginBottom: 12 },
  uploadBtn:       { width: '100%', padding: '13px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginBottom: 24 },
  resultCard:      { background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  resultTitle:     { fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: 16 },
  statsRow:        { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  statBox:         { flex: 1, minWidth: 100, border: '2px solid', borderRadius: 10, padding: '14px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 },
  statNum:         { fontSize: '1.6rem', fontWeight: 800, color: '#111827' },
  statLabel:       { fontSize: '0.75rem', color: '#6b7280' },
  progressTrack:   { height: 8, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden', marginBottom: 20 },
  progressFill:    { height: '100%', borderRadius: 99, transition: 'width 0.5s ease' },
  errorReport:     { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 16px' },
  errorReportHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: '#b91c1c', fontSize: '0.88rem', marginBottom: 10 },
  downloadErrBtn:  { background: '#fff', border: '1px solid #fca5a5', color: '#b91c1c', padding: '5px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer' },
  errorList:       { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 },
  errorItem:       { fontSize: '0.82rem', color: '#7f1d1d', fontFamily: 'monospace' },
};

export default BulkImport;
