import React, { useEffect, useState, useRef, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import api from '../../services/api';

const parseCSV = (text) => {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
};

const normalizeRow = (row) => ({
  name: row.name || row.studentname || row.fullname || '',
  rollNumber: row.rollnumber || row.roll || row.rollno || row.id || '',
  class: row.class || row.grade || row.std || '',
  section: row.section || row.div || row.division || 'A',
  gender: row.gender || row.sex || 'male',
  dateOfBirth: row.dob || row.dateofbirth || row.birthdate || '',
  address: row.address || '',
  phone: row.phone || row.contact || '',
});

const currentYear = () => { const y = new Date().getFullYear(); return `${y}-${String(y+1).slice(2)}`; };

const EMPTY_FORM = { name: '', rollNumber: '', class: '', section: '', gender: 'male', dateOfBirth: '', academicYear: currentYear(), phone: '', email: '', address: '', fatherName: '', fatherPhone: '', fatherEmail: '', motherName: '', motherPhone: '', motherEmail: '' };

const ManageStudents = () => {
  const [students, setStudents]         = useState([]);
  const [parents, setParents]           = useState([]);
  const [teachers, setTeachers]         = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLinkModal, setShowLinkModal]     = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [linkTab, setLinkTab]           = useState('parent'); // 'parent' | 'teacher'
  const [linkSearch, setLinkSearch]     = useState('');
  const [linking, setLinking]           = useState(false);
  const [linkMsg, setLinkMsg]           = useState('');
  const [search, setSearch]             = useState('');
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [addTab, setAddTab]             = useState('basic');
  const [saving, setSaving]             = useState(false);
  const [csvPreview, setCsvPreview]     = useState([]);
  const [csvRaw, setCsvRaw]             = useState([]);
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const fileRef = useRef();

  const fetchAll = useCallback(() => {
    api.get('/students').then(({ data }) => setStudents(data));
    api.get('/students/users/parent').then(({ data }) => setParents(data)).catch(() => {});
    api.get('/students/users/teacher').then(({ data }) => setTeachers(data)).catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.dateOfBirth) { alert('Date of Birth is required.'); return; }
    if (!form.academicYear) { alert('Academic Year is required.'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/students', form);
      setStudents([data, ...students]);
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      setAddTab('basic');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding student');
    }
    setSaving(false);
  };

  const openLinkModal = (student, tab = 'parent') => {
    setSelectedStudent(student);
    setLinkTab(tab);
    setLinkSearch('');
    setLinkMsg('');
    setShowLinkModal(true);
  };

  const handleLinkParent = async (parentId) => {
    setLinking(true);
    try {
      const { data } = await api.put(`/students/${selectedStudent._id}/link-parent`, { parentId });
      setStudents(prev => prev.map(s => s._id === data._id ? data : s));
      setSelectedStudent(data);
      setLinkMsg('OK: Parent linked successfully!');
    } catch (err) {
      setLinkMsg('ERR: ' + (err.response?.data?.message || 'Failed to link parent'));
    }
    setLinking(false);
  };

  const handleUnlinkParent = async () => {
    if (!window.confirm('Remove parent link from this student?')) return;
    setLinking(true);
    try {
      const { data } = await api.put(`/students/${selectedStudent._id}/unlink-parent`);
      setStudents(prev => prev.map(s => s._id === data._id ? data : s));
      setSelectedStudent(data);
      setLinkMsg('OK: Parent unlinked.');
    } catch (err) {
      setLinkMsg('ERR: ' + (err.response?.data?.message || 'Failed'));
    }
    setLinking(false);
  };

  const handleAssignTeacher = async (teacherId) => {
    setLinking(true);
    try {
      const { data } = await api.put(`/students/${selectedStudent._id}/assign-teacher`, { teacherId });
      setStudents(prev => prev.map(s => s._id === data._id ? data : s));
      setSelectedStudent(data);
      setLinkMsg('OK: Teacher assigned successfully!');
    } catch (err) {
      setLinkMsg('ERR: ' + (err.response?.data?.message || 'Failed to assign teacher'));
    }
    setLinking(false);
  };

  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) { alert('Please upload a valid .csv file'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      const normalized = rows.map(normalizeRow).filter(r => r.name && r.rollNumber);
      setCsvRaw(normalized);
      setCsvPreview(normalized.slice(0, 5));
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvRaw.length) return;
    setImporting(true);
    try {
      const { data } = await api.post('/students/import', { students: csvRaw });
      setImportResult(data);
      fetchAll();
    } catch (err) {
      setImportResult({ error: err.response?.data?.message || 'Import failed' });
    }
    setImporting(false);
  };

  const resetImport = () => { setCsvRaw([]); setCsvPreview([]); setImportResult(null); if (fileRef.current) fileRef.current.value = ''; };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    String(s.class).includes(search)
  );

  const listForTab = linkTab === 'parent' ? parents : teachers;
  const filteredList = listForTab.filter(u =>
    u.name.toLowerCase().includes(linkSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(linkSearch.toLowerCase())
  );

  const columns = [
    {
      key: 'name', label: 'Student',
      render: r => (
        <div style={st.nameCell}>
          <div style={st.avatar}>{r.name[0]}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{r.rollNumber}</div>
          </div>
        </div>
      )
    },
    { key: 'class', label: 'Class', render: r => `${r.class} - ${r.section}` },
    { key: 'gender', label: 'Gender', render: r => <Badge label={r.gender} type={r.gender === 'male' ? 'info' : 'purple'} /> },
    {
      key: 'parent', label: 'Parent',
      render: r => r.parent
        ? <span style={st.linkedChip}>{r.parent.name}</span>
        : <span style={st.unlinkedChip}>Not linked</span>
    },
    {
      key: 'teacher', label: 'Teacher',
      render: r => r.teacher
        ? <span style={st.linkedChipBlue}>{r.teacher.name}</span>
        : <span style={st.unlinkedChip}>— Not assigned</span>
    },
    { key: 'isActive', label: 'Status', render: r => <Badge label={r.isActive ? 'Active' : 'Inactive'} type={r.isActive ? 'success' : 'danger'} /> },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => openLinkModal(r, 'parent')} style={st.actionBtn('#4f46e5')}>
            {r.parent ? 'Change' : 'Link'} Parent
          </button>
          <button onClick={() => openLinkModal(r, 'teacher')} style={st.actionBtn('#0891b2')}>
            {r.teacher ? 'Change' : 'Assign'} Teacher
          </button>
        </div>
      )
    },
  ];

  return (
    <AppLayout>
      <div style={st.header}>
        <div>
          <h2 style={st.title}>Student Management</h2>
          <p style={st.sub}>{students.length} students enrolled · {students.filter(s => !s.parent).length} without parent link</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={st.importBtn} onClick={() => { setShowImportModal(true); resetImport(); }}>Import CSV</button>
          <button style={st.addBtn} onClick={() => setShowAddModal(true)}>+ Add Student</button>
        </div>
      </div>

      <div style={st.toolbar}>
        <input style={st.search} placeholder="Search by name, roll number or class..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <span style={st.count}>{filtered.length} results</span>
      </div>

      <DataTable columns={columns} data={filtered} emptyMsg="No students found." />

      {/* ── Link Parent / Assign Teacher Modal ── */}
      {showLinkModal && selectedStudent && (
        <Modal title={`Manage Links — ${selectedStudent.name}`} onClose={() => setShowLinkModal(false)} width={520}>
          <div>
            {/* Tabs */}
            <div style={st.tabs}>
              {[['parent', 'Link Parent'], ['teacher', 'Assign Teacher']].map(([tab, label]) => (
                <button key={tab} onClick={() => { setLinkTab(tab); setLinkSearch(''); setLinkMsg(''); }}
                  style={{ ...st.tab, ...(linkTab === tab ? st.tabActive : {}) }}>{label}</button>
              ))}
            </div>

            {/* Current assignment */}
            <div style={st.currentBox}>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Currently assigned:</span>
              {linkTab === 'parent' ? (
                selectedStudent.parent
                  ? <div style={st.currentItem}>
                      <strong>{selectedStudent.parent.name}</strong>
                      <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}> · {selectedStudent.parent.email}</span>
                      <button onClick={handleUnlinkParent} disabled={linking} style={st.unlinkBtn}>✕ Unlink</button>
                    </div>
                  : <span style={{ color: '#ef4444', fontSize: '0.85rem', marginLeft: 8 }}>No parent linked</span>
              ) : (
                selectedStudent.teacher
                  ? <div style={st.currentItem}>
                      <strong>{selectedStudent.teacher.name}</strong>
                      <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}> · {selectedStudent.teacher.email}</span>
                    </div>
                  : <span style={{ color: '#ef4444', fontSize: '0.85rem', marginLeft: 8 }}>No teacher assigned</span>
              )}
            </div>

            {linkMsg && (
              <div style={{ ...st.msgBox, background: linkMsg.startsWith('OK:') ? '#f0fdf4' : '#fef2f2', color: linkMsg.startsWith('OK:') ? '#15803d' : '#b91c1c', borderColor: linkMsg.startsWith('OK:') ? '#bbf7d0' : '#fecaca' }}>
                {linkMsg}
              </div>
            )}

            <input style={{ ...st.search, marginBottom: 10 }}
              placeholder={`Search ${linkTab === 'parent' ? 'parents' : 'teachers'}...`}
              value={linkSearch} onChange={e => setLinkSearch(e.target.value)} />

            <div style={st.listBox}>
              {filteredList.length === 0
                ? <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: '0.85rem' }}>
                    No {linkTab === 'parent' ? 'parents' : 'teachers'} found.
                  </div>
                : filteredList.map(u => (
                  <div key={u._id} style={st.listItem}>
                    <div style={st.listAvatar(linkTab === 'parent' ? '#dcfce7' : '#e0f2fe', linkTab === 'parent' ? '#059669' : '#0891b2')}>
                      {u.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{u.email}</div>
                    </div>
                    <button
                      onClick={() => linkTab === 'parent' ? handleLinkParent(u._id) : handleAssignTeacher(u._id)}
                      disabled={linking}
                      style={st.selectBtn(linkTab === 'parent' ? '#4f46e5' : '#0891b2')}>
                      {linking ? '...' : 'Select'}
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Student Modal ── */}
      {showAddModal && (
        <Modal title="Add New Student" onClose={() => { setShowAddModal(false); setAddTab('basic'); }} width={600}>
          <form onSubmit={handleAddSubmit} style={st.form}>
            {/* Sub-tabs */}
            <div style={st.subTabs}>
              {[['basic','Basic Info'],['parent','Parent Info'],['contact','Contact']].map(([k,l]) => (
                <button key={k} type="button" onClick={() => setAddTab(k)}
                  style={{ ...st.subTab, ...(addTab === k ? st.subTabActive : {}) }}>{l}</button>
              ))}
            </div>

            {addTab === 'basic' && (
              <div style={st.grid2}>
                <div style={st.field}>
                  <label style={st.label}>Full Name *</label>
                  <input style={st.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Student full name" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Roll Number *</label>
                  <input style={st.input} value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})} required placeholder="e.g. 2024001" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Class *</label>
                  <input style={st.input} value={form.class} onChange={e => setForm({...form, class: e.target.value})} required placeholder="e.g. 10" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Section *</label>
                  <input style={st.input} value={form.section} onChange={e => setForm({...form, section: e.target.value})} required placeholder="e.g. A" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Date of Birth *</label>
                  <input style={st.input} type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} required />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Gender *</label>
                  <select style={st.input} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={st.field}>
                  <label style={st.label}>Academic Year *</label>
                  <input style={st.input} value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})} required placeholder="e.g. 2024-25" />
                </div>
              </div>
            )}

            {addTab === 'parent' && (
              <div style={st.grid2}>
                <div style={st.field}>
                  <label style={st.label}>Father Name</label>
                  <input style={st.input} value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} placeholder="Father full name" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Father Phone</label>
                  <input style={st.input} value={form.fatherPhone} onChange={e => setForm({...form, fatherPhone: e.target.value})} placeholder="Father mobile" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Father Email</label>
                  <input style={st.input} type="email" value={form.fatherEmail} onChange={e => setForm({...form, fatherEmail: e.target.value})} placeholder="father@email.com" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Mother Name</label>
                  <input style={st.input} value={form.motherName} onChange={e => setForm({...form, motherName: e.target.value})} placeholder="Mother full name" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Mother Phone</label>
                  <input style={st.input} value={form.motherPhone} onChange={e => setForm({...form, motherPhone: e.target.value})} placeholder="Mother mobile" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Mother Email</label>
                  <input style={st.input} type="email" value={form.motherEmail} onChange={e => setForm({...form, motherEmail: e.target.value})} placeholder="mother@email.com" />
                </div>
              </div>
            )}

            {addTab === 'contact' && (
              <div style={st.grid2}>
                <div style={st.field}>
                  <label style={st.label}>Student Phone</label>
                  <input style={st.input} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Student mobile" />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Student Email</label>
                  <input style={st.input} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="student@email.com" />
                </div>
                <div style={{ ...st.field, gridColumn: '1 / -1' }}>
                  <label style={st.label}>Address</label>
                  <textarea style={{ ...st.input, height: 70, resize: 'vertical' }} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
                </div>
              </div>
            )}

            <div style={st.modalFooter}>
              <button type="button" onClick={() => { setShowAddModal(false); setAddTab('basic'); }} style={st.cancelBtn}>Cancel</button>
              <button type="submit" style={st.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Save Student'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── CSV Import Modal ── */}
      {showImportModal && (
        <Modal title="Import Students from CSV" onClose={() => setShowImportModal(false)} width={580}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={st.infoBox}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4f46e5', marginBottom: 6 }}>Required: name, rollNumber, class, section</p>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0 }}>Optional: gender, dateOfBirth, address</p>
            </div>
            {!csvRaw.length && !importResult && (
              <div
                style={{ border: `2px dashed ${dragOver ? '#4f46e5' : '#e5e7eb'}`, borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#f5f3ff' : '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current.click()}
              >
                <span style={{ fontSize: '2.5rem' }}>[ CSV ]</span>
                <p style={{ fontWeight: 600, color: '#374151' }}>Drag & drop CSV here or click to browse</p>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              </div>
            )}
            {csvRaw.length > 0 && !importResult && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#059669' }}>{csvRaw.length} students ready</span>
                  <button onClick={resetImport} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>Clear</button>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead><tr style={{ background: '#f8fafc' }}>{['Name','Roll No','Class','Section'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#6b7280', fontSize: '0.75rem' }}>{h}</th>)}</tr></thead>
                    <tbody>{csvPreview.map((r, i) => <tr key={i}><td style={{ padding: '8px 12px' }}>{r.name}</td><td style={{ padding: '8px 12px' }}>{r.rollNumber}</td><td style={{ padding: '8px 12px' }}>{r.class}</td><td style={{ padding: '8px 12px' }}>{r.section}</td></tr>)}</tbody>
                  </table>
                  {csvRaw.length > 5 && <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.78rem', padding: 8 }}>...and {csvRaw.length - 5} more</p>}
                </div>
                <button onClick={handleImport} disabled={importing} style={{ width: '100%', background: '#4f46e5', color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                  {importing ? 'Importing...' : `Import ${csvRaw.length} Students`}
                </button>
              </div>
            )}
            {importResult && (
              <div style={{ background: importResult.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${importResult.error ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, padding: 20, color: importResult.error ? '#dc2626' : '#15803d' }}>
                {importResult.error ? <p>ERR: {importResult.error}</p> : (
                  <>
                    <p style={{ fontWeight: 700 }}>Import Complete!</p>
                    <p><strong>{importResult.inserted}</strong> students added</p>
                    {importResult.skipped > 0 && <p><strong>{importResult.skipped}</strong> skipped (duplicates)</p>}
                  </>
                )}
                <button onClick={() => setShowImportModal(false)} style={{ background: '#059669', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>Done</button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppLayout>
  );
};

const st = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:        { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:          { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  importBtn:    { background: '#fff', color: '#4f46e5', border: '1.5px solid #4f46e5', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  addBtn:       { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  toolbar:      { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  search:       { flex: 1, padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', background: '#fff', outline: 'none', width: '100%' },
  count:        { fontSize: '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' },
  nameCell:     { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:       { width: 34, height: 34, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 },
  linkedChip:   { background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 },
  linkedChipBlue: { background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 },
  unlinkedChip: { background: '#f9fafb', color: '#9ca3af', padding: '3px 8px', borderRadius: 6, fontSize: '0.78rem' },
  actionBtn:    (c) => ({ background: c + '15', color: c, border: `1px solid ${c}40`, padding: '5px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }),
  tabs:         { display: 'flex', gap: 0, marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  tab:          { flex: 1, padding: '10px', border: 'none', background: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  tabActive:    { background: '#4f46e5', color: '#fff' },
  currentBox:   { background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  currentItem:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' },
  unlinkBtn:    { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: 5, fontSize: '0.75rem', cursor: 'pointer', marginLeft: 8 },
  msgBox:       { border: '1px solid', borderRadius: 8, padding: '8px 14px', marginBottom: 10, fontSize: '0.85rem' },
  listBox:      { maxHeight: 280, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 },
  listItem:     { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f3f4f6' },
  listAvatar:   (bg, c) => ({ width: 32, height: 32, borderRadius: '50%', background: bg, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }),
  selectBtn:    (c) => ({ background: c, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }),
  form:         { display: 'flex', flexDirection: 'column', gap: 14 },
  field:        { display: 'flex', flexDirection: 'column', gap: 5 },
  label:        { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  input:        { padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  modalFooter:  { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn:    { padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  saveBtn:      { padding: '9px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  infoBox:      { background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '14px 16px' },
  grid2:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  subTabs:      { display: 'flex', gap: 0, marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  subTab:       { flex: 1, padding: '9px', border: 'none', background: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  subTabActive: { background: '#4f46e5', color: '#fff' },
};

export default ManageStudents;
