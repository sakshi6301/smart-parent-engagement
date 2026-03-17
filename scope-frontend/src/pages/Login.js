import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const roleRedirect = { admin: '/admin', teacher: '/teacher', parent: '/parent', student: '/student' };

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(roleRedirect[user.role] || '/');
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div style={styles.page}>
      {/* Left Panel */}
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>🎓</span>
            <span style={styles.brandName}>SCOPE</span>
          </div>
          <h1 style={styles.tagline}>Smart Continuous<br />Parent Engagement<br />System</h1>
          <p style={styles.desc}>
            Bridging the gap between schools and parents through AI-powered insights,
            real-time communication, and data-driven decisions.
          </p>
          <div style={styles.features}>
            {[
              '📊 Real-time Analytics',
              '🤖 AI Risk Prediction',
              '💬 Instant Messaging',
              '🔔 Smart Notifications',
              '📚 Homework Tracking',
              '🌐 Multilingual Support',
            ].map(f => (
              <div key={f} style={styles.feature}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.logoMobile}>
            <span style={{ fontSize: '1.8rem' }}>🎓</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e1b4b', letterSpacing: 1 }}>SCOPE</span>
          </div>

          <h2 style={styles.cardTitle}>Welcome Back</h2>
          <p style={styles.cardSub}>Sign in to your account to continue</p>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email Address</label>
              <input
                style={styles.input}
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <div style={styles.labelRow}>
                <label style={styles.label}>Password</label>
                <span style={styles.forgotLink}>Forgot password?</span>
              </div>
              <div style={styles.passWrap}>
                <input
                  style={{ ...styles.input, paddingRight: 44 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn} tabIndex={-1}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              style={{ ...styles.loginBtn, opacity: loading ? 0.75 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span style={styles.loadingRow}>
                  <span style={styles.spinner} /> Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={styles.registerNote}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.registerLink}>Contact your school admin</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { display: 'flex', minHeight: '100vh' },

  // Left
  left: { flex: 1, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 },
  leftContent: { maxWidth: 440 },
  brand: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 },
  brandIcon: { fontSize: '2.5rem' },
  brandName: { fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: 2 },
  tagline: { fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 16 },
  desc: { color: '#c7d2fe', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 32 },
  features: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  feature: { background: 'rgba(255,255,255,0.1)', color: '#e0e7ff', padding: '7px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 500 },

  // Right
  right: { width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#f8fafc' },
  card: { background: '#fff', borderRadius: 16, padding: '40px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '100%' },
  logoMobile: { display: 'none', alignItems: 'center', gap: 8, marginBottom: 20 },
  cardTitle: { fontSize: '1.6rem', fontWeight: 800, color: '#111827', marginBottom: 6 },
  cardSub: { color: '#6b7280', fontSize: '0.9rem', marginBottom: 28 },

  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 18, display: 'flex', gap: 8, alignItems: 'center' },

  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  forgotLink: { fontSize: '0.78rem', color: '#4f46e5', cursor: 'pointer', fontWeight: 500 },
  input: { padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.92rem', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s', color: '#111827' },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: 0 },

  loginBtn: { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', padding: '13px', borderRadius: 8, fontSize: '1rem', fontWeight: 700, marginTop: 4, transition: 'opacity 0.2s', width: '100%' },
  loadingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },

  registerNote: { textAlign: 'center', fontSize: '0.82rem', color: '#6b7280', marginTop: 24 },
  registerLink: { color: '#4f46e5', fontWeight: 600, textDecoration: 'none' },
};

export default Login;
