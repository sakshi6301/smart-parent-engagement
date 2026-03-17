import React from 'react';

const colors = {
  success: { bg: '#f0fdf4', color: '#15803d' },
  danger: { bg: '#fef2f2', color: '#dc2626' },
  warning: { bg: '#fffbeb', color: '#d97706' },
  info: { bg: '#eff6ff', color: '#2563eb' },
  purple: { bg: '#f5f3ff', color: '#7c3aed' },
  gray: { bg: '#f3f4f6', color: '#4b5563' },
};

const Badge = ({ label, type = 'gray' }) => {
  const c = colors[type] || colors.gray;
  return (
    <span style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
      {label}
    </span>
  );
};

export default Badge;
