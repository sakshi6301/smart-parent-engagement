import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import api from '../../services/api';

const HomeworkManager = () => {
  const [homework, setHomework] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ class: '', section: '', subject: '', title: '', description: '', dueDate: '' });

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      setStudents(data);
      if (data.length > 0) {
        const s = data[0];
        setForm(f => ({ ...f, class: s.class, section: s.section }));
        api.get(`/homework/${s.class}-${s.section}`).then(r => setHomework(r.data));
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data } = await api.post('/homework', form);
    setHomework([data, ...homework]);
    setShowModal(false);
    setForm({ class: '', section: '', subject: '', title: '', description: '', dueDate: '' });
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this homework?')) return;
    await api.delete(`/homework/${id}`);
    setHomework(prev => prev.filter(h => h._id !== id));
  };

  const isOverdue = hw => new Date(hw.dueDate) < new Date();

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Homework Manager</h2>
          <p style={styles.sub}>Assign and track homework for your class</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Assign Homework</button>
      </div>

      <div style={styles.list}>
        {homework.length === 0 && (
          <div style={styles.empty}>
            <span style={{ fontSize: '3rem' }}>📚</span>
            <h3>No homework assigned yet</h3>
            <p style={{ color: '#9ca3af' }}>Click "+ Assign Homework" to get started</p>
          </div>
        )}
        {homework.map(hw => (
          <div key={hw._id} style={styles.hwCard}>
            <div style={styles.hwLeft}>
              <div style={styles.subjectTag}>{hw.subject}</div>
              <h3 style={styles.hwTitle}>{hw.title}</h3>
              {hw.description && <p style={styles.hwDesc}>{hw.description}</p>}
              <div style={styles.hwMeta}>
                <span>📅 Due: <strong>{new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                <span>🏫 Class {hw.class}-{hw.section}</span>
                <span>👨🏫 {hw.teacher?.name}</span>
              </div>
            </div>
            <div style={styles.hwRight}>
              <Badge label={isOverdue(hw) ? 'Overdue' : 'Active'} type={isOverdue(hw) ? 'danger' : 'success'} />
              <div style={styles.submissionCount}>
                <span style={styles.subNum}>{hw.submissions?.length || 0}</span>
                <span style={styles.subLabel}>Submissions</span>
              </div>
              <button onClick={() => handleDelete(hw._id)} style={styles.deleteBtn}>🗑 Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Assign New Homework" onClose={() => setShowModal(false)} width={520}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.label}>Class</label>
                <input style={styles.input} placeholder="e.g. 10" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Section</label>
                <input style={styles.input} placeholder="e.g. A" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} required />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Subject</label>
              <input style={styles.input} placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Title</label>
              <input style={styles.input} placeholder="Homework title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description (optional)</label>
              <textarea style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} placeholder="Instructions..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Due Date</label>
              <input style={styles.input} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button type="submit" style={styles.saveBtn} disabled={saving}>{saving ? 'Assigning...' : 'Assign Homework'}</button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub: { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  addBtn: { background: '#f59e0b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  hwCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  hwLeft: { flex: 1 },
  subjectTag: { display: 'inline-block', background: '#e0e7ff', color: '#4f46e5', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 },
  hwTitle: { fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 4 },
  hwDesc: { fontSize: '0.85rem', color: '#6b7280', marginBottom: 10 },
  hwMeta: { display: 'flex', gap: 16, fontSize: '0.8rem', color: '#9ca3af', flexWrap: 'wrap' },
  hwRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 },
  submissionCount: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '10px 16px' },
  subNum: { fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' },
  subLabel: { fontSize: '0.72rem', color: '#9ca3af' },
  deleteBtn: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  row2: { display: 'flex', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5, flex: 1 },
  label: { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem' },
  saveBtn: { padding: '9px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem' },
};

export default HomeworkManager;
