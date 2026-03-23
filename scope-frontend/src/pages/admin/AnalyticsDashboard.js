import React, { useEffect, useState, useCallback } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend
} from 'chart.js';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatBox = ({ label, value, color }) => (
  <div style={{ ...S.statBox, borderTop: `4px solid ${color}` }}>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{label}</div>
  </div>
);

const AnalyticsDashboard = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(() => {
    setLoading(true); setError('');
    api.get('/analytics/dashboard')
      .then(({ data }) => { setStats(data); setLoading(false); })
      .catch(() => { setError('Failed to load analytics.'); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <AppLayout><div style={S.center}>Loading analytics...</div></AppLayout>;
  if (error)   return <AppLayout><div style={S.errorBox}>{error} <button onClick={load} style={S.retryBtn}>Retry</button></div></AppLayout>;

  const attMap = {};
  (stats.todayAttendance || []).forEach(a => { attMap[a._id] = a.count; });
  const totalToday = (attMap.present || 0) + (attMap.absent || 0) + (attMap.late || 0);
  const attPct = totalToday ? Math.round((attMap.present || 0) / totalToday * 100) : 0;

  const genderMap = {};
  (stats.genderStats || []).forEach(g => { genderMap[g._id] = g.count; });

  const linkedPct = stats.totalStudents
    ? Math.round(((stats.totalStudents - stats.unlinkedParent) / stats.totalStudents) * 100)
    : 0;

  const gradeChart = {
    labels: stats.gradeStats?.map(g => g._id) || [],
    datasets: [{
      label: 'Avg Score %',
      data: stats.gradeStats?.map(g => +g.avgScore.toFixed(1)) || [],
      backgroundColor: stats.gradeStats?.map(g =>
        g.avgScore < 50 ? '#ef4444' : g.avgScore < 70 ? '#f59e0b' : '#10b981'
      ) || [],
      borderRadius: 6,
    }]
  };

  const attChart = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{ data: [attMap.present||0, attMap.absent||0, attMap.late||0], backgroundColor: ['#10b981','#ef4444','#f59e0b'], borderWidth: 0 }]
  };

  const genderChart = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [{ data: [genderMap.male||0, genderMap.female||0, genderMap.other||0], backgroundColor: ['#3b82f6','#ec4899','#8b5cf6'], borderWidth: 0 }]
  };

  const classChart = {
    labels: stats.classStats?.map(c => `Class ${c._id}`) || [],
    datasets: [{ label: 'Students', data: stats.classStats?.map(c => c.count) || [], backgroundColor: '#6366f1', borderRadius: 6 }]
  };

  const trendChart = {
    labels: (stats.monthlyAttendance || []).map(m => MONTHS[m._id.month - 1]),
    datasets: [{
      label: 'Present Count',
      data: (stats.monthlyAttendance || []).map(m => m.count),
      borderColor: '#4f46e5', backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.4, fill: true, pointBackgroundColor: '#4f46e5',
    }]
  };

  const chartOpts = (max) => ({ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ...(max ? { max } : {}) } } });
  const doughnutOpts = { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } };

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Analytics Dashboard</h2>
          <p style={S.sub}>School-wide performance and engagement overview</p>
        </div>
        <button onClick={load} style={S.refreshBtn}>Refresh</button>
      </div>

      <div style={S.statRow}>
        <StatBox label="Total Students"   value={stats.totalStudents}  color="#4f46e5" />
        <StatBox label="Teachers"         value={stats.totalTeachers}  color="#0891b2" />
        <StatBox label="Parents"          value={stats.totalParents}   color="#059669" />
        <StatBox label="Today Attendance" value={totalToday ? `${attPct}%` : 'N/A'} color={attPct < 75 && totalToday ? '#ef4444' : '#10b981'} />
        <StatBox label="Parent Linked"    value={`${linkedPct}%`}      color="#7c3aed" />
        <StatBox label="Unlinked Students" value={stats.unlinkedParent} color="#f59e0b" />
      </div>

      <div style={S.row}>
        <div style={{ ...S.card, flex: 2 }}>
          <p style={S.cardTitle}>Subject-wise Average Performance</p>
          <p style={S.cardSub}>Average score % per subject across all students</p>
          {stats.gradeStats?.length
            ? <Bar data={gradeChart} options={chartOpts(100)} />
            : <div style={S.empty}>No grade data yet.</div>}
        </div>
        <div style={{ ...S.card, flex: 1, minWidth: 220 }}>
          <p style={S.cardTitle}>Today's Attendance</p>
          <p style={S.cardSub}>{totalToday ? `${totalToday} students marked` : 'Not marked yet'}</p>
          {totalToday
            ? <Doughnut data={attChart} options={doughnutOpts} />
            : <div style={S.empty}>No attendance today.</div>}
          {totalToday > 0 && (
            <div style={S.legend}>
              {[['Present','#10b981',attMap.present||0],['Absent','#ef4444',attMap.absent||0],['Late','#f59e0b',attMap.late||0]].map(([l,c,v]) => (
                <div key={l} style={S.legendItem}><span style={{ ...S.dot, background: c }} />{l}: <strong>{v}</strong></div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={S.row}>
        <div style={{ ...S.card, flex: 2 }}>
          <p style={S.cardTitle}>Monthly Attendance Trend</p>
          <p style={S.cardSub}>Present count over last 6 months</p>
          {stats.monthlyAttendance?.length
            ? <Line data={trendChart} options={chartOpts()} />
            : <div style={S.empty}>No attendance history yet.</div>}
        </div>
        <div style={{ ...S.card, flex: 1, minWidth: 220 }}>
          <p style={S.cardTitle}>Class-wise Students</p>
          <p style={S.cardSub}>Student count per class</p>
          {stats.classStats?.length
            ? <Bar data={classChart} options={chartOpts()} />
            : <div style={S.empty}>No students yet.</div>}
        </div>
      </div>

      <div style={S.row}>
        <div style={{ ...S.card, flex: 1, minWidth: 220 }}>
          <p style={S.cardTitle}>Gender Distribution</p>
          <p style={S.cardSub}>Across all active students</p>
          <Doughnut data={genderChart} options={doughnutOpts} />
        </div>

        <div style={{ ...S.card, flex: 1, minWidth: 220 }}>
          <p style={S.cardTitle}>Parent Link Status</p>
          <p style={S.cardSub}>How many students have parents linked</p>
          <div style={S.progressSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.85rem', color: '#374151' }}>Linked</span>
              <span style={{ fontWeight: 700, color: '#4f46e5' }}>{linkedPct}%</span>
            </div>
            <div style={S.progressBg}>
              <div style={{ ...S.progressFill, width: `${linkedPct}%`, background: linkedPct === 100 ? '#10b981' : '#4f46e5' }} />
            </div>
            <div style={S.linkStats}>
              <div style={S.linkStat('#f0fdf4','#059669')}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{stats.totalStudents - stats.unlinkedParent}</span>
                <span style={{ fontSize: '0.75rem' }}>Linked</span>
              </div>
              <div style={S.linkStat('#fef3c7','#d97706')}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{stats.unlinkedParent}</span>
                <span style={{ fontSize: '0.75rem' }}>Unlinked</span>
              </div>
              <div style={S.linkStat('#fef2f2','#ef4444')}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{stats.unlinkedTeacher}</span>
                <span style={{ fontSize: '0.75rem' }}>No Teacher</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...S.card, flex: 2 }}>
          <p style={S.cardTitle}>Recently Added Students</p>
          <p style={S.cardSub}>Last 5 enrolled students</p>
          {stats.recentStudents?.length ? (
            <table style={S.table}>
              <thead>
                <tr style={S.thead}>
                  {['Student','Class','Parent','Teacher','Joined'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {stats.recentStudents.map((st, i) => (
                  <tr key={st._id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={S.avatar}>{st.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{st.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{st.rollNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>{st.class}-{st.section}</td>
                    <td style={S.td}>{st.parent?.name || <span style={{ color: '#f59e0b' }}>None</span>}</td>
                    <td style={S.td}>{st.teacher?.name || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={S.td}>{new Date(st.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={S.empty}>No students yet.</div>}
        </div>
      </div>
    </AppLayout>
  );
};

const S = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:        { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:          { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  refreshBtn:   { background: '#fff', border: '1.5px solid #e5e7eb', color: '#374151', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  center:       { textAlign: 'center', padding: 60, color: '#9ca3af' },
  errorBox:     { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 20, borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center' },
  retryBtn:     { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  statRow:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginBottom: 20 },
  statBox:      { background: '#fff', borderRadius: 12, padding: '18px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' },
  row:          { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  card:         { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minWidth: 240 },
  cardTitle:    { fontSize: '0.92rem', fontWeight: 700, color: '#111827', margin: '0 0 2px' },
  cardSub:      { fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 16px' },
  empty:        { textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '0.85rem', background: '#f9fafb', borderRadius: 8 },
  legend:       { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  legendItem:   { display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#374151' },
  dot:          { width: 9, height: 9, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  progressSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  progressBg:   { height: 10, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  linkStats:    { display: 'flex', gap: 10, marginTop: 8 },
  linkStat:     (bg, color) => ({ flex: 1, background: bg, borderRadius: 8, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color }),
  table:        { width: '100%', borderCollapse: 'collapse' },
  thead:        { background: '#f8fafc' },
  th:           { padding: '9px 12px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' },
  td:           { padding: '10px 12px', fontSize: '0.83rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  avatar:       { width: 30, height: 30, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 },
};

export default AnalyticsDashboard;
