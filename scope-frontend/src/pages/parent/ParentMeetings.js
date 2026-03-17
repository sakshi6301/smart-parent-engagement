import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ParentMeetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [student, setStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ requestedSlot: '', agenda: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/students').then(({ data }) => { if (data.length > 0) setStudent(data[0]); });
    api.get('/chat/meetings/list').then(({ data }) => setMeetings(data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student) return;
    setSaving(true);
    const { data } = await api.post('/chat/meetings', { ...form, student: student._id, teacher: student.teacher });
    setMeetings([data, ...meetings]);
    setShowModal(false);
    setForm({ requestedSlot: '', agenda: '' });
    setSaving(false);
  };

  const statusConfig = { pending: { color: '#f59e0b', bg: '#fffbeb' }, confirmed: { color: '#10b981', bg: '#f0fdf4' }, cancelled: { color: '#ef4444', bg: '#fef2f2' }, completed: { color: '#6b7280', bg: '#f3f4f6' } };

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Meeting Requests</h2>
          <p style={styles.sub}>Schedule meetings with {student?.name}'s teacher</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>+ Request Meeting</button>
      </div>

      {meetings.length === 0 && (
        <div style={styles.empty}><span style={{ fontSize: '3rem' }}>📅</span><h3>No meetings yet</h3><p style={{ color: '#9ca3af' }}>Request a meeting with your child's teacher</p></div>
      )}

      <div style={styles.list}>
        {meetings.map(m => {
          const cfg = statusConfig[m.status] || statusConfig.pending;
          return (
            <div key={m._id} style={{ ...styles.card, borderLeft: `4px solid ${cfg.color}` }}>
              <div style={styles.cardTop}>
                <div style={{ ...styles.statusDot, background: cfg.bg, color: cfg.color }}>
                  {m.status === 'pending' ? '⏳' : m.status === 'confirmed' ? '✅' : m.status === 'cancelled' ? '❌' : '✔️'}
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </div>
                <span style={styles.date}>{new Date(m.requestedSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              {m.agenda && <p style={styles.agenda}>📋 {m.agenda}</p>}
              {m.status === 'confirmed' && m.confirmedSlot && (
                <p style={styles.confirmed}>✅ Confirmed for: {new Date(m.confirmedSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              )}
              {m.notes && <p style={styles.notes}>📝 Notes: {m.notes}</p>}
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Request a Meeting" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Preferred Date & Time</label>
              <input style={styles.input} type="datetime-local" value={form.requestedSlot} onChange={e => setForm({ ...form, requestedSlot: e.target.value })} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Agenda / Reason</label>
              <textarea style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} placeholder="What would you like to discuss?" value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} />
            </div>
            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button type="submit" style={styles.saveBtn} disabled={saving}>{saving ? 'Sending...' : 'Send Request'}</button>
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
  addBtn: { background: '#059669', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem' },
  empty: { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusDot: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600 },
  date: { fontSize: '0.85rem', color: '#374151', fontWeight: 600 },
  agenda: { fontSize: '0.88rem', color: '#374151', background: '#f8fafc', padding: '8px 12px', borderRadius: 6 },
  confirmed: { fontSize: '0.85rem', color: '#059669', fontWeight: 500 },
  notes: { fontSize: '0.82rem', color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem' },
  saveBtn: { padding: '9px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem' },
};

export default ParentMeetings;
