import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>🎓 SCOPE</span>
      <div style={styles.links}>
        <Link to={`/${user?.role}`} style={styles.link}>{t('dashboard')}</Link>
        <select onChange={(e) => i18n.changeLanguage(e.target.value)} defaultValue={i18n.language} style={styles.select}>
          <option value="en">EN</option>
          <option value="hi">HI</option>
          <option value="mr">MR</option>
        </select>
        <span style={styles.user}>{user?.name}</span>
        <button onClick={handleLogout} style={styles.btn}>{t('logout')}</button>
      </div>
    </nav>
  );
};

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#1a237e', color: '#fff' },
  brand: { fontSize: '1.4rem', fontWeight: 'bold' },
  links: { display: 'flex', alignItems: 'center', gap: '16px' },
  link: { color: '#fff', textDecoration: 'none', fontSize: '0.9rem' },
  select: { padding: '4px', borderRadius: '4px', border: 'none', cursor: 'pointer' },
  user: { fontSize: '0.9rem', opacity: 0.85 },
  btn: { background: '#ef5350', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' },
};

export default Navbar;
