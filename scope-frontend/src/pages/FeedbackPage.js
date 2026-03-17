import React, { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emotions = [
  { key: 'happy', icon: '😊', label: 'Happy' },
  { key: 'neutral', icon: '😐', label: 'Neutral' },
  { key: 'sad', icon: '😢', label: 'Sad' },
  { key: 'stressed', icon: '😰', label: 'Stressed' },
  { key: 'confused', icon: '😕', label: 'Confused' },
];

const categories = [
  { key: 'academic_stress', label: 'Academic Stress', icon: '📚' },
  { key: 'learning_difficulty', label: 'Learning Difficulty', icon: '🧠' },
  { key: 'school_issue', label: 'School Issue', icon: '🏫' },
  { key: 'general', label: 'General Feedback', icon: '💬' },
];

const FeedbackPage = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'general', message: '', emotion: 'neutral' });
  const [responses, setResponses] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.get('/feedback').then(({ data }) => setFeedbacks(data)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data } = await api.post('/feedback', form);
    setFeedbacks([data, ...feedbacks]);
    setShowModal(false);
    setForm({ category: 'general', message: '', emotion: 'neutral' });
    setSaving(false);
  };

  const handleRespond = async (id) => {
    const { data } = await api.put(`/feedback/${id}/respond`, { response: responses[id] });
    setFeedbacks(feedbacks.map(f => f._id === id ? data : f));
    setResponses({ ...responses, [id]: '' });
  };

  const statusConfig = { open: { type: 'warning', label: 'Open' }, in_review: { type: 'info', label: 'In Review' }, resolved: { type: 'success', label: 'Resolved' } };
  const canSubmit = ['parent', 'student'].includes(user?.role);
  const canRespond = ['teacher', 'admin'].includes(user?.role);

  const filtered = filter === 'all' ? feedbacks : feedbacks.filter(f => f.status === filter);

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Feedback & Concerns</h2>
          <p style={styles.sub}>{feedbacks.filter(f => f.status === 'open').length} open concerns</p>
        </div>
        {canSubmit && <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Submit Feedback</button>}
      </div>

      <div style={styles.filters}>
        {['all', 'open', 'in_review', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ ...styles.filterBtn, background: filter === f ? '#4f46e5' : '#fff', color: filter === f ? '#fff' : '#374151' }}>
            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            {f !== 'all' && ` (${feedbacks.filter(fb => fb.status === f).length})`}
          </button>
        ))}
      </div>

      <div style={styles.list}>
        {filtered.length === 0 && <div style={styles.empty}><span style={{ fontSize: '2.5rem' }}>💬</span><p>No feedback found</p></div>}
        {filtered.map(f => {
          const cat = categories.find(c => c.key === f.category);
          const emo = emotions.find(e => e.key === f.emotion);
          const sc = statusConfig[f.status] || statusConfig.open;
          return (
            <div key={f._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardLeft}>
                  <span style={styles.catIcon}>{cat?.icon || '💬'}</span>
                  <div>
                    <div style={styles.catLabel}>{cat?.label || f.category}</div>
                    <div style={styles.submittedBy}>by {f.submittedBy?.name || 'User'} · {new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <div style={styles.cardRight2}>
                  <span style={styles.emotion}>{emo?.icon} {emo?.label}</span>
                  <Badge label={sc.label} type={sc.type} />
                </div>
              </div>

              <p style={styles.message}>{f.message}</p>

              {f.response && (
                <div style={styles.responseBox}>
                  <span style={styles.responseLabel}>💬 Teacher Response:</span>
                  <p style={styles.responseText}>{f.response}</p>
                </div>
              )}

              {canRespond && f.status !== 'resolved' && (
                <div style={styles.respondRow}>
                  <input style={styles.respondInput} placeholder="Write your response..." value={responses[f._id] || ''}
                    onChange={e => setResponses({ ...responses, [f._id]: e.target.value })} />
                  <button style={styles.respondBtn} onClick={() => handleRespond(f._id)} disabled={!responses[f._id]}>
                    Send Response
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Submit Feedback" onClose={() => setShowModal(false)} width={520}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Category</label>
              <div style={styles.catGrid}>
                {categories.map(c => (
                  <button key={c.key} type="button" onClick={() => setForm({ ...form, category: c.key })}
                    style={{ ...styles.catBtn, background: form.category === c.key ? '#e0e7ff' : '#f8fafc', border: `2px solid ${form.category === c.key ? '#4f46e5' : '#e5e7eb'}`, color: form.category === c.key ? '#4f46e5' : '#374151' }}>
                    <span style={{ fontSize: '1.3rem' }}>{c.icon}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>How are you feeling?</label>
              <div style={styles.emoRow}>
                {emotions.map(e => (
                  <button key={e.key} type="button" onClick={() => setForm({ ...form, emotion: e.key })}
                    style={{ ...styles.emoBtn, background: form.emotion === e.key ? '#e0e7ff' : '#f8fafc', border: `2px solid ${form.emotion === e.key ? '#4f46e5' : '#e5e7eb'}` }}>
                    <span style={{ fontSize: '1.5rem' }}>{e.icon}</span>
                    <span style={{ fontSize: '0.72rem' }}>{e.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Your Message</label>
              <textarea style={{ ...styles.input, minHeight: 100, resize: 'vertical' }} placeholder="Describe your concern in detail..."
                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button type="submit" style={styles.saveBtn} disabled={saving}>{saving ? 'Submitting...' : 'Submit Feedback'}</button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub: { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  addBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' },
  filters: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn: { padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { background: '#fff', borderRadius: 12, padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#9ca3af' },
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 12 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 },
  cardLeft: { display: 'flex', gap: 12, alignItems: 'center' },
  catIcon: { fontSize: '1.6rem' },
  catLabel: { fontWeight: 700, fontSize: '0.95rem', color: '#111827' },
  submittedBy: { fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 },
  cardRight2: { display: 'flex', gap: 10, alignItems: 'center' },
  emotion: { fontSize: '0.82rem', color: '#6b7280' },
  message: { fontSize: '0.9rem', color: '#374151', lineHeight: 1.6, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 },
  responseBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px' },
  responseLabel: { fontSize: '0.78rem', fontWeight: 700, color: '#059669' },
  responseText: { fontSize: '0.88rem', color: '#374151', marginTop: 4 },
  respondRow: { display: 'flex', gap: 10 },
  respondInput: { flex: 1, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none' },
  respondBtn: { background: '#4f46e5', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  catGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  catBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 8 },
  emoRow: { display: 'flex', gap: 8 },
  emoBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px', borderRadius: 8 },
  input: { padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem' },
  saveBtn: { padding: '9px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem' },
};

export default FeedbackPage;
