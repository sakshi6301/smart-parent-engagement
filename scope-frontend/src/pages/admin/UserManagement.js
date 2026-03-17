import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import api from '../../services/api';

const ROLES = ['all', 'teacher', 'parent', 'student'];

const roleColor = { teacher: '#0891b2', parent: '#059669', student: '#d97706', admin: '#7c3aed' };
const roleBg    = { teacher: '#ecfeff',  parent: '#f0fdf4',  student: '#fffbeb',  admin: '#f5f3ff' };

const UserManagement = () => {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('all');
  const [actionMsg, setMsg]     = useState('');

  const [sending, setSending]   = useState({});
  const [sendingAll, setSendingAll] = useState(false);
  const [sendProgress, setSendProgress] = useState({ done: 0, total: 0 });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const roles = ['teacher', 'parent', 'student'];
      const results = await Promise.all(roles.map(r => api.get(`/students/users/${r}`)));
      setUsers(results.flatMap((r, i) => r.data.map(u => ({ ...u, role: roles[i] }))));
    } catch (err) {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const flash = (msg) => { setMsg(msg); setTimeout(() => setMsg(''), 3000); };

  const toggleActive = async (user) => {
    try {
      await api.put(`/auth/admin/toggle-active/${user._id}`);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
      flash(`${user.name} ${user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      flash('Failed to update user status');
    }
  };

  const resetPassword = async (user) => {
    if (!window.confirm(`Reset password for ${user.name} to "Welcome@123"?`)) return;
    try {
      await api.put(`/auth/admin/reset-password/${user._id}`);
      flash(`Password reset for ${user.name}. New password: Welcome@123`);
    } catch (err) {
      flash('Failed to reset password');
    }
  };

  const sendCredentials = async (user) => {
    setSending(prev => ({ ...prev, [user._id]: true }));
    try {
      const { data } = await api.post(`/auth/admin/send-credentials/${user._id}`);
      flash(`✅ ${data.message}`);
    } catch (err) {
      flash(`❌ ${err.response?.data?.message || 'Failed to send email'}`);
    }
    setSending(prev => ({ ...prev, [user._id]: false }));
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const sendToAll = async () => {
    const eligible = filtered.filter(u => u.email && !u.email.endsWith('@scope.internal'));
    if (!eligible.length) return flash('❌ No users with valid emails in current view.');
    if (!window.confirm(`Send login credentials to ${eligible.length} users? Emails will be sent one at a time with a delay to avoid Gmail limits.`)) return;
    setSendingAll(true);
    setSendProgress({ done: 0, total: eligible.length });
    let success = 0, failed = 0;
    for (const user of eligible) {
      try {
        await api.post(`/auth/admin/send-credentials/${user._id}`);
        success++;
      } catch (err) {
        failed++;
      }
      setSendProgress(p => ({ ...p, done: p.done + 1 }));
      await sleep(2000); // 2s delay between emails to avoid Gmail rate limit
    }
    setSendingAll(false);
    setSendProgress({ done: 0, total: 0 });
    flash(`✅ Sent: ${success} | ❌ Failed: ${failed}`);
  };

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search);
    return matchRole && matchSearch;
  });

  const counts = ROLES.reduce((acc, r) => {
    acc[r] = r === 'all' ? users.length : users.filter(u => u.role === r).length;
    return acc;
  }, {});

  const columns = [
    {
      key: 'name', label: 'User',
      render: r => (
        <div style={s.nameCell}>
          <div style={{ ...s.avatar, background: roleBg[r.role], color: roleColor[r.role] }}>
            {r.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#111827' }}>{r.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{r.email}</div>
          </div>
        </div>
      )
    },
    { key: 'phone', label: 'Phone', render: r => r.phone || <span style={{ color: '#d1d5db' }}>—</span> },
    {
      key: 'role', label: 'Role',
      render: r => (
        <span style={{ ...s.rolePill, background: roleBg[r.role], color: roleColor[r.role] }}>
          {r.role.charAt(0).toUpperCase() + r.role.slice(1)}
        </span>
      )
    },
    { key: 'isActive', label: 'Status', render: r => <Badge label={r.isActive ? 'Active' : 'Inactive'} type={r.isActive ? 'success' : 'danger'} /> },
    { key: 'createdAt', label: 'Joined', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div style={s.actions}>
          <button
            style={{ ...s.actionBtn, background: r.isActive ? '#fef2f2' : '#f0fdf4', color: r.isActive ? '#b91c1c' : '#15803d', border: r.isActive ? '1px solid #fecaca' : '1px solid #bbf7d0' }}
            onClick={() => toggleActive(r)}
          >
            {r.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            style={{ ...s.actionBtn, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
            onClick={() => resetPassword(r)}
          >
            Reset Pwd
          </button>
          <button
            style={{ ...s.actionBtn, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
            onClick={() => sendCredentials(r)}
            disabled={sending[r._id]}
          >
            {sending[r._id] ? 'Sending...' : '📧 Send Login'}
          </button>
        </div>
      )
    },
  ];

  return (
    <AppLayout>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>User Management</h2>
          <p style={s.sub}>View, activate/deactivate, reset passwords and send login credentials</p>
        </div>
        <button onClick={sendToAll} disabled={sendingAll} style={{ ...s.sendAllBtn, opacity: sendingAll ? 0.7 : 1 }}>
          {sendingAll ? `📧 Sending ${sendProgress.done}/${sendProgress.total}...` : '📧 Send Credentials to All'}
        </button>
      </div>

      {actionMsg && <div style={s.flashMsg}>{actionMsg}</div>}

      {/* Role filter tabs */}
      <div style={s.tabs}>
        {ROLES.map(r => (
          <button key={r} onClick={() => setRole(r)}
            style={{ ...s.tab, ...(roleFilter === r ? s.tabActive : {}) }}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
            <span style={s.tabCount}>{counts[r]}</span>
          </button>
        ))}
      </div>

      <div style={s.toolbar}>
        <input style={s.search} placeholder="🔍  Search by name, email or phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <span style={s.count}>{filtered.length} users</span>
      </div>

      {loading
        ? <div style={s.loading}>Loading users...</div>
        : <DataTable columns={columns} data={filtered} emptyMsg="No users found." />
      }
    </AppLayout>
  );
};

const s = {
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:     { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:       { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  flashMsg:  { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem' },
  tabs:      { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  tab:       { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  tabActive: { background: '#4f46e5', color: '#fff', borderColor: '#4f46e5' },
  tabCount:  { background: 'rgba(255,255,255,0.25)', padding: '1px 7px', borderRadius: 10, fontSize: '0.75rem' },
  toolbar:   { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  search:    { flex: 1, padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', background: '#fff', outline: 'none' },
  count:     { fontSize: '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' },
  loading:   { textAlign: 'center', padding: '60px', color: '#9ca3af' },
  nameCell:  { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:    { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  rolePill:  { padding: '3px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600 },
  actions:   { display: 'flex', gap: 6 },
  actionBtn:  { padding: '5px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  sendAllBtn: { background: '#1d4ed8', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' },
};

export default UserManagement;
