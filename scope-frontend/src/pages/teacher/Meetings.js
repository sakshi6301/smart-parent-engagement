import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState({}); // { [id]: { slot, notes } }

  useEffect(() => {
    api.get('/chat/meetings/list')
      .then(({ data }) => {
        // Sort: pending first, then by requestedSlot
        const order = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
        data.sort((a, b) => (order[a.status] - order[b.status]) || new Date(a.requestedSlot) - new Date(b.requestedSlot));
        setMeetings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getState = (id) => actionState[id] || { slot: '', notes: '' };
  const setState = (id, patch) => setActionState(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

  const updateStatus = async (id, status) => {
    const { slot, notes } = getState(id);
    const payload = { status, ...(notes && { notes }), ...(status === 'confirmed' && slot && { confirmedSlot: slot }) };
    try {
      const { data } = await api.put(`/chat/meetings/${id}`, payload);
      setMeetings(prev => prev.map(m => m._id === id ? data : m));
    } catch {
      alert('Failed to update meeting');
    }
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
        <div style={styles.empty}>
          <h3>No meeting requests yet</h3>
          <p style={{ color: '#9ca3af' }}>Parents can request meetings from their dashboard</p>
        </div>
      )}

      <div style={styles.list}>
        {meetings.map(m => {
          const s = getState(m._id);
          return (
            <div key={m._id} style={{ ...styles.card, borderLeft: m.status === 'pending' ? '4px solid #f59e0b' : '4px solid #e5e7eb' }}>
              <div style={styles.cardLeft}>
                <div style={styles.avatar}>{m.parent?.name?.[0] || 'P'}</div>
                <div>
                  <div style={styles.parentName}>{m.parent?.name || 'Parent'}</div>
                  <div style={styles.meta}>{m.parent?.email}</div>
                  <div style={styles.meta}>Student: <strong>{m.student?.name}</strong></div>
                  {m.agenda && <div style={styles.agenda}>{m.agenda}</div>}
                  {m.notes && <div style={styles.noteDisplay}>{m.notes}</div>}
                </div>
              </div>

              <div style={styles.cardRight}>
                <Badge label={m.status.charAt(0).toUpperCase() + m.status.slice(1)} type={statusBadge[m.status]} />
                <div style={styles.slot}>
                  <span style={styles.slotLabel}>Requested</span>
                  <span style={styles.slotVal}>{new Date(m.requestedSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                {m.status === 'confirmed' && m.confirmedSlot && (
                  <div style={styles.slot}>
                    <span style={styles.slotLabel}>Confirmed</span>
                    <span style={{ ...styles.slotVal, color: '#059669' }}>{new Date(m.confirmedSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                )}

                {m.status === 'pending' && (
                  <div style={styles.actionBlock}>
                    <input type="datetime-local" value={s.slot}
                      onChange={e => setState(m._id, { slot: e.target.value })}
                      style={styles.slotInput} />
                    <input type="text" placeholder="Add notes (optional)" value={s.notes}
                      onChange={e => setState(m._id, { notes: e.target.value })}
                      style={styles.notesInput} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateStatus(m._id, 'confirmed')} style={styles.confirmBtn}>Confirm</button>
                      <button onClick={() => updateStatus(m._id, 'cancelled')} style={styles.declineBtn}>Decline</button>
                    </div>
                  </div>
                )}

                {m.status === 'confirmed' && (
                  <button onClick={() => updateStatus(m._id, 'completed')} style={styles.completeBtn}>Mark Completed</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

const styles = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:       { fontSize: '1.2rem', fontWeight: 700, color: '#111827' },
  sub:         { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  loading:     { textAlign: 'center', padding: 40, color: '#9ca3af' },
  empty:       { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  list:        { display: 'flex', flexDirection: 'column', gap: 12 },
  card:        { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  cardLeft:    { display: 'flex', gap: 14, flex: 1 },
  avatar:      { width: 44, height: 44, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 },
  parentName:  { fontWeight: 700, fontSize: '0.95rem', color: '#111827' },
  meta:        { fontSize: '0.82rem', color: '#6b7280', marginTop: 2 },
  agenda:      { fontSize: '0.82rem', color: '#374151', marginTop: 6, background: '#f8fafc', padding: '6px 10px', borderRadius: 6 },
  noteDisplay: { fontSize: '0.82rem', color: '#4f46e5', marginTop: 4, background: '#f5f3ff', padding: '5px 10px', borderRadius: 6 },
  cardRight:   { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 },
  slot:        { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  slotLabel:   { fontSize: '0.72rem', color: '#9ca3af' },
  slotVal:     { fontSize: '0.88rem', fontWeight: 600, color: '#374151' },
  actionBlock: { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' },
  slotInput:   { padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: '0.8rem', outline: 'none' },
  notesInput:  { padding: '6px 10px', border: '1.5px solid #e5e7eb', borderRadius: 6, fontSize: '0.8rem', outline: 'none', width: 220 },
  confirmBtn:  { background: '#10b981', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 6, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  declineBtn:  { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '7px 14px', borderRadius: 6, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  completeBtn: { background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '7px 14px', borderRadius: 6, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
};

export default Meetings;
