import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmSlot, setConfirmSlot] = useState({}); // { [id]: datetime string }

  useEffect(() => {
    api.get('/chat/meetings/list').then(({ data }) => { setMeetings(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const payload = { status };
    if (status === 'confirmed' && confirmSlot[id]) payload.confirmedSlot = confirmSlot[id];
    const { data } = await api.put(`/chat/meetings/${id}`, payload);
    setMeetings(meetings.map(m => m._id === id ? data : m));
  };

  const statusBadge = { pending: 'warning', confirmed: 'success', cancelled: 'danger', completed: 'info' };

  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Meeting Requests</h2>
          <p style={styles.sub}>{meetings.filter(m => m.status === 'pending').length} pending requests</p>
        </div>
      </div>

      {loading && <div style={styles.loading}>Loading meetings...</div>}

      {!loading && meetings.length === 0 && (
        <div style={styles.empty}><span style={{ fontSize: '3rem' }}>📅</span><h3>No meeting requests yet</h3><p style={{ color: '#9ca3af' }}>Parents can request meetings from their dashboard</p></div>
      )}

      <div style={styles.list}>
        {meetings.map(m => (
          <div key={m._id} style={styles.card}>
            <div style={styles.cardLeft}>
              <div style={styles.avatar}>{m.parent?.name?.[0] || 'P'}</div>
              <div>
                <div style={styles.parentName}>{m.parent?.name || 'Parent'}</div>
                <div style={styles.meta}>{m.parent?.email}</div>
                <div style={styles.meta}>Student: <strong>{m.student?.name}</strong></div>
                {m.agenda && <div style={styles.agenda}>📋 {m.agenda}</div>}
              </div>
            </div>
            <div style={styles.cardRight}>
              <Badge label={m.status.charAt(0).toUpperCase() + m.status.slice(1)} type={statusBadge[m.status]} />
              <div style={styles.slot}>
                <span style={styles.slotLabel}>Requested Slot</span>
                <span style={styles.slotVal}>{new Date(m.requestedSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              {m.status === 'pending' && (
                <div style={styles.actions}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <input
                      type="datetime-local"
                      value={confirmSlot[m._id] || ''}
                      onChange={e => setConfirmSlot(prev => ({ ...prev, [m._id]: e.target.value }))}
                      style={styles.slotInput}
                      placeholder="Set confirmed slot"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateStatus(m._id, 'confirmed')} style={styles.confirmBtn}>✅ Confirm</button>
                      <button onClick={() => updateStatus(m._id, 'cancelled')} style={styles.cancelBtn}>✕ Decline</button>
                    </div>
                  </div>
                </div>
              )}
              {m.status === 'confirmed' && (
                <button onClick={() => updateStatus(m._id, 'completed')} style={styles.completeBtn}>Mark Completed</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub: { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  loading: { textAlign: 'center', padding: '40px', color: '#9ca3af' },
  empty: { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  cardLeft: { display: 'flex', gap: 14, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 },
  parentName: { fontWeight: 700, fontSize: '0.95rem', color: '#111827' },
  meta: { fontSize: '0.82rem', color: '#6b7280', marginTop: 2 },
  agenda: { fontSize: '0.82rem', color: '#374151', marginTop: 6, background: '#f8fafc', padding: '6px 10px', borderRadius: 6 },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 },
  slot: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  slotLabel: { fontSize: '0.72rem', color: '#9ca3af' },
  slotVal: { fontSize: '0.88rem', fontWeight: 600, color: '#374151' },
  actions: { display: 'flex', gap: 8 },
  slotInput: { padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: '0.8rem', outline: 'none' },
  confirmBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 6, fontWeight: 600, fontSize: '0.82rem' },
  cancelBtn: { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '7px 14px', borderRadius: 6, fontWeight: 600, fontSize: '0.82rem' },
  completeBtn: { background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '7px 14px', borderRadius: 6, fontWeight: 600, fontSize: '0.82rem' },
};

export default Meetings;
