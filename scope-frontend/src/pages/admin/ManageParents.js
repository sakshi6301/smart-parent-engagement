import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import api from '../../services/api';

const EMPTY_FORM = { name: '', email: '', phone: '', password: 'Welcome@123', language: 'en', studentIds: [] };

const ManageParents = () => {
  const [parents, setParents]   = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  // modals
  const [showAdd, setShowAdd]           = useState(false);
  const [showEdit, setShowEdit]         = useState(false);
  const [showView, setShowView]         = useState(false);
  const [selected, setSelected]         = useState(null);   // parent being edited/viewed

  // form
  const [form, setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  // student search inside modal
  const [studentSearch, setStudentSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: p }, { data: s }] = await Promise.all([
        api.get('/students/users/parent'),
        api.get('/students'),
      ]);
      setParents(p);
      setStudents(Array.isArray(s) ? s : []);
    } catch (err) { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getLinked = (parentId) =>
    students.filter(s => String(s.parent?._id || s.parent) === String(parentId));

  // ── Add Parent ────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setMsg(''); setStudentSearch(''); setShowAdd(true); };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim())
      return setMsg('ERR:Name, email and password are required.');
    setSaving(true); setMsg('');
    try {
      // 1. create user account
      const { data: newUser } = await api.post('/auth/admin/create-user', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        language: form.language,
        role: 'parent',
      });

      // 2. link selected students
      await Promise.all(
        form.studentIds.map(sid => api.put(`/students/${sid}/link-parent`, { parentId: newUser._id }))
      );

      setMsg(`OK:Parent "${newUser.name}" created${form.studentIds.length ? ` and linked to ${form.studentIds.length} student(s)` : ''}.`);
      await load();
      setTimeout(() => { setShowAdd(false); setMsg(''); }, 1500);
    } catch (err) {
      setMsg(`ERR:${err.response?.data?.message || 'Failed to create parent.'}`);
    } finally { setSaving(false); }
  };

  // ── Edit Parent ───────────────────────────────────────────────────────────
  const openEdit = (parent) => {
    const linked = getLinked(parent._id).map(s => s._id);
    setSelected(parent);
    setForm({ name: parent.name, email: parent.email, phone: parent.phone || '', password: '', language: parent.language || 'en', studentIds: linked });
    setMsg(''); setStudentSearch('');
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!form.name.trim() || !form.email.trim()) return setMsg('ERR:Name and email are required.');
    setSaving(true); setMsg('');
    try {
      // 1. update user via UserManagement endpoint (PATCH /auth/admin/users/:id)
      await api.put(`/auth/admin/users/${selected._id}`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        language: form.language,
        ...(form.password ? { password: form.password } : {}),
      });

      // 2. unlink all currently linked students, then re-link selected
      const currentLinked = getLinked(selected._id);
      await Promise.all(currentLinked.map(s => api.put(`/students/${s._id}/unlink-parent`)));
      await Promise.all(form.studentIds.map(sid => api.put(`/students/${sid}/link-parent`, { parentId: selected._id })));

      setMsg('OK:Parent updated successfully.');
      await load();
      setTimeout(() => { setShowEdit(false); setMsg(''); }, 1500);
    } catch (err) {
      setMsg(`ERR:${err.response?.data?.message || 'Failed to update parent.'}`);
    } finally { setSaving(false); }
  };

  // ── View / Unlink ─────────────────────────────────────────────────────────
  const openView = (parent) => { setSelected(parent); setShowView(true); };

  const handleUnlink = async (studentId) => {
    try {
      await api.put(`/students/${studentId}/unlink-parent`);
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, parent: null } : s));
    } catch (err) { /* silent */ }
  };

  // ── Toggle student selection in form ─────────────────────────────────────
  const toggleStudent = (sid) => {
    setForm(f => ({
      ...f,
      studentIds: f.studentIds.includes(sid)
        ? f.studentIds.filter(id => id !== sid)
        : [...f.studentIds, sid],
    }));
  };

  // ── Filtered students for modal picker ───────────────────────────────────
  const unlinkedStudents = students.filter(s => !s.parent || s.parent === null);
  const pickerStudents = (showEdit ? students : unlinkedStudents).filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    `${s.class}-${s.section}`.includes(studentSearch)
  );

  // ── Table ─────────────────────────────────────────────────────────────────
  const filtered = parents.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || '').includes(search)
  );

  const isOk = msg.startsWith('OK:');
  const msgText = msg.slice(4);

  const columns = [
    {
      key: 'name', label: 'Parent',
      render: r => (
        <div style={S.nameCell}>
          <div style={S.avatar}>{r.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 600, color: '#111827' }}>{r.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: r => r.phone || <span style={{ color: '#d1d5db' }}>—</span> },
    {
      key: 'children', label: 'Linked Students',
      render: r => {
        const count = getLinked(r._id).length;
        return count > 0
          ? <button onClick={() => openView(r)} style={S.viewBtn}>🎓 {count} student{count !== 1 ? 's' : ''} →</button>
          : <span style={S.noLink}>⚠ None linked</span>;
      },
    },
    { key: 'language', label: 'Language', render: r => ({ en: 'English', hi: 'Hindi', mr: 'Marathi' }[r.language] || 'English') },
    { key: 'isActive', label: 'Status', render: r => <Badge label={r.isActive ? 'Active' : 'Inactive'} type={r.isActive ? 'success' : 'danger'} /> },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <button onClick={() => openEdit(r)} style={S.editBtn}>Edit / Re-link</button>
      ),
    },
  ];

  // ── Shared form UI ────────────────────────────────────────────────────────
  const renderForm = (isEdit) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={S.grid2}>
        <div>
          <label style={S.label}>Full Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Parent full name" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Email *</label>
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="parent@email.com" style={S.input} type="email" />
        </div>
        <div>
          <label style={S.label}>Phone</label>
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="10-digit mobile" style={S.input} />
        </div>
        <div>
          <label style={S.label}>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
          <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder={isEdit ? 'Leave blank to keep current' : 'Welcome@123'} style={S.input} type="text" />
        </div>
        <div>
          <label style={S.label}>Language</label>
          <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} style={S.select}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
          </select>
        </div>
      </div>

      {/* Student Picker */}
      <div>
        <label style={S.label}>
          Link Students {form.studentIds.length > 0 && <span style={S.selCount}>{form.studentIds.length} selected</span>}
        </label>
        <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
          placeholder="Search by name, roll or class..." style={{ ...S.input, marginBottom: 8 }} />
        <div style={S.studentPicker}>
          {pickerStudents.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem' }}>
              {studentSearch ? 'No students match your search.' : 'All students are already linked to parents.'}
            </div>
          )}
          {pickerStudents.map(s => {
            const checked = form.studentIds.includes(s._id);
            return (
              <label key={s._id} style={{ ...S.studentRow, background: checked ? '#f0fdf4' : '#fff', borderColor: checked ? '#86efac' : '#e5e7eb' }}>
                <input type="checkbox" checked={checked} onChange={() => toggleStudent(s._id)} style={{ marginRight: 10, accentColor: '#059669' }} />
                <div style={S.sAvatar}>{s.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{s.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Roll: {s.rollNumber} · Class {s.class}-{s.section}</div>
                </div>
                {s.parent && !checked && <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>Linked</span>}
                {checked && <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>✓</span>}
              </label>
            );
          })}
        </div>
      </div>

      {msg && (
        <div style={{ ...S.msgBox, background: isOk ? '#f0fdf4' : '#fef2f2', color: isOk ? '#059669' : '#dc2626', border: `1px solid ${isOk ? '#bbf7d0' : '#fecaca'}` }}>
          {isOk ? '✓' : '✕'} {msgText}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => isEdit ? setShowEdit(false) : setShowAdd(false)} style={S.cancelBtn}>Cancel</button>
        <button onClick={isEdit ? handleEdit : handleAdd} disabled={saving} style={{ ...S.saveBtn, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Parent'}
        </button>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Parent Management</h2>
          <p style={S.sub}>
            {parents.length} parent{parents.length !== 1 ? 's' : ''} ·{' '}
            {parents.filter(p => getLinked(p._id).length === 0).length} without linked students
          </p>
        </div>
        <button onClick={openAdd} style={S.addBtn}>+ Add Parent</button>
      </div>

      <div style={S.toolbar}>
        <input style={S.search} placeholder="Search by name, email or phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <span style={S.count}>{filtered.length} results</span>
      </div>

      {loading
        ? <div style={S.loading}>Loading parents...</div>
        : <DataTable columns={columns} data={filtered} emptyMsg="No parents found." />
      }

      {/* ── Add Modal ── */}
      {showAdd && (
        <Modal title="Add New Parent" onClose={() => setShowAdd(false)} width={640}>
          {renderForm(false)}
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && selected && (
        <Modal title={`Edit Parent — ${selected.name}`} onClose={() => setShowEdit(false)} width={640}>
          {renderForm(true)}
        </Modal>
      )}

      {/* ── View Linked Students Modal ── */}
      {showView && selected && (
        <Modal title={`Students linked to ${selected.name}`} onClose={() => setShowView(false)} width={500}>
          {getLinked(selected._id).length === 0
            ? <p style={{ color: '#9ca3af', textAlign: 'center', padding: 24 }}>No students linked.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {getLinked(selected._id).map(st => (
                  <div key={st._id} style={S.viewStudentCard}>
                    <div style={S.sAvatar}>{st.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{st.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Roll: {st.rollNumber} · Class {st.class}-{st.section}</div>
                    </div>
                    <Badge label={st.isActive ? 'Active' : 'Inactive'} type={st.isActive ? 'success' : 'danger'} />
                    <button onClick={() => handleUnlink(st._id)} style={S.unlinkBtn} title="Unlink student">Unlink</button>
                  </div>
                ))}
              </div>
            )
          }
        </Modal>
      )}
    </AppLayout>
  );
};

const S = {
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:     { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:       { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  addBtn:    { background: '#059669', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' },
  toolbar:   { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  search:    { flex: 1, padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', background: '#fff', outline: 'none' },
  count:     { fontSize: '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' },
  loading:   { textAlign: 'center', padding: '60px', color: '#9ca3af' },
  nameCell:  { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:    { width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  viewBtn:   { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  noLink:    { color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600 },
  editBtn:   { background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label:     { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 },
  input:     { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  select:    { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' },
  selCount:  { background: '#059669', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700, marginLeft: 8 },
  studentPicker: { border: '1.5px solid #e5e7eb', borderRadius: 8, maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 },
  studentRow:    { display: 'flex', alignItems: 'center', padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', border: '1px solid transparent', borderRadius: 0 },
  sAvatar:       { width: 30, height: 30, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, marginRight: 10 },
  msgBox:    { padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 },
  cancelBtn: { padding: '9px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  saveBtn:   { padding: '9px 24px', border: 'none', borderRadius: 8, background: '#059669', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' },
  viewStudentCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' },
  unlinkBtn: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
};

export default ManageParents;
