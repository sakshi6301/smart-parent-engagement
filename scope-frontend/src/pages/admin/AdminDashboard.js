import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend
} from 'chart.js';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/StatCard';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [sendingDigest, setSendingDigest] = useState(false);
  const [digestMsg, setDigestMsg] = useState('');

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/analytics/dashboard')
      .then(({ data }) => { setStats(data); setLoading(false); })
      .catch(() => { setError('Failed to load dashboard data. Make sure the backend is running.'); setLoading(false); });
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSendDigest = async () => {
    if (!window.confirm('Send weekly progress digest email to all linked parents now?')) return;
    setSendingDigest(true);
    try {
      const { data } = await api.post('/admin/send-weekly-digest');
      setDigestMsg('✅ ' + data.message);
    } catch {
      setDigestMsg('❌ Failed to trigger digest. Check server logs.');
    }
    setSendingDigest(false);
    setTimeout(() => setDigestMsg(''), 6000);
  };

  const handleReset = async () => {
    if (!window.confirm('⚠️ This will DELETE all students and non-admin users. Are you sure?')) return;
    setResetting(true);
    try {
      const { data } = await api.delete('/dev/reset-data');
      setResetMsg('✅ ' + data.message);
      setTimeout(() => { setResetMsg(''); fetchStats(); }, 2000);
    } catch (err) {
      setResetMsg('❌ ' + (err.response?.data?.message || 'Reset failed'));
    }
    setResetting(false);
  };

  if (loading) return (
    <AppLayout>
      <div style={s.center}><div style={s.spinner} /> Loading dashboard...</div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout>
      <div style={s.errorBox}>
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <div>
          <p style={{ fontWeight: 700, margin: 0 }}>Dashboard Error</p>
          <p style={{ margin: '4px 0 12px', fontSize: '0.88rem' }}>{error}</p>
          <button onClick={fetchStats} style={s.retryBtn}>🔄 Retry</button>
        </div>
      </div>
    </AppLayout>
  );

  // ── Attendance ──
  const attMap = {};
  (stats.todayAttendance || []).forEach(a => { attMap[a._id] = a.count; });
  const totalToday = (attMap.present || 0) + (attMap.absent || 0) + (attMap.late || 0);
  const attPct = totalToday ? Math.round((attMap.present || 0) / totalToday * 100) : 0;

  // ── Gender ──
  const genderMap = {};
  (stats.genderStats || []).forEach(g => { genderMap[g._id] = g.count; });

  // ── Charts ──
  const gradeChartData = {
    labels: stats.gradeStats?.length ? stats.gradeStats.map(g => g._id) : ['No Data'],
    datasets: [{
      label: 'Avg Score (%)',
      data: stats.gradeStats?.length ? stats.gradeStats.map(g => +g.avgScore.toFixed(1)) : [0],
      backgroundColor: stats.gradeStats?.length
        ? stats.gradeStats.map(g => g.avgScore < 50 ? '#ef4444' : g.avgScore < 70 ? '#f59e0b' : '#10b981')
        : ['#e5e7eb'],
      borderRadius: 6,
    }]
  };

  const attendanceChartData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      data: [attMap.present || 0, attMap.absent || 0, attMap.late || 0],
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
      borderWidth: 0,
    }]
  };

  const classChartData = {
    labels: stats.classStats?.length ? stats.classStats.map(c => `Class ${c._id}`) : ['No Data'],
    datasets: [{
      label: 'Students',
      data: stats.classStats?.length ? stats.classStats.map(c => c.count) : [0],
      backgroundColor: '#6366f1',
      borderRadius: 6,
    }]
  };

  const monthlyLabels = (stats.monthlyAttendance || []).map(m => MONTHS[m._id.month - 1]);
  const monthlyData   = (stats.monthlyAttendance || []).map(m => m.count);
  const trendChartData = {
    labels: monthlyLabels.length ? monthlyLabels : ['No Data'],
    datasets: [{
      label: 'Present Count',
      data: monthlyData.length ? monthlyData : [0],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#6366f1',
    }]
  };

  const chartOpts = (max) => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ...(max ? { max } : {}) } }
  });

  return (
    <AppLayout>
      {resetMsg && (
        <div style={{ ...s.banner, background: resetMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', borderColor: resetMsg.startsWith('✅') ? '#bbf7d0' : '#fecaca', color: resetMsg.startsWith('✅') ? '#15803d' : '#b91c1c' }}>
          {resetMsg}
        </div>
      )}
      {digestMsg && (
        <div style={{ ...s.banner, background: digestMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', borderColor: digestMsg.startsWith('✅') ? '#bbf7d0' : '#fecaca', color: digestMsg.startsWith('✅') ? '#15803d' : '#b91c1c' }}>
          {digestMsg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Admin Dashboard</h2>
          <p style={s.pageSub}>Welcome back! Here's what's happening at your school today.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSendDigest} disabled={sendingDigest} style={s.digestBtn}>
            {sendingDigest ? '📤 Sending...' : '📧 Send Weekly Digest'}
          </button>
          <button onClick={fetchStats} style={s.refreshBtn}>🔄 Refresh</button>
        </div>
      </div>

      {/* ── Link Alerts ── */}
      {(stats.unlinkedParent > 0 || stats.unlinkedTeacher > 0) && (
        <div style={s.alertRow}>
          {stats.unlinkedParent > 0 && (
            <div style={s.alertCard}>
              <span style={{ fontSize: '1.3rem' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <strong>{stats.unlinkedParent} students</strong> have no parent linked
              </div>
              <button onClick={() => navigate('/admin/link-management')} style={s.alertBtn}>Fix Now →</button>
            </div>
          )}
          {stats.unlinkedTeacher > 0 && (
            <div style={{ ...s.alertCard, background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
              <span style={{ fontSize: '1.3rem' }}>👨🏫</span>
              <div style={{ flex: 1 }}>
                <strong>{stats.unlinkedTeacher} students</strong> have no teacher assigned
              </div>
              <button onClick={() => navigate('/admin/link-management')} style={{ ...s.alertBtn, background: '#1d4ed8' }}>Fix Now →</button>
            </div>
          )}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={s.statsRow}>
        <StatCard title="Total Students"     value={stats.totalStudents}  icon="🎓" color="blue"   subtitle="Active enrollments" />
        <StatCard title="Teachers"           value={stats.totalTeachers}  icon="👨🏫" color="purple" subtitle="Active faculty" />
        <StatCard title="Parents"            value={stats.totalParents}   icon="👨👩👧" color="green"  subtitle="Registered parents" />
        <StatCard title="Today's Attendance" value={totalToday ? `${attPct}%` : 'N/A'} icon="✅" color={attPct < 75 && totalToday ? 'red' : 'cyan'} subtitle={totalToday ? `${attMap.present || 0} present of ${totalToday}` : 'No attendance marked today'} />
        <StatCard title="Pending Meetings"   value={stats.pendingMeetings || 0} icon="📅" color="yellow" subtitle="Awaiting confirmation" />
        <StatCard title="Total Homework"     value={stats.totalHomework || 0} icon="📚" color="orange" subtitle={`${stats.overdueHomework || 0} overdue`} />
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={s.row}>
        {/* Subject Performance */}
        <div style={{ ...s.card, flex: 2 }}>
          <div style={s.cardHeader}>
            <div>
              <p style={s.cardTitle}>📊 Subject-wise Performance</p>
              <p style={s.cardSub}>Average scores across all subjects</p>
            </div>
            <button onClick={() => navigate('/admin/students')} style={s.linkBtn}>View Grades →</button>
          </div>
          {stats.gradeStats?.length
            ? <Bar data={gradeChartData} options={chartOpts(100)} />
            : <div style={s.emptyChart}>No grade data yet. Teachers need to upload grades first.</div>
          }
        </div>

        {/* Today Attendance Doughnut */}
        <div style={{ ...s.card, flex: 1, minWidth: 240 }}>
          <p style={s.cardTitle}>✅ Today's Attendance</p>
          <p style={s.cardSub}>{totalToday ? `${totalToday} students marked` : 'Not marked yet'}</p>
          {totalToday
            ? <>
                <Doughnut data={attendanceChartData} options={{ responsive: true, cutout: '65%', plugins: { legend: { display: false } } }} />
                <div style={s.legend}>
                  {[['Present','#10b981', attMap.present||0],['Absent','#ef4444',attMap.absent||0],['Late','#f59e0b',attMap.late||0]].map(([l,c,v]) => (
                    <div key={l} style={s.legendItem}><span style={{ ...s.dot, background: c }} />{l}: <strong>{v}</strong></div>
                  ))}
                </div>
              </>
            : <div style={s.emptyChart}>No attendance marked today.</div>
          }
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={s.row}>
        {/* Class-wise Students */}
        <div style={{ ...s.card, flex: 1 }}>
          <p style={s.cardTitle}>🏫 Class-wise Students</p>
          <p style={s.cardSub}>Student distribution per class</p>
          {stats.classStats?.length
            ? <Bar data={classChartData} options={chartOpts()} />
            : <div style={s.emptyChart}>No students imported yet.</div>
          }
        </div>

        {/* Monthly Attendance Trend */}
        <div style={{ ...s.card, flex: 2 }}>
          <p style={s.cardTitle}>📈 Monthly Attendance Trend</p>
          <p style={s.cardSub}>Present count over last 6 months</p>
          {monthlyData.length
            ? <Line data={trendChartData} options={chartOpts()} />
            : <div style={s.emptyChart}>No attendance history yet.</div>
          }
        </div>
      </div>

      {/* ── Teacher Workload ── */}
      {stats.teacherStats?.length > 0 && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={s.cardHeader}>
            <div>
              <p style={s.cardTitle}>👨🏫 Teacher Workload</p>
              <p style={s.cardSub}>Students assigned per teacher</p>
            </div>
            <button onClick={() => navigate('/admin/teachers')} style={s.linkBtn}>Manage Teachers →</button>
          </div>
          <div style={s.teacherGrid}>
            {stats.teacherStats.map(t => (
              <div key={t._id} style={s.teacherCard}>
                <div style={s.teacherAvatar}>{t.teacher.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.teacher.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{t.teacher.email}</div>
                </div>
                <div style={s.teacherCount}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#4f46e5' }}>{t.studentCount}</span>
                  <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>students</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's Absent Students ── */}
      {stats.todayAbsent?.length > 0 && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={s.cardHeader}>
            <div>
              <p style={s.cardTitle}>🔴 Today's Absent Students</p>
              <p style={s.cardSub}>{stats.todayAbsent.length} student{stats.todayAbsent.length !== 1 ? 's' : ''} marked absent today</p>
            </div>
            <button onClick={() => navigate('/admin/students')} style={s.linkBtn}>View All Students →</button>
          </div>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['Student', 'Roll No', 'Class', 'Parent', 'Parent Contact', 'Teacher'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.todayAbsent.map((a, i) => (
                <tr key={a._id} style={{ background: i % 2 === 0 ? '#fff' : '#fef2f2' }}>
                  <td style={s.td}>
                    <div style={s.nameCell}>
                      <div style={{ ...s.avatar, background: '#fee2e2', color: '#dc2626' }}>{a.student?.name?.[0] || '?'}</div>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a.student?.name || '—'}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{a.student?.rollNumber || '—'}</span></td>
                  <td style={s.td}>{a.student?.class ? `${a.student.class} - ${a.student.section}` : '—'}</td>
                  <td style={s.td}>{a.student?.parent?.name || <span style={{ color: '#d1d5db' }}>No parent</span>}</td>
                  <td style={s.td}><span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{a.student?.parent?.phone || a.student?.parent?.email || <span style={{ color: '#d1d5db' }}>—</span>}</span></td>
                  <td style={s.td}>{a.student?.teacher?.name || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pending Meetings ── */}
      {stats.pendingMeetingsList?.length > 0 && (
        <div style={{ ...s.card, marginBottom: 16 }}>
          <div style={s.cardHeader}>
            <div>
              <p style={s.cardTitle}>📅 Pending Meeting Requests</p>
              <p style={s.cardSub}>{stats.pendingMeetings} total pending — showing latest {stats.pendingMeetingsList.length}</p>
            </div>
            <button onClick={() => navigate('/admin/meetings')} style={{ ...s.linkBtn, background: '#fffbeb', color: '#92400e' }}>View All →</button>
          </div>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                {['Parent', 'Student', 'Teacher', 'Reason', 'Requested On'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.pendingMeetingsList.map((m, i) => (
                <tr key={m._id} style={{ background: i % 2 === 0 ? '#fff' : '#fffbeb' }}>
                  <td style={s.td}>
                    <div style={s.nameCell}>
                      <div style={{ ...s.avatar, background: '#fef3c7', color: '#d97706' }}>{m.parent?.name?.[0] || '?'}</div>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.parent?.name || '—'}</span>
                    </div>
                  </td>
                  <td style={s.td}>{m.student?.name || '—'}</td>
                  <td style={s.td}>{m.teacher?.name || '—'}</td>
                  <td style={s.td}><span style={{ fontSize: '0.82rem', color: '#374151' }}>{m.reason || '—'}</span></td>
                  <td style={s.td}><span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(m.createdAt).toLocaleDateString('en-IN')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Bottom Row ── */}
      <div style={s.row}>
        {/* Recent Students */}
        <div style={{ ...s.card, flex: 2 }}>
          <div style={s.cardHeader}>
            <div>
              <p style={s.cardTitle}>🎓 Recently Added Students</p>
              <p style={s.cardSub}>Last 5 students enrolled</p>
            </div>
            <button onClick={() => navigate('/admin/students')} style={s.linkBtn}>View All →</button>
          </div>
          {stats.recentStudents?.length ? (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  {['Student','Class','Parent','Teacher','Joined'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentStudents.map((st, i) => (
                  <tr key={st._id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <div style={s.avatar}>{st.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{st.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{st.rollNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>{st.class} - {st.section}</td>
                    <td style={s.td}>{st.parent?.name || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={s.td}>{st.teacher?.name || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={s.td}>{new Date(st.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={s.emptyChart}>No students yet. Use Bulk Import to add students.</div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 240 }}>

          {/* Gender Split */}
          <div style={s.card}>
            <p style={s.cardTitle}>👥 Gender Distribution</p>
            <p style={s.cardSub}>Across all students</p>
            <div style={s.genderRow}>
              {[['Male','#3b82f6','#eff6ff', genderMap.male||0],['Female','#ec4899','#fdf2f8',genderMap.female||0],['Other','#8b5cf6','#f5f3ff',genderMap.other||0]].map(([l,c,bg,v]) => (
                <div key={l} style={{ ...s.genderBox, background: bg, borderColor: c }}>
                  <span style={{ fontSize: '1.4rem' }}>{l === 'Male' ? '👦' : l === 'Female' ? '👧' : '🧑'}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.3rem', color: c }}>{v}</span>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={s.card}>
            <p style={s.cardTitle}>⚡ Quick Actions</p>
            <div style={s.actionGrid}>
              {[
                { label: 'Link Mgmt',  icon: '🔗', path: '/admin/link-management', color: '#fefce8', border: '#fef08a', text: '#713f12' },
                { label: 'Students',    icon: '🎓', path: '/admin/students',    color: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
                { label: 'Teachers',    icon: '👨🏫', path: '/admin/teachers',    color: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' },
                { label: 'Parents',     icon: '👨👩👧', path: '/admin/parents',     color: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
                { label: 'Bulk Import', icon: '📥', path: '/admin/bulk-import', color: '#fffbeb', border: '#fde68a', text: '#92400e' },
                { label: 'Users',       icon: '👥', path: '/admin/users',       color: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.path)}
                  style={{ ...s.actionBtn, background: a.color, borderColor: a.border, color: a.text }}>
                  <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dev Reset — only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ ...s.card, background: '#fef2f2', border: '1px solid #fecaca' }}>
              <p style={{ ...s.cardTitle, color: '#b91c1c' }}>Dev Tools</p>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 10 }}>Reset all students and users (dev only)</p>
              <button onClick={handleReset} disabled={resetting}
                style={{ width: '100%', padding: '9px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                {resetting ? 'Deleting...' : 'Reset All Data'}
              </button>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
};

const s = {
  center:     { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#6b7280', fontSize: '0.95rem' },
  spinner:    { width: 22, height: 22, border: '3px solid #e5e7eb', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 },
  errorBox:   { display: 'flex', gap: 16, alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '24px', margin: '40px auto', maxWidth: 500 },
  retryBtn:   { background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' },
  banner:     { border: '1px solid', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: '0.88rem' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle:  { fontSize: '1.3rem', fontWeight: 800, color: '#111827', margin: 0 },
  pageSub:    { fontSize: '0.82rem', color: '#9ca3af', marginTop: 3 },
  refreshBtn: { background: '#fff', border: '1.5px solid #e5e7eb', color: '#374151', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  digestBtn:  { background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  alertRow:   { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  alertCard:   { flex: 1, minWidth: 260, display: 'flex', alignItems: 'center', gap: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', color: '#92400e', fontSize: '0.85rem' },
  alertBtn:    { background: '#d97706', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  statsRow:   { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  row:        { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  card:       { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minWidth: 240 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle:  { fontSize: '0.92rem', fontWeight: 700, color: '#111827', margin: '0 0 2px' },
  cardSub:    { fontSize: '0.75rem', color: '#9ca3af', margin: 0 },
  linkBtn:    { background: '#f5f3ff', color: '#6d28d9', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  emptyChart: { textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '0.85rem', background: '#f9fafb', borderRadius: 8 },
  legend:     { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#374151' },
  dot:        { width: 9, height: 9, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  table:      { width: '100%', borderCollapse: 'collapse', marginTop: 8 },
  thead:      { background: '#f8fafc' },
  th:         { padding: '9px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' },
  td:         { padding: '10px 12px', fontSize: '0.83rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  nameCell:   { display: 'flex', alignItems: 'center', gap: 8 },
  avatar:     { width: 30, height: 30, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 },
  genderRow:  { display: 'flex', gap: 10, marginTop: 8 },
  genderBox:  { flex: 1, border: '2px solid', borderRadius: 10, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 },
  actionBtn:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', border: '1.5px solid', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  teacherGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginTop: 4 },
  teacherCard: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' },
  teacherAvatar: { width: 38, height: 38, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  teacherCount: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: 8, padding: '6px 12px', border: '1px solid #e5e7eb' },
};

export default AdminDashboard;
