import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const roleRedirect = { admin: '/admin', teacher: '/teacher', parent: '/parent', student: '/student' };

const ROLES = [
  { role: 'Admin',   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', email: 'admin@scope.com' },
  { role: 'Teacher', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', email: 'teacher@school.com' },
  { role: 'Parent',  color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', email: 'parent@email.com' },
  { role: 'Student', color: '#d97706', bg: '#fffbeb', border: '#fde68a', email: 'roll@scope.internal' },
];

const CARDS = [
  { icon: '◎', title: 'AI Risk Monitor',      desc: 'Early detection of at-risk students using ML' },
  { icon: '▤', title: 'Live Analytics',        desc: 'Real-time grades, attendance & performance' },
  { icon: '◷', title: 'Parent-Teacher Chat',  desc: 'Instant messaging with read receipts' },
  { icon: '◫', title: 'Smart Alerts',         desc: 'Absence & grade alerts via email & push' },
];

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]           = useState({ email: '', password: '' });
  const [error, setError]         = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [focused, setFocused]     = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(data.message);
    } catch {
      setForgotMsg('Something went wrong. Please try again.');
    }
    setForgotLoading(false);
  };

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
    <>
      <style>{`
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes fadeUp     { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeLeft   { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeRight  { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse      { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes floatDot   { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shimmer    { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .s-input:focus        { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.12) !important; background: #fff !important; }
        .s-btn:hover:not(:disabled) { background: #4338ca !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.35) !important; }
        .s-btn:active:not(:disabled) { transform: translateY(0); }
        .s-role:hover         { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
        .s-card-1 { animation: fadeLeft 0.5s ease 0.15s both; }
        .s-card-2 { animation: fadeLeft 0.5s ease 0.25s both; }
        .s-card-3 { animation: fadeLeft 0.5s ease 0.35s both; }
        .s-card-4 { animation: fadeLeft 0.5s ease 0.45s both; }
        .s-mini-card:hover { background: rgba(255,255,255,0.18) !important; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important; }
        .s-dot-1 { animation: floatDot 3s ease-in-out infinite; }
        .s-dot-2 { animation: floatDot 3s ease-in-out 1s infinite; }
        .s-dot-3 { animation: floatDot 3s ease-in-out 2s infinite; }
        @media (max-width: 768px) {
          .s-left  { display: none !important; }
          .s-right { width: 100% !important; }
          .s-mobile-logo { display: flex !important; }
        }
      `}</style>

      <div style={s.page}>

        {/* Left panel */}
        <div className="s-left" style={s.left}>
          <div style={s.leftInner}>

            <div style={s.brand}>
              <div style={s.brandMark}>SC</div>
              <div>
                <div style={s.brandName}>SCOPE</div>
                <div style={s.brandSub}>Smart Continuous Parent Engagement</div>
              </div>
            </div>

            <h1 style={s.tagline}>
              Connecting Schools<br />& Families,<br />
              <span style={s.taglineAccent}>Intelligently.</span>
            </h1>

            <p style={s.desc}>
              A unified platform for schools to manage students, communicate with
              parents, and improve outcomes through AI-powered insights.
            </p>

            <div style={s.cardGrid}>
              {CARDS.map((c, i) => (
                <div key={c.title} className={`s-mini-card s-card-${i+1}`} style={s.miniCard}>
                  <div style={s.cardIcon}>{c.icon}</div>
                  <div style={s.cardTitle2}>{c.title}</div>
                  <div style={s.cardDesc}>{c.desc}</div>
                </div>
              ))}
            </div>

            <div style={s.statsRow}>
              {[['50+', 'Students', 's-dot-1'], ['4', 'User Roles', 's-dot-2'], ['3', 'AI Models', 's-dot-3']].map(([val, lbl, cls]) => (
                <div key={lbl} className={cls} style={s.stat}>
                  <div style={s.statVal}>{val}</div>
                  <div style={s.statLbl}>{lbl}</div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right panel */}
        <div className="s-right" style={s.right}>
          <div style={s.card}>

            {/* Mobile logo */}
            <div className="s-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{ ...s.brandMark, background: '#4f46e5' }}>SC</div>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e1b4b', letterSpacing: 2 }}>SCOPE</span>
            </div>

            <div style={s.cardHeader}>
              <h2 style={s.cardTitle}>Sign in</h2>
              <p style={s.cardSub}>Enter your credentials to access your account</p>
            </div>

            {error && (
              <div style={s.errorBox}>
                <span style={s.errorDot} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Email address</label>
                <input
                  className="s-input"
                  style={{ ...s.input, ...(focused === 'email' ? s.inputFocused : {}) }}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  required
                  autoComplete="email"
                />
              </div>

              <div style={s.field}>
                <div style={s.labelRow}>
                  <label style={s.label}>Password</label>
                  <span style={s.forgotLink} onClick={() => { setShowForgot(true); setForgotMsg(''); setForgotEmail(form.email); }}>Forgot password?</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="s-input"
                    style={{ ...s.input, paddingRight: 44, ...(focused === 'password' ? s.inputFocused : {}) }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={s.eyeBtn}
                    tabIndex={-1}
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                className="s-btn"
                style={{ ...s.loginBtn, opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                type="submit"
                disabled={loading}
              >
                {loading
                  ? <span style={s.loadingRow}><span style={s.spinner} /> Signing in...</span>
                  : 'Sign In'
                }
              </button>
            </form>

            <div style={s.divider}>
              <div style={s.dividerLine} />
              <span style={s.dividerText}>Quick access</span>
              <div style={s.dividerLine} />
            </div>

            <div style={s.roleGrid}>
              {ROLES.map(r => (
                <button
                  key={r.role}
                  className="s-role"
                  style={{ ...s.roleBtn, background: r.bg, border: `1.5px solid ${r.border}`, color: r.color }}
                  onClick={() => setForm(f => ({ ...f, email: r.email }))}
                  title={`Fill ${r.role} demo email`}
                  type="button"
                >
                  {r.role}
                </button>
              ))}
            </div>

            <p style={s.note}>
              No account?{' '}
              <Link to="/register" style={s.noteLink}>Contact your school admin</Link>
            </p>

          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div style={s.overlay} onClick={() => setShowForgot(false)}>
          <div style={s.forgotCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Reset Password</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#6b7280' }}>Enter your email and we'll send your reset credentials.</p>
            {forgotMsg
              ? <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>{forgotMsg}</div>
              : (
                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    className="s-input"
                    style={s.input}
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <button className="s-btn" style={{ ...s.loginBtn, marginTop: 0 }} type="submit" disabled={forgotLoading}>
                    {forgotLoading ? 'Sending...' : 'Send Reset Email'}
                  </button>
                </form>
              )
            }
            <button onClick={() => setShowForgot(false)} style={{ marginTop: 14, background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.82rem', cursor: 'pointer', width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

const s = {
  page:  { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" },

  // Left
  left:       { flex: 1, background: 'linear-gradient(160deg, #3730a3 0%, #4f46e5 55%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px' },
  leftInner:  { maxWidth: 440, animation: 'fadeLeft 0.7s ease' },
  brand:      { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 },
  brandMark:  { width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', letterSpacing: 1, flexShrink: 0 },
  brandName:  { fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: 3 },
  brandSub:   { fontSize: '0.72rem', color: '#a5b4fc', letterSpacing: 0.5, marginTop: 3 },
  tagline:    { fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 20 },
  taglineAccent: { color: '#a5b4fc' },
  desc:       { color: '#c7d2fe', fontSize: '0.92rem', lineHeight: 1.75, marginBottom: 36 },

  cardGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 },
  miniCard:   { background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 14, padding: '18px 16px', backdropFilter: 'blur(8px)', transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s', cursor: 'default' },
  cardIcon:   { fontSize: '1.4rem', marginBottom: 10, lineHeight: 1 },
  cardTitle2: { fontSize: '0.85rem', fontWeight: 700, color: '#e0e7ff', marginBottom: 5 },
  cardDesc:   { fontSize: '0.74rem', color: '#a5b4fc', lineHeight: 1.55 },

  statsRow: { display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' },
  stat:     { flex: 1, textAlign: 'center', padding: '16px 8px', borderRight: '1px solid rgba(255,255,255,0.08)' },
  statVal:  { fontSize: '1.5rem', fontWeight: 800, color: '#fff' },
  statLbl:  { fontSize: '0.7rem', color: '#a5b4fc', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Right
  right: { width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: '#f8fafc' },
  card:  { background: '#fff', borderRadius: 16, padding: '44px 40px', boxShadow: '0 4px 32px rgba(0,0,0,0.1)', width: '100%', animation: 'fadeRight 0.6s ease 0.1s both' },

  cardHeader: { marginBottom: 28 },
  cardTitle:  { fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: '0 0 6px' },
  cardSub:    { color: '#6b7280', fontSize: '0.88rem', margin: 0 },

  errorBox: { display: 'flex', alignItems: 'center', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '11px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 20 },
  errorDot: { width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 },

  form:     { display: 'flex', flexDirection: 'column', gap: 20 },
  field:    { display: 'flex', flexDirection: 'column', gap: 6 },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label:    { fontSize: '0.82rem', fontWeight: 600, color: '#374151' },
  forgotLink: { fontSize: '0.78rem', color: '#4f46e5', cursor: 'pointer', fontWeight: 500 },

  input:       { width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', color: '#111827', background: '#fafafa', transition: 'border-color 0.25s, box-shadow 0.25s, background 0.2s' },
  inputFocused:{ borderColor: '#4f46e5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)', background: '#fff' },
  eyeBtn:      { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', cursor: 'pointer', padding: '2px 4px' },

  loginBtn:   { background: '#4f46e5', color: '#fff', border: 'none', padding: '13px', borderRadius: 8, fontSize: '0.95rem', fontWeight: 700, marginTop: 4, width: '100%', transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s', letterSpacing: 0.3 },
  loadingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  spinner:    { width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' },

  divider:     { display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 14px' },
  dividerLine: { flex: 1, height: 1, background: '#e5e7eb' },
  dividerText: { fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.5 },

  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 24 },
  roleBtn:  { padding: '9px 6px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s', textAlign: 'center', fontFamily: 'inherit' },

  note:     { textAlign: 'center', fontSize: '0.82rem', color: '#6b7280', margin: 0 },
  noteLink: { color: '#4f46e5', fontWeight: 600, textDecoration: 'none' },

  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  forgotCard: { background: '#fff', borderRadius: 14, padding: '32px 36px', width: '100%', maxWidth: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
};

export default Login;
