import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import api from '../../services/api';

const HomeworkManager = () => {
  const [homework, setHomework]   = useState([]);
  const [students, setStudents]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState({ class: '', section: '', subject: '', title: '', description: '', dueDate: '' });

  useEffect(() => {
    api.get('/students')
      .then(({ data }) => {
        setStudents(data);
        if (!data.length) { setLoading(false); return; }
        // Load homework for ALL unique class-sections
        const classSections = [...new Set(data.map(s => `${s.class}-${s.section}`))];
        const first = data[0];
        setForm(f => ({ ...f, class: first.class, section: first.section }));
        Promise.all(classSections.map(cs => api.get(`/homework/${cs}`).catch(() => null)))
          .then(results => {
            const all = results.flatMap(r => r?.data || []);
            all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setHomework(all);
          })
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  // Unique class-sections from assigned students for dropdowns
  const classSections = [...new Set(students.map(s => `${s.class}-${s.section}`))].sort();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/homework', form);
      setHomework([data, ...homework]);
      setShowModal(false);
      setForm(f => ({ ...f, subject: '', title: '', description: '', dueDate: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign homework. Please try again.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this homework assignment?')) return;
    try {
      await api.delete(`/homework/${id}`);
      setHomework(prev => prev.filter(h => h._id !== id));
    } catch {
      alert('Failed to delete homework.');
    }
  };

  const exportCSV = () => {
    const rows = [['Title', 'Subject', 'Class', 'Due Date', 'Status', 'Submissions']];
    homework.forEach(hw => {
      const overdue = new Date(hw.dueDate) < new Date();
      rows.push([
        hw.title, hw.subject,
        `${hw.class}-${hw.section}`,
        new Date(hw.dueDate).toLocaleDateString('en-IN'),
        overdue ? 'Overdue' : 'Active',
        hw.submissions?.length || 0,
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'homework_list.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const isOverdue = hw => new Date(hw.dueDate) < new Date();
  const activeCount = homework.filter(h => !isOverdue(h)).length;
  const overdueCount = homework.filter(h => isOverdue(h)).length;

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Homework Manager</h2>
          <p style={styles.sub}>{activeCount} active · {overdueCount} overdue · {homework.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {homework.length > 0 && (
            <button style={styles.exportBtn} onClick={exportCSV}>Export CSV</button>
          )}
          <button style={styles.addBtn} onClick={() => { setShowModal(true); setError(''); }}>
            + Assign Homework
          </button>
        </div>
      </div>

      {loading && (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Loading homework...</span>
        </div>
      )}

      {!loading && students.length === 0 && (
        <div style={styles.empty}>
          <span style={{ fontSize: '3rem' }}>[group]</span>
          <h3>No students assigned</h3>
          <p style={{ color: '#9ca3af' }}>Ask your admin to assign students to your account.</p>
        </div>
      )}

      {!loading && students.length > 0 && homework.length === 0 && (
        <div style={styles.empty}>
          <span style={{ fontSize: '3rem' }}>[book]</span>
          <h3>No homework assigned yet</h3>
          <p style={{ color: '#9ca3af' }}>Click "+ Assign Homework" to get started</p>
        </div>
      )}

      <div style={styles.list}>
        {homework.map(hw => (
          <div key={hw._id} style={{ ...styles.hwCard, borderLeft: `4px solid ${isOverdue(hw) ? '#ef4444' : '#10b981'}` }}>
            <div style={styles.hwLeft}>
              <div style={styles.hwTopRow}>
                <span style={styles.subjectTag}>{hw.subject}</span>
                <span style={styles.classTag}>Class {hw.class}-{hw.section}</span>
              </div>
              <h3 style={styles.hwTitle}>{hw.title}</h3>
              {hw.description && <p style={styles.hwDesc}>{hw.description}</p>}
              <div style={styles.hwMeta}>
                <span>Due: <strong>{new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                {hw.teacher?.name && <span>By: {hw.teacher.name}</span>}
              </div>
            </div>
            <div style={styles.hwRight}>
              <Badge label={isOverdue(hw) ? 'Overdue' : 'Active'} type={isOverdue(hw) ? 'danger' : 'success'} />
              <div style={styles.submissionCount}>
                <span style={styles.subNum}>{hw.submissions?.length || 0}</span>
                <span style={styles.subLabel}>Submissions</span>
              </div>
              <button onClick={() => handleDelete(hw._id)} style={styles.deleteBtn}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Assign New Homework" onClose={() => setShowModal(false)} width={520}>
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.field}>
              <label style={styles.label}>Class - Section *</label>
              <select style={styles.input} value={`${form.class}-${form.section}`}
                onChange={e => {
                  const [cls, sec] = e.target.value.split('-');
                  setForm({ ...form, class: cls, section: sec });
                }} required>
                <option value="">Select class</option>
                {classSections.map(cs => (
                  <option key={cs} value={cs}>Class {cs}</option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Subject *</label>
              <input style={styles.input} placeholder="e.g. Mathematics" value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Title *</label>
              <input style={styles.input} placeholder="e.g. Chapter 5 Exercise" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description (optional)</label>
              <textarea style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                placeholder="Instructions for students..." value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Due Date *</label>
              <input style={styles.input} type="date" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button type="submit" style={styles.saveBtn} disabled={saving}>
                {saving ? 'Assigning...' : 'Assign Homework'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
};

const styles = {
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:           { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:             { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  addBtn:          { background: '#f59e0b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  exportBtn:       { background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  loadingBox:      { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '60px 0', color: '#6b7280' },
  spinner:         { width: 20, height: 20, border: '3px solid #e5e7eb', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty:           { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  list:            { display: 'flex', flexDirection: 'column', gap: 12 },
  hwCard:          { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  hwLeft:          { flex: 1 },
  hwTopRow:        { display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  subjectTag:      { background: '#e0e7ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 },
  classTag:        { background: '#f0fdf4', color: '#059669', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 },
  hwTitle:         { fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 4, marginTop: 0 },
  hwDesc:          { fontSize: '0.85rem', color: '#6b7280', marginBottom: 10 },
  hwMeta:          { display: 'flex', gap: 16, fontSize: '0.8rem', color: '#9ca3af', flexWrap: 'wrap' },
  hwRight:         { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 },
  submissionCount: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '10px 16px' },
  subNum:          { fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' },
  subLabel:        { fontSize: '0.72rem', color: '#9ca3af' },
  deleteBtn:       { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  errorBox:        { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem' },
  form:            { display: 'flex', flexDirection: 'column', gap: 14 },
  field:           { display: 'flex', flexDirection: 'column', gap: 5 },
  label:           { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  input:           { padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
  modalFooter:     { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn:       { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  saveBtn:         { padding: '9px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};

export default HomeworkManager;
