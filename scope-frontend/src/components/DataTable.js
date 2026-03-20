import React from 'react';

const DataTable = ({ columns, data, emptyMsg = 'No data found', maxHeight = 520 }) => (
  <div style={styles.wrapper}>
    <div className="section-scroll" style={{ maxHeight, borderRadius: 12 }}>
    <table style={styles.table}>
      <thead>
        <tr style={styles.thead}>
          {columns.map(col => <th key={col.key} style={{ ...styles.th, width: col.width }}>{col.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.length === 0
          ? <tr><td colSpan={columns.length} style={styles.empty}>{emptyMsg}</td></tr>
          : data.map((row, i) => (
            <tr key={row._id || i} style={styles.tr}>
              {columns.map(col => (
                <td key={col.key} style={styles.td}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table>
    </div>
  </div>
);

const styles = {
  wrapper: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' },
  td: { padding: '13px 16px', fontSize: '0.88rem', color: '#374151' },
  empty: { padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' },
};

export default DataTable;
