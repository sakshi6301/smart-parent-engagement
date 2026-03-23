import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import api from '../../services/api';

const ManageTeachers = () => {
  const [teachers, setTeachers]           = useState([]);
  const [students, setStudents]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [saving, setSaving]               = useState(false);
  const [bulkSaving, setBulkSaving]       = useState(false);
  const [sending, setSending]             = useState({});
  const [msg, setMsg]                     = useState('');
  const [bulkMsg, setBulkMsg]             = useState('');
  const [form, setForm]                   = useState({ name: '', email: '', password: 'Welcome@123', phone: '' });
  const [editForm, setEditForm]           = useState({ name: '', email: '', phone: '', password: '' });
  const [bulkForm, setBulkForm]           = useState({ teacherId: '', class: '', section: '' });

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/students/users/teacher'),
      api.get('/students'),
    ]).then(([{ data: t }, { data: s }]) => {
      setTeachers(t);
      setStudents(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getAssignedStudents = (teacherId) =>
    students.filter(s => s.teacher?._id === teacherId || s.teacher === teacherId);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.post('/auth/admin/create-user', { ...form, role: 'teacher' });
      setMsg('OK: Teacher account created and credentials emailed!');
      setShowAddModal(false);
      setForm({ name: '', email: '', password: 'Welcome@123', phone: '' });
      fetchAll();
    } catch (err) {
      setMsg('ERR: ' + (err.response?.data?.message || 'Error creating teacher'));
    }
    setSaving(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/auth/admin/users/${selectedTeacher._id}`, editForm);
      setTeachers(prev => prev.map(t => t._id === selectedTeacher._id ? { ...t, ...editForm } : t));
      setMsg('OK: Teacher updated successfully!');
      setShowEditModal(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('ERR: ' + (err.response?.data?.message || 'Update failed'));
    }
    setSaving(false);
  };

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    setBulkSaving(true);
    setBulkMsg('');
    try {
      const { data } = await api.post('/students/bulk-assign-teacher', bulkForm);
      setBulkMsg('OK: ' + data.message);
      fetchAll();
    } catch (err) {
      setBulkMsg('ERR: ' + (err.response?.data?.message || 'Failed'));
    }
    setBulkSaving(false);
  };

  const handleToggleActive = async (teacher) => {
    try {
      await api.put(`/auth/admin/toggle-active/${teacher._id}`);
      setTeachers(prev => prev.map(t => t._id === teacher._id ? { ...t, isActive: !t.isActive } : t));
      setMsg(`OK: ${teacher.name} ${teacher.isActive ? 'deactivated' : 'activated'}.`);
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('ERR: Failed to update status.');
    }
  };

  const handleSendCredentials = async (teacher) => {
    setSending(prev => ({ ...prev, [teacher._id]: true }));
    try {
      const { data } = await api.post(`/auth/admin/send-credentials/${teacher._id}`);
      setMsg('OK: ' + data.message);
    } catch (err) {
      setMsg('ERR: ' + (err.response?.data?.message || 'Failed to send email'));
    }
    setSending(prev => ({ ...prev, [teacher._id]: false }));
    setTimeout(() => setMsg(''), 4000);
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setEditForm({ name: teacher.name, email: teacher.email, phone: teacher.phone || '', password: '' });
    setShowEditModal(true);
  };

  const openStudentsModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowStudentsModal(true);
  };

  const exportTeachersCSV = () => {
    const rows = [['Name', 'Email', 'Phone', 'Status', 'Classes', 'Students', 'Joined']];
    filtered.forEach(t => {
      const assigned = getAssignedStudents(t._id);
      const classSections = [...new Set(assigned.map(s => `${s.class}-${s.section}`))].sort().join(' | ');
      rows.push([t.name, t.email, t.phone || '', t.isActive ? 'Active' : 'Inactive', classSections || 'None', assigned.length, new Date(t.createdAt).toLocaleDateString('en-IN')]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportStudentsCSV = () => {
    const rows = [['Name', 'Roll Number', 'Class', 'Section', 'Parent', 'Parent Email']];
    assignedStudents.forEach(st => {
      rows.push([st.name, st.rollNumber, st.class, st.section, st.parent?.name || 'N/A', st.parent?.email || 'N/A']);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${selectedTeacher.name.replace(/\s+/g, '_')}_students.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.phone || '').includes(search)
  );

  const classes  = [...new Set(students.map(s => s.class))].sort((a, b) => a - b);
  const sections = [...new Set(students.map(s => s.section))].sort();

  const activeCount     = teachers.filter(t => t.isActive).length;
  const inactiveCount   = teachers.length - activeCount;
  const unassignedCount = teachers.filter(t => getAssignedStudents(t._id).length === 0).length;

  const columns = [
    {
      key: 'name', label: 'Teacher',
      render: r => (
        <div style={s.nameCell}>
          <div style={s.avatar}>{r.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, color: '#111827' }}>{r.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{r.email}</div>
            {r.phone && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{r.phone}</div>}
          </div>
        </div>
      )
    },
    {
      key: 'classes', label: 'Classes',
      render: r => {
        const assigned = getAssignedStudents(r._id);
        const classSections = [...new Set(assigned.map(st => `${st.class}-${st.section}`))].sort();
        return classSections.length > 0
          ? <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {classSections.map(cs => <span key={cs} style={s.classChip}>{cs}</span>)}
            </div>
          : <span style={{ color: '#d1d5db', fontSize: '0.78rem' }}>— None</span>;
      }
    },
    {
      key: 'assigned', label: 'Students',
      render: r => {
        const count = getAssignedStudents(r._id).length;
        return count > 0
          ? <button onClick={() => openStudentsModal(r)} style={s.viewBtn}>
              {count} student{count !== 1 ? 's' : ''} →
            </button>
          : <span style={s.noAssign}>— None assigned</span>;
      }
    },
    { key: 'isActive', label: 'Status', render: r => <Badge label={r.isActive ? 'Active' : 'Inactive'} type={r.isActive ? 'success' : 'danger'} /> },
    { key: 'createdAt', label: 'Joined', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button onClick={() => openEditModal(r)} style={s.editBtn}>Edit</button>
          <button
            onClick={() => handleToggleActive(r)}
            style={{ ...s.toggleBtn, background: r.isActive ? '#fef2f2' : '#f0fdf4', color: r.isActive ? '#b91c1c' : '#15803d', border: r.isActive ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
            {r.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => handleSendCredentials(r)}
            disabled={sending[r._id] || r.email?.endsWith('@scope.internal')}
            style={{ ...s.sendBtn, opacity: r.email?.endsWith('@scope.internal') ? 0.4 : 1 }}>
            {sending[r._id] ? 'Sending...' : 'Send Login'}
          </button>
        </div>
      )
    },
  ];

  const assignedStudents = selectedTeacher ? getAssignedStudents(selectedTeacher._id) : [];

  return (
    <AppLayout>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Teacher Management</h2>
          <p style={s.sub}>
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} registered
            {unassignedCount > 0 && <span style={{ color: '#f59e0b' }}> · {unassignedCount} unassigned</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.bulkBtn} onClick={() => { setShowBulkModal(true); setBulkMsg(''); setBulkForm({ teacherId: '', class: '', section: '' }); }}>
            Bulk Assign
          </button>
          <button style={s.addBtn} onClick={() => { setShowAddModal(true); setMsg(''); }}>+ Add Teacher</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={s.statsRow}>
        {[
          { label: 'Total', value: teachers.length, color: '#0891b2' },
          { label: 'Active', value: activeCount, color: '#10b981' },
          { label: 'Inactive', value: inactiveCount, color: '#ef4444' },
          { label: 'Unassigned', value: unassignedCount, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...s.statCard, borderLeftColor: color }}>
            <div style={{ ...s.statNum, color }}>{value}</div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {msg && <div style={msg.startsWith('OK:') ? s.successBanner : s.errorBanner}>{msg}</div>}

      <div style={s.toolbar}>
        <input style={s.search} placeholder="Search by name, email or phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <span style={s.count}>{filtered.length} results</span>
        <button style={s.exportBtn} onClick={exportTeachersCSV}>Export CSV</button>
      </div>

      {loading
        ? <div style={s.loading}>Loading teachers...</div>
        : <DataTable columns={columns} data={filtered} emptyMsg="No teachers found. Add one using the button above." />
      }

      {/* Edit Modal */}
      {showEditModal && selectedTeacher && (
        <Modal title={`Edit Teacher — ${selectedTeacher.name}`} onClose={() => setShowEditModal(false)} width={440}>
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={s.field}>
              <label style={s.label}>Full Name *</label>
              <input style={s.input} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email *</label>
              <input style={s.input} type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone</label>
              <input style={s.input} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Mobile number" />
            </div>
            <div style={s.field}>
              <label style={s.label}>
                New Password
                <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>(leave blank to keep current)</span>
              </label>
              <input style={s.input} type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={s.cancelBtn}>Cancel</button>
              <button type="submit" style={s.addBtn} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Students Modal */}
      {showStudentsModal && selectedTeacher && (
        <Modal title={`Students — ${selectedTeacher.name}`} onClose={() => setShowStudentsModal(false)} width={500}>
          {assignedStudents.length === 0
            ? <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>No students assigned to this teacher.</p>
            : <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''}</span>
                  <button style={s.exportBtn} onClick={exportStudentsCSV}>Export CSV</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {assignedStudents.map(st => (
                    <div key={st._id} style={s.studentCard}>
                      <div style={s.studentAvatar}>{st.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{st.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Roll: {st.rollNumber} · Class {st.class}-{st.section}</div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        {st.parent ? st.parent.name : <span style={{ color: '#f59e0b' }}>No parent</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
          }
        </Modal>
      )}

      {/* Bulk Assign Modal */}
      {showBulkModal && (
        <Modal title="Bulk Assign Teacher to Class" onClose={() => setShowBulkModal(false)} width={440}>
          <form onSubmit={handleBulkAssign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
              Assign one teacher to all students in a specific class and section.
            </p>
            {bulkMsg && <div style={bulkMsg.startsWith('OK:') ? s.successBanner : s.errorBanner}>{bulkMsg}</div>}
            <div style={s.field}>
              <label style={s.label}>Teacher *</label>
              <select style={s.input} value={bulkForm.teacherId} onChange={e => setBulkForm({ ...bulkForm, teacherId: e.target.value })} required>
                <option value="">— Select Teacher —</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Class *</label>
              <select style={s.input} value={bulkForm.class} onChange={e => setBulkForm({ ...bulkForm, class: e.target.value })} required>
                <option value="">— Select Class —</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Section *</label>
              <select style={s.input} value={bulkForm.section} onChange={e => setBulkForm({ ...bulkForm, section: e.target.value })} required>
                <option value="">— Select Section —</option>
                {sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowBulkModal(false)} style={s.cancelBtn}>Cancel</button>
              <button type="submit" style={s.addBtn} disabled={bulkSaving}>{bulkSaving ? 'Assigning...' : 'Assign Teacher'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <Modal title="Create Teacher Account" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['name', 'Full Name', 'text'], ['email', 'Email Address', 'email'], ['password', 'Password', 'password'], ['phone', 'Phone Number', 'tel']].map(([key, label, type]) => (
              <div key={key} style={s.field}>
                <label style={s.label}>
                  {label}{key !== 'phone' && <span style={{ color: '#ef4444' }}> *</span>}
                  {key === 'password' && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}>default: Welcome@123</span>}
                </label>
                <input style={s.input} type={type} value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  required={key !== 'phone'}
                  placeholder={key === 'password' ? 'Min 6 characters' : ''} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={s.cancelBtn}>Cancel</button>
              <button type="submit" style={s.addBtn} disabled={saving}>{saving ? 'Creating...' : 'Create Account'}</button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
};

const s = {
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:         { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:           { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  addBtn:        { background: '#0891b2', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  bulkBtn:       { background: '#fff', color: '#0891b2', border: '1.5px solid #0891b2', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  statsRow:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 },
  statCard:      { background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '16px 18px', borderLeft: '4px solid #0891b2' },
  statNum:       { fontSize: '1.6rem', fontWeight: 700, marginBottom: 4 },
  statLabel:     { fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 },
  toolbar:       { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  search:        { flex: 1, padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', background: '#fff', outline: 'none' },
  count:         { fontSize: '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' },
  exportBtn:     { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '9px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  loading:       { textAlign: 'center', padding: '60px', color: '#9ca3af' },
  nameCell:      { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:        { width: 36, height: 36, borderRadius: '50%', background: '#e0f2fe', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  viewBtn:       { background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  noAssign:      { color: '#9ca3af', fontSize: '0.78rem' },
  classChip:     { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600 },
  editBtn:       { background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '5px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  toggleBtn:     { padding: '5px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  sendBtn:       { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  successBanner: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 16px', borderRadius: 8, marginBottom: 4, fontSize: '0.88rem' },
  errorBanner:   { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 16px', borderRadius: 8, marginBottom: 4, fontSize: '0.88rem' },
  field:         { display: 'flex', flexDirection: 'column', gap: 5 },
  label:         { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  input:         { padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  cancelBtn:     { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  studentCard:   { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' },
  studentAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 },
};

export default ManageTeachers;
