import React from 'react';

const colorMap = {
  blue: { bg: '#eff6ff', icon: '#3b82f6', border: '#bfdbfe' },
  green: { bg: '#f0fdf4', icon: '#10b981', border: '#bbf7d0' },
  yellow: { bg: '#fffbeb', icon: '#f59e0b', border: '#fde68a' },
  red: { bg: '#fef2f2', icon: '#ef4444', border: '#fecaca' },
  purple: { bg: '#f5f3ff', icon: '#7c3aed', border: '#ddd6fe' },
  cyan: { bg: '#ecfeff', icon: '#06b6d4', border: '#a5f3fc' },
};

const StatCard = ({ title, value, icon, color = 'blue', subtitle, trend }) => {
  const c = colorMap[color];
  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${c.icon}` }}>
      <div style={styles.row}>
        <div>
          <p style={styles.title}>{title}</p>
          <p style={{ ...styles.value, color: c.icon }}>{value}</p>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
        <div style={{ ...styles.iconBox, background: c.bg, border: `1px solid ${c.border}` }}>
          <span style={{ fontSize: '1.6rem' }}>{icon}</span>
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ ...styles.trend, color: trend >= 0 ? '#10b981' : '#ef4444' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% from last month
        </div>
      )}
    </div>
  );
};

const styles = {
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', flex: 1, minWidth: 180 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '0.82rem', color: '#6b7280', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  value: { fontSize: '2rem', fontWeight: 800, lineHeight: 1 },
  subtitle: { fontSize: '0.78rem', color: '#9ca3af', marginTop: 4 },
  iconBox: { width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  trend: { fontSize: '0.78rem', marginTop: 10, fontWeight: 500 },
};

export default StatCard;
