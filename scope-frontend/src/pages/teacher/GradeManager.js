import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import api from '../../services/api';

const EXAM_TYPES = ['unit_test', 'midterm', 'final', 'assignment'];
const EMPTY = { student: '', subject: '', examType: 'unit_test', marksObtained: '', totalMarks: '', examDate: '' };

const GradeManager = () => {
  const [students, setStudents]         = useState([]);
  const [grades, setGrades]             = useState([]);
  const [selectedId, setSelectedId]     = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState('');
  const [search, setSearch]             = useState('');

  useEffect(() => { api.get('/students').then(({ data }) => setStudents(data)); }, []);

  const loadGrades = async (id) => {
    setSelectedId(id);
    if (!id) { setGrades([]); return; }
    const { data } = await api.get(`/grades/${id}`);
    setGrades(data.grades || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await api.post('/grades', form);
      setMsg('OK:Grade added successfully!');
      if (form.student) loadGrades(form.student);
      setShowModal(false);
      setForm(EMPTY);
    } catch (err) {
      setMsg('ERR:' + (err.response?.data?.message || 'Failed to add grade'));
    }
    setSaving(false);
  };

  const pct = (g) => +((g.marksObtained / g.totalMarks) * 100).toFixed(1);
  const grade = (p) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'F';
  const gradeColor = (p) => p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444';

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = students.find(s => s._id === selectedId);

  const subjectAvg = {};
  grades.forEach(g => {
    if (!subjectAvg[g.subject]) subjectAvg[g.subject] = [];
    subjectAvg[g.subject].push(pct(g));
  });

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Grade Manager</h2>
          <p style={S.sub}>Add and view student grades</p>
        </div>
        <button style={S.addBtn} onClick={() => { setShowModal(true); setMsg(''); setForm({ ...EMPTY, student: selectedId || '' }); }}>+ Add Grade</button>
      </div>

      {msg && (
        <div style={{ ...S.banner, background: msg.startsWith('OK:') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('OK:') ? '#15803d' : '#b91c1c', borderColor: msg.startsWith('OK:') ? '#bbf7d0' : '#fecaca' }}>
          {msg.slice(4)}
        </div>
      )}

      <div style={S.layout}>
        {/* Student List */}
        <div style={S.studentPanel}>
          <input style={S.search} placeholder="🔍 Search students..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={S.studentList}>
            {filtered.map(s => (
              <div key={s._id} onClick={() => loadGrades(s._id)}
                style={{ ...S.studentItem, background: selectedId === s._id ? '#e0e7ff' : '#fff', borderColor: selectedId === s._id ? '#4f46e5' : '#e5e7eb' }}>
                <div style={{ ...S.sAvatar, background: selectedId === s._id ? '#4f46e5' : '#e0e7ff', color: selectedId === s._id ? '#fff' : '#4f46e5' }}>{s.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{s.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Roll: {s.rollNumber} · {s.class}-{s.section}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grades Panel */}
        <div style={S.gradesPanel}>
          {!selectedId ? (
            <div style={S.empty}><span style={{ fontSize: '3rem' }}>📝</span><p>Select a student to view grades</p></div>
          ) : (
            <>
              <div style={S.gradeHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{selectedStudent?.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>Class {selectedStudent?.class}-{selectedStudent?.section} · {grades.length} records</p>
                </div>
              </div>

              {/* Subject Summary */}
              {Object.keys(subjectAvg).length > 0 && (
                <div style={S.subjectRow}>
                  {Object.entries(subjectAvg).map(([sub, scores]) => {
                    const avg = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                    return (
                      <div key={sub} style={{ ...S.subjectCard, borderTop: `3px solid ${gradeColor(avg)}` }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151' }}>{sub}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: gradeColor(avg) }}>{avg}%</div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Avg · {grade(avg)}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {grades.length === 0 ? (
                <div style={S.empty}><p style={{ color: '#9ca3af' }}>No grades recorded yet.</p></div>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr style={S.thead}>
                      {['Subject', 'Exam Type', 'Marks', 'Percentage', 'Grade', 'Date'].map(h => <th key={h} style={S.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g, i) => {
                      const p = pct(g);
                      return (
                        <tr key={g._id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                          <td style={S.td}><span style={S.subTag}>{g.subject}</span></td>
                          <td style={S.td}><Badge label={g.examType.replace('_', ' ')} type="info" /></td>
                          <td style={S.td}><strong>{g.marksObtained}</strong>/{g.totalMarks}</td>
                          <td style={S.td}><span style={{ color: gradeColor(p), fontWeight: 700 }}>{p}%</span></td>
                          <td style={S.td}><span style={{ ...S.gradePill, background: gradeColor(p) + '20', color: gradeColor(p) }}>{grade(p)}</span></td>
                          <td style={S.td}>{new Date(g.examDate).toLocaleDateString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title="Add Grade" onClose={() => setShowModal(false)} width={480}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={S.field}>
              <label style={S.label}>Student *</label>
              <select style={S.input} value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} required>
                <option value="">Select Student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
              </select>
            </div>
            <div style={S.grid2}>
              <div style={S.field}>
                <label style={S.label}>Subject *</label>
                <input style={S.input} placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div style={S.field}>
                <label style={S.label}>Exam Type *</label>
                <select style={S.input} value={form.examType} onChange={e => setForm({ ...form, examType: e.target.value })}>
                  {EXAM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Marks Obtained *</label>
                <input style={S.input} type="number" min="0" placeholder="e.g. 85" value={form.marksObtained} onChange={e => setForm({ ...form, marksObtained: e.target.value })} required />
              </div>
              <div style={S.field}>
                <label style={S.label}>Total Marks *</label>
                <input style={S.input} type="number" min="1" placeholder="e.g. 100" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} required />
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Exam Date *</label>
              <input style={S.input} type="date" value={form.examDate} onChange={e => setForm({ ...form, examDate: e.target.value })} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowModal(false)} style={S.cancelBtn}>Cancel</button>
              <button type="submit" style={S.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Add Grade'}</button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
};

const S = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:       { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:         { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  addBtn:      { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  banner:      { border: '1px solid', borderRadius: 8, padding: '10px 16px', marginBottom: 14, fontSize: '0.88rem', fontWeight: 600 },
  layout:      { display: 'flex', gap: 16, alignItems: 'flex-start' },
  studentPanel:{ width: 240, flexShrink: 0, background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  search:      { width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  studentList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' },
  studentItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer' },
  sAvatar:     { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 },
  gradesPanel: { flex: 1, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minHeight: 400 },
  gradeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  subjectRow:  { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  subjectCard: { background: '#f8fafc', borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100 },
  empty:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#9ca3af', gap: 8 },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { background: '#f8fafc' },
  th:          { padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' },
  td:          { padding: '11px 12px', fontSize: '0.85rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  subTag:      { background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700 },
  gradePill:   { padding: '2px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800 },
  field:       { display: 'flex', flexDirection: 'column', gap: 5 },
  label:       { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  input:       { padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  cancelBtn:   { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  saveBtn:     { padding: '9px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};

export default GradeManager;
