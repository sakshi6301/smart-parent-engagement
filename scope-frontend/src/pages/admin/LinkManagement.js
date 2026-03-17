import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/Modal';
import api from '../../services/api';

const LinkManagement = () => {
  const [students, setStudents]         = useState([]);
  const [parents, setParents]           = useState([]);
  const [teachers, setTeachers]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('unlinked');
  const [search, setSearch]             = useState('');
  const [classFilter, setClassFilter]   = useState('');
  const [savingId, setSavingId]         = useState(null);
  const [autoLinking, setAutoLinking]   = useState(false);
  const [autoResult, setAutoResult]     = useState(null);
  const [showDetails, setShowDetails]   = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm]         = useState({ teacherId: '', class: '', section: '' });
  const [bulkSaving, setBulkSaving]     = useState(false);
  const [bulkMsg, setBulkMsg]           = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/students'),
      api.get('/students/users/parent'),
      api.get('/students/users/teacher'),
    ]).then(([{ data: s }, { data: p }, { data: t }]) => {
      setStudents(s); setParents(p); setTeachers(t);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const classes  = [...new Set(students.map(s => String(s.class)))].sort((a, b) => Number(a) - Number(b));
  const sections = [...new Set(students.map(s => s.section))].sort();

  const unlinkedCount  = students.filter(s => !s.parent).length;
  const noTeacherCount = students.filter(s => !s.teacher).length;
  const linkedPct      = students.length ? Math.round((students.length - unlinkedCount) / students.length * 100) : 0;

  const displayed = students.filter(s => {
    if (tab === 'unlinked'  && s.parent && s.teacher) return false;
    if (tab === 'noparent'  && s.parent)              return false;
    if (tab === 'noteacher' && s.teacher)             return false;
    if (classFilter && String(s.class) !== classFilter) return false;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.rollNumber || '').toLowerCase().includes(q);
  });

  const handleParentChange = async (studentId, parentId) => {
    setSavingId(studentId + '_parent');
    try {
      const { data } = parentId
        ? await api.put(`/students/${studentId}/link-parent`, { parentId })
        : await api.put(`/students/${studentId}/unlink-parent`);
      setStudents(prev => prev.map(s => s._id === data._id ? data : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update parent');
    }
    setSavingId(null);
  };

  const handleTeacherChange = async (studentId, teacherId) => {
    if (!teacherId) return;
    setSavingId(studentId + '_teacher');
    try {
      const { data } = await api.put(`/students/${studentId}/assign-teacher`, { teacherId });
      setStudents(prev => prev.map(s => s._id === data._id ? data : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign teacher');
    }
    setSavingId(null);
  };

  const handleAutoLink = async () => {
    if (!window.confirm('Auto-link will match unlinked students to parents by email/name, and assign teachers by class-section. Continue?')) return;
    setAutoLinking(true);
    setAutoResult(null);
    try {
      const { data } = await api.post('/students/auto-link');
      setAutoResult(data);
      fetchAll();
    } catch (err) {
      setAutoResult({ error: err.response?.data?.message || 'Auto-link failed' });
    }
    setAutoLinking(false);
  };

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    setBulkSaving(true);
    setBulkMsg('');
    try {
      const { data } = await api.post('/students/bulk-assign-teacher', bulkForm);
      setBulkMsg('OK:' + data.message);
      fetchAll();
    } catch (err) {
      setBulkMsg('ERR:' + (err.response?.data?.message || 'Failed'));
    }
    setBulkSaving(false);
  };

  return (
    <AppLayout>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Link Management</h2>
          <p style={s.sub}>Connect students with parents and teachers</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.bulkBtn} onClick={() => { setShowBulkModal(true); setBulkMsg(''); setBulkForm({ teacherId: '', class: '', section: '' }); }}>
            Bulk Assign Teacher
          </button>
          <button style={s.autoBtn} onClick={handleAutoLink} disabled={autoLinking}>
            {autoLinking ? 'Linking...' : 'Auto-Link All'}
          </button>
        </div>
      </div>

      {/* Info box */}
      <div style={s.infoBox}>
        <span style={{ fontSize: '1rem' }}>💡</span>
        <span style={{ fontSize: '0.82rem', color: '#1e40af' }}>
          <strong>CSV Import</strong> links everything automatically (recommended).
          {' · '}<strong>Auto-Link</strong> fixes manually added students by matching father/mother email then name.
          {' · '}<strong>Bulk Assign Teacher</strong> assigns one teacher to a whole class-section at once.
          {' · '}<strong>Inline dropdowns</strong> below fix individual students manually.
        </span>
      </div>

      {/* Auto-link result banner */}
      {autoResult && (
        <div style={{ ...s.banner, ...(autoResult.error ? s.bannerRed : s.bannerGreen) }}>
          {autoResult.error ? (
            <span>{autoResult.error}</span>
          ) : (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <strong>Auto-Link Complete!</strong>
              <span>{autoResult.parentLinked} parents linked</span>
              <span>{autoResult.teacherLinked} teachers assigned</span>
              {autoResult.parentSkipped  > 0 && <span>{autoResult.parentSkipped} parents not matched</span>}
              {autoResult.teacherSkipped > 0 && <span>{autoResult.teacherSkipped} teachers not matched</span>}
              {autoResult.details?.length > 0 && (
                <button onClick={() => setShowDetails(v => !v)} style={s.detailsBtn}>
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
              )}
              <button onClick={() => { setAutoResult(null); setShowDetails(false); }} style={s.dismissBtn}>x</button>
            </div>
          )}
          {showDetails && autoResult.details?.length > 0 && (
            <div style={s.detailsBox}>
              {autoResult.details.map((d, i) => (
                <div key={i} style={s.detailRow}>
                  <strong>{d.student}</strong>
                  <span style={{ color: '#6b7280' }}>({d.roll})</span>
                  <span>matched by <strong>{d.by}</strong></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div style={s.summaryRow}>
        <div style={s.card('#fef3c7', '#f59e0b', '#92400e')}>
          <div style={{ fontSize: '1.8rem' }}>⚠️</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{unlinkedCount}</div>
            <div style={{ fontSize: '0.78rem' }}>No parent linked</div>
          </div>
        </div>
        <div style={s.card('#fce7f3', '#ec4899', '#831843')}>
          <div style={{ fontSize: '1.8rem' }}>👨‍🏫</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{noTeacherCount}</div>
            <div style={{ fontSize: '0.78rem' }}>No teacher assigned</div>
          </div>
        </div>
        <div style={s.card('#d1fae5', '#10b981', '#065f46')}>
          <div style={{ fontSize: '1.8rem' }}>✅</div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{students.length - unlinkedCount}</div>
            <div style={{ fontSize: '0.78rem' }}>Parent linked</div>
          </div>
        </div>
        <div style={{ ...s.card('#e0e7ff', '#6366f1', '#3730a3'), flex: 2, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Parent Link Progress</span>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#4f46e5' }}>{linkedPct}%</span>
          </div>
          <div style={s.progressBg}>
            <div style={{ ...s.progressFill, width: `${linkedPct}%`, background: linkedPct === 100 ? '#10b981' : '#4f46e5' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{students.length - unlinkedCount} of {students.length} students linked</div>
        </div>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <div style={s.tabs}>
          {[
            ['unlinked',  `Incomplete (${students.filter(s => !s.parent || !s.teacher).length})`],
            ['noparent',  `No Parent (${unlinkedCount})`],
            ['noteacher', `No Teacher (${noTeacherCount})`],
            ['all',       `All (${students.length})`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ ...s.tab, ...(tab === key ? s.tabActive : {}) }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={s.search} placeholder="Search name or roll number..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <select style={s.select} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={s.loading}>Loading...</div>
      ) : displayed.length === 0 ? (
        <div style={s.empty}>All students are fully linked!</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Student</th>
                <th style={s.th}>Class</th>
                <th style={s.th}>Parent <span style={s.hint}>(select to link instantly)</span></th>
                <th style={s.th}>Teacher <span style={s.hint}>(select to assign instantly)</span></th>
                <th style={s.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((st, i) => {
                const savingParent  = savingId === st._id + '_parent';
                const savingTeacher = savingId === st._id + '_teacher';
                const fullyLinked   = st.parent && st.teacher;
                return (
                  <tr key={st._id} style={{ background: fullyLinked ? '#f0fdf4' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <div style={s.avatar}>{st.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{st.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{st.rollNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={s.classBadge}>Class {st.class}-{st.section}</span>
                    </td>
                    <td style={s.td}>
                      <div style={s.inlineSelect}>
                        <select
                          style={{ ...s.dropdown, borderColor: st.parent ? '#bbf7d0' : '#fde68a', background: st.parent ? '#f0fdf4' : '#fffbeb', opacity: savingParent ? 0.6 : 1 }}
                          value={st.parent?._id || st.parent || ''}
                          onChange={e => handleParentChange(st._id, e.target.value)}
                          disabled={savingParent}
                        >
                          <option value="">Select Parent</option>
                          {parents.map(p => (
                            <option key={p._id} value={p._id}>{p.name} · {p.phone || p.email}</option>
                          ))}
                        </select>
                        {savingParent  && <span>⏳</span>}
                        {st.parent && !savingParent && <span>✅</span>}
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={s.inlineSelect}>
                        <select
                          style={{ ...s.dropdown, borderColor: st.teacher ? '#bae6fd' : '#e5e7eb', background: st.teacher ? '#e0f2fe' : '#f9fafb', opacity: savingTeacher ? 0.6 : 1 }}
                          value={st.teacher?._id || st.teacher || ''}
                          onChange={e => handleTeacherChange(st._id, e.target.value)}
                          disabled={savingTeacher}
                        >
                          <option value="">Select Teacher</option>
                          {teachers.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                        {savingTeacher  && <span>⏳</span>}
                        {st.teacher && !savingTeacher && <span>✅</span>}
                      </div>
                    </td>
                    <td style={s.td}>
                      {fullyLinked
                        ? <span style={s.chip('#d1fae5', '#065f46')}>Complete</span>
                        : !st.parent && !st.teacher
                          ? <span style={s.chip('#fef3c7', '#92400e')}>Both missing</span>
                          : !st.parent
                            ? <span style={s.chip('#fef3c7', '#92400e')}>No parent</span>
                            : <span style={s.chip('#fce7f3', '#831843')}>No teacher</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={s.tableFooter}>{displayed.length} students shown</div>
        </div>
      )}

      {/* Bulk Assign Teacher Modal */}
      {showBulkModal && (
        <Modal title="Bulk Assign Teacher to Class" onClose={() => setShowBulkModal(false)} width={440}>
          <form onSubmit={handleBulkAssign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
              Assign one teacher to all students in a class-section at once.
            </p>
            {bulkMsg && (
              <div style={{ background: bulkMsg.startsWith('OK:') ? '#f0fdf4' : '#fef2f2', color: bulkMsg.startsWith('OK:') ? '#15803d' : '#b91c1c', border: '1px solid', borderColor: bulkMsg.startsWith('OK:') ? '#bbf7d0' : '#fecaca', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem' }}>
                {bulkMsg.replace(/^(OK:|ERR:)/, '')}
              </div>
            )}
            {[
              { label: 'Teacher', key: 'teacherId', options: teachers.map(t => ({ value: t._id, label: t.name })) },
              { label: 'Class',   key: 'class',     options: classes.map(c => ({ value: c, label: `Class ${c}` })) },
              { label: 'Section', key: 'section',   options: sections.map(sec => ({ value: sec, label: `Section ${sec}` })) },
            ].map(({ label, key, options }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{label} *</label>
                <select
                  style={{ padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }}
                  value={bulkForm[key]}
                  onChange={e => setBulkForm({ ...bulkForm, [key]: e.target.value })}
                  required
                >
                  <option value="">Select {label}</option>
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setShowBulkModal(false)}
                style={{ padding: '9px 18px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={s.autoBtn} disabled={bulkSaving}>
                {bulkSaving ? 'Assigning...' : 'Assign Teacher'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
};

const s = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:       { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:         { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  autoBtn:     { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' },
  bulkBtn:     { background: '#fff', color: '#0891b2', border: '1.5px solid #0891b2', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  infoBox:     { display: 'flex', gap: 8, alignItems: 'flex-start', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 14 },
  banner:      { borderRadius: 10, padding: '12px 18px', marginBottom: 14, border: '1px solid', fontSize: '0.88rem' },
  bannerGreen: { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' },
  bannerRed:   { background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' },
  dismissBtn:  { background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', marginLeft: 'auto', fontSize: '0.9rem' },
  detailsBtn:  { background: 'rgba(255,255,255,0.6)', border: '1px solid #bbf7d0', borderRadius: 5, padding: '3px 10px', fontSize: '0.78rem', cursor: 'pointer', color: '#065f46' },
  detailsBox:  { marginTop: 10, borderTop: '1px solid #bbf7d0', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 },
  detailRow:   { display: 'flex', gap: 8, fontSize: '0.78rem', flexWrap: 'wrap' },
  summaryRow:  { display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' },
  card:        (bg, border, color) => ({ flex: 1, minWidth: 140, background: bg, border: `1px solid ${border}50`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, color }),
  progressBg:  { width: '100%', height: 8, background: '#e0e7ff', borderRadius: 99, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  filterRow:   { display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  tabs:        { display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', flexWrap: 'wrap' },
  tab:         { padding: '9px 14px', border: 'none', background: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  tabActive:   { background: '#4f46e5', color: '#fff' },
  search:      { padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none', minWidth: 200 },
  select:      { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', outline: 'none', background: '#fff' },
  loading:     { textAlign: 'center', padding: 60, color: '#9ca3af' },
  empty:       { textAlign: 'center', padding: 60, color: '#059669', background: '#f0fdf4', borderRadius: 12, fontSize: '1rem', fontWeight: 600 },
  tableWrap:   { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { background: '#f8fafc' },
  th:          { padding: '11px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #e5e7eb' },
  hint:        { fontWeight: 400, textTransform: 'none', color: '#9ca3af', fontSize: '0.7rem' },
  td:          { padding: '10px 14px', fontSize: '0.85rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  nameCell:    { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:      { width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 },
  classBadge:  { background: '#f3f4f6', color: '#374151', padding: '3px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 },
  inlineSelect:{ display: 'flex', alignItems: 'center', gap: 6 },
  dropdown:    { padding: '6px 10px', border: '1.5px solid', borderRadius: 7, fontSize: '0.82rem', outline: 'none', cursor: 'pointer', maxWidth: 220, width: '100%' },
  chip:        (bg, color) => ({ background: bg, color, padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }),
  tableFooter: { padding: '10px 16px', fontSize: '0.78rem', color: '#9ca3af', borderTop: '1px solid #f3f4f6' },
};

export default LinkManagement;
