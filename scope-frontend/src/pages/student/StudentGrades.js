import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/Badge';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const pct   = (g) => +((g.marksObtained / g.totalMarks) * 100).toFixed(1);
const grade = (p) => p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'F';
const color = (p) => p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444';

const StudentGrades = () => {
  const { t } = useTranslation();
  const [student, setStudent] = useState(null);
  const [grades, setGrades]   = useState([]);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    api.get('/students').then(({ data }) => {
      if (data.length === 0) return;
      setStudent(data[0]);
      api.get(`/grades/${data[0]._id}`).then(r => setGrades(r.data.grades || [])).catch(() => {});
    }).catch(() => {});
  }, []);

  if (!student) return (
    <AppLayout>
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎓</div>
        <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>Student profile not linked</p>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>Contact your school admin to link your account.</p>
      </div>
    </AppLayout>
  );

  const subjects = [...new Set(grades.map(g => g.subject))];
  const filtered = filter === 'all' ? grades : grades.filter(g => g.subject === filter);

  const subjectAvg = {};
  subjects.forEach(sub => {
    const sg = grades.filter(g => g.subject === sub);
    subjectAvg[sub] = +(sg.reduce((a, g) => a + pct(g), 0) / sg.length).toFixed(1);
  });

  const overall = grades.length ? +(grades.reduce((a, g) => a + pct(g), 0) / grades.length).toFixed(1) : 0;

  return (
    <AppLayout>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>{t('myGrades')}</h2>
          <p style={S.sub}>{student?.name} · {t('class')} {student?.class}-{student?.section}</p>
        </div>
        <div style={{ ...S.overallBadge, background: color(overall) + '20', color: color(overall) }}>
          {t('average')}: <strong>{overall}% · {grade(overall)}</strong>
        </div>
      </div>

      <div style={S.subjectRow}>
        {subjects.map(sub => (
          <div key={sub} onClick={() => setFilter(filter === sub ? 'all' : sub)}
            style={{ ...S.subjectCard, borderTop: `3px solid ${color(subjectAvg[sub])}`, opacity: filter !== 'all' && filter !== sub ? 0.5 : 1, cursor: 'pointer' }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151' }}>{sub}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color(subjectAvg[sub]) }}>{subjectAvg[sub]}%</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{grade(subjectAvg[sub])}</div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        {filtered.length === 0 ? (
          <div style={S.empty}>{t('noData')}</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr style={S.thead}>
                {[t('subject'), t('examType'), t('marksObtained'), t('score'), 'Grade', t('date')].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => {
                const p = pct(g);
                return (
                  <tr key={g._id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={S.td}><span style={S.subTag}>{g.subject}</span></td>
                    <td style={S.td}><Badge label={g.examType.replace('_',' ')} type="info" /></td>
                    <td style={S.td}><strong>{g.marksObtained}</strong>/{g.totalMarks}</td>
                    <td style={S.td}>
                      <div style={S.scoreBar}>
                        <div style={{ ...S.scoreBarFill, width: `${p}%`, background: color(p) }} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: color(p), marginLeft: 6 }}>{p}%</span>
                      </div>
                    </td>
                    <td style={S.td}><span style={{ ...S.gradePill, background: color(p) + '20', color: color(p) }}>{grade(p)}</span></td>
                    <td style={S.td}>{new Date(g.examDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
};

const S = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  title:       { fontSize: '1.2rem', fontWeight: 700, color: '#111827', margin: 0 },
  sub:         { fontSize: '0.82rem', color: '#9ca3af', marginTop: 2 },
  overallBadge:{ padding: '8px 18px', borderRadius: 20, fontSize: '0.88rem' },
  subjectRow:  { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  subjectCard: { background: '#fff', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', transition: 'all 0.15s' },
  card:        { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  empty:       { textAlign: 'center', padding: '40px', color: '#9ca3af' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { background: '#f8fafc' },
  th:          { padding: '10px 12px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' },
  td:          { padding: '11px 12px', fontSize: '0.85rem', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  subTag:      { background: '#e0e7ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700 },
  scoreBar:    { display: 'flex', alignItems: 'center', gap: 4 },
  scoreBarFill:{ height: 6, borderRadius: 99, minWidth: 4, maxWidth: 80, transition: 'width 0.3s' },
  gradePill:   { padding: '2px 10px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800 },
};

export default StudentGrades;
