import React from 'react';

const Modal = ({ title, onClose, children, width = 500 }) => (
  <div style={styles.overlay} onClick={onClose}>
    <div style={{ ...styles.modal, width }} onClick={e => e.stopPropagation()}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>
      <div style={styles.body}>{children}</div>
    </div>
  </div>
);

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #e5e7eb' },
  title: { fontSize: '1rem', fontWeight: 700, color: '#111827' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.1rem', color: '#6b7280', padding: 4, borderRadius: 6 },
  body: { padding: '20px 24px' },
};

export default Modal;
