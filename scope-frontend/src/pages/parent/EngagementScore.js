import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EngagementScore = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ai/engagement/${user._id}`)
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user._id]);

  if (loading) {
    return (
      <AppLayout>
        <div style={styles.loading}>Loading engagement data...</div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div style={styles.error}>Unable to load engagement data</div>
      </AppLayout>
    );
  }

  const levelConfig = {
    'Highly Engaged': { color: '#10b981', bg: '#f0fdf4', icon: '✓' },
    'Moderately Engaged': { color: '#f59e0b', bg: '#fffbeb', icon: '~' },
    'Low Engagement': { color: '#ef4444', bg: '#fef2f2', icon: '!' },
  };

  const cfg = levelConfig[data.level] || levelConfig['Low Engagement'];
  const percentage = (data.score / 100) * 360;

  const metrics = [
    { label: 'App Logins (30 days)', value: data.login_count, max: 20, icon: '→' },
    { label: 'Chat Replies', value: data.chat_replies, max: 10, icon: '◫' },
    { label: 'Meetings Attended', value: data.meetings_attended, max: 3, icon: '◷' },
    { label: 'Homework Acknowledged', value: data.hw_acknowledged, max: 10, icon: '▤' },
    { label: 'Notifications Opened', value: data.notifications_opened, total: data.total_notifications, icon: '◫' },
  ];

  return (
    <AppLayout>
      <div style={styles.header}>
        <h1 style={styles.title}>Your Engagement Score</h1>
        <p style={styles.subtitle}>Track how actively you're involved in your child's education</p>
      </div>

      <div style={styles.mainCard}>
        <div style={styles.scoreSection}>
          <div style={styles.gaugeContainer}>
            <svg width="180" height="180" style={styles.gauge}>
              <circle cx="90" cy="90" r="70" fill="none" stroke="#e5e7eb" strokeWidth="16" />
              <circle
                cx="90" cy="90" r="70" fill="none"
                stroke={cfg.color}
                strokeWidth="16"
                strokeDasharray={`${percentage * 1.22} 440`}
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
              />
            </svg>
            <div style={styles.scoreValue}>{data.score}</div>
            <div style={styles.scoreMax}>/100</div>
          </div>
          <div style={{ ...styles.levelBadge, background: cfg.bg, color: cfg.color, border: `2px solid ${cfg.color}` }}>
            <span style={styles.levelIcon}>{cfg.icon}</span>
            {data.level}
          </div>
        </div>

        <div style={styles.metricsSection}>
          <h3 style={styles.sectionTitle}>Engagement Breakdown</h3>
          {metrics.map((m, i) => (
            <div key={i} style={styles.metricRow}>
              <span style={styles.metricIcon}>{m.icon}</span>
              <div style={styles.metricInfo}>
                <div style={styles.metricLabel}>{m.label}</div>
                <div style={styles.metricBar}>
                  <div
                    style={{
                      ...styles.metricFill,
                      width: m.total ? `${(m.value / m.total) * 100}%` : `${Math.min((m.value / m.max) * 100, 100)}%`,
                      background: m.value === 0 ? '#ef4444' : m.value >= (m.max || m.total) * 0.7 ? '#10b981' : '#f59e0b',
                    }}
                  />
                </div>
              </div>
              <div style={styles.metricValue}>
                {m.total ? `${m.value}/${m.total}` : `${m.value}/${m.max}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.insights && data.insights.length > 0 && (
        <div style={styles.insightsCard}>
          <h3 style={styles.sectionTitle}>AI Insights & Recommendations</h3>
          <div style={styles.insightsList}>
            {data.insights.map((insight, i) => (
              <div key={i} style={styles.insightItem}>
                <span style={styles.insightBullet}>•</span>
                <span style={styles.insightText}>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.infoCard}>
        <h3 style={styles.sectionTitle}>How is this calculated?</h3>
        <p style={styles.infoText}>
          Your engagement score is calculated based on your activity over the last 30 days. 
          Regular logins, responding to teacher messages, attending meetings, acknowledging homework, 
          and reading notifications all contribute to a higher score. Stay engaged to support your child's success!
        </p>
      </div>
    </AppLayout>
  );
};

const styles = {
  header: { marginBottom: 24 },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: '0.9rem', color: '#6b7280' },
  loading: { textAlign: 'center', padding: '60px', fontSize: '0.95rem', color: '#9ca3af' },
  error: { textAlign: 'center', padding: '60px', fontSize: '0.95rem', color: '#ef4444', background: '#fef2f2', borderRadius: 12 },
  mainCard: { background: '#fff', borderRadius: 14, padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20, display: 'flex', gap: 40, flexWrap: 'wrap' },
  scoreSection: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  gaugeContainer: { position: 'relative', width: 180, height: 180 },
  gauge: { transform: 'rotate(0deg)' },
  scoreValue: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '3rem', fontWeight: 900, color: '#111827' },
  scoreMax: { position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, 0)', fontSize: '1rem', color: '#9ca3af', fontWeight: 600 },
  levelBadge: { padding: '10px 20px', borderRadius: 24, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 },
  levelIcon: { fontSize: '1.2rem' },
  metricsSection: { flex: 1, minWidth: 300 },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 16 },
  metricRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  metricIcon: { fontSize: '1.2rem', color: '#6b7280', width: 24, textAlign: 'center', flexShrink: 0 },
  metricInfo: { flex: 1, minWidth: 0 },
  metricLabel: { fontSize: '0.85rem', color: '#374151', fontWeight: 500, marginBottom: 6 },
  metricBar: { height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  metricFill: { height: '100%', borderRadius: 4, transition: 'width 0.3s ease' },
  metricValue: { fontSize: '0.85rem', fontWeight: 700, color: '#111827', minWidth: 50, textAlign: 'right' },
  insightsCard: { background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: 14, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20 },
  insightsList: { display: 'flex', flexDirection: 'column', gap: 12 },
  insightItem: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  insightBullet: { fontSize: '1.5rem', color: '#10b981', lineHeight: 1, marginTop: -4 },
  insightText: { fontSize: '0.9rem', color: '#065f46', lineHeight: 1.6 },
  infoCard: { background: '#f9fafb', borderRadius: 14, padding: '24px', border: '1px solid #e5e7eb' },
  infoText: { fontSize: '0.88rem', color: '#6b7280', lineHeight: 1.7, margin: 0 },
};

export default EngagementScore;
