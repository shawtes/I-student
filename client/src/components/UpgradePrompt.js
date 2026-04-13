import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Shows a modal encouraging the user to upgrade.
// Used for first-login prompt and quota-exceeded prompt.
// Props: open, onClose, title, message, variant: 'welcome' | 'quota'
function UpgradePrompt({ open, onClose, title, message, variant = 'welcome' }) {
  const [plans, setPlans] = useState({});

  useEffect(() => {
    if (open) {
      api.get('/subscriptions/plans').then(r => setPlans(r.data)).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={S.closeBtn}>x</button>

        <div style={S.header}>
          <h2 style={{ margin: 0 }}>{title || (variant === 'quota' ? 'Daily limit reached' : 'Welcome to I-Student')}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0' }}>
            {message || (variant === 'quota'
              ? 'You\'ve used all your free AI requests for today. Upgrade to keep going, or come back tomorrow.'
              : 'Pick a plan to get the most out of the platform. You can upgrade anytime.')}
          </p>
        </div>

        <div style={S.plansGrid}>
          {['free', 'pro', 'premium'].map(key => {
            const p = plans[key];
            if (!p) return null;
            const highlight = key === 'pro';
            return (
              <div key={key} style={{
                ...S.planCard,
                border: highlight ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                boxShadow: highlight ? '0 4px 16px rgba(45, 91, 227, 0.15)' : 'none',
              }}>
                {highlight && <div style={S.popularBadge}>Most popular</div>}
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.name}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, margin: '4px 0' }}>
                  ${p.price}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>{p.price > 0 ? '/mo' : ''}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', fontSize: '0.8rem' }}>
                  {p.features.slice(0, 3).map((f, i) => (
                    <li key={i} style={{ padding: '2px 0', color: 'var(--text-secondary)' }}>- {f}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div style={S.actions}>
          <Link to="/student/billing" onClick={onClose} style={S.upgradeBtn}>See plans</Link>
          <button onClick={onClose} style={S.skipBtn}>
            {variant === 'quota' ? 'Not now' : 'Continue with Free'}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 2000, padding: '16px',
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '28px',
    width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
    position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '16px',
    background: 'none', border: 'none', fontSize: '1.2rem',
    cursor: 'pointer', color: 'var(--text-muted)',
  },
  header: { marginBottom: '20px', textAlign: 'center' },
  plansGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px', marginBottom: '20px',
  },
  planCard: {
    borderRadius: '10px', padding: '14px', position: 'relative',
  },
  popularBadge: {
    position: 'absolute', top: '-8px', right: '10px',
    background: 'var(--accent)', color: '#fff',
    fontSize: '0.65rem', fontWeight: 700,
    padding: '2px 8px', borderRadius: '10px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  actions: { display: 'flex', gap: '10px', justifyContent: 'center' },
  upgradeBtn: {
    padding: '10px 24px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'none',
    display: 'inline-block',
  },
  skipBtn: {
    padding: '10px 24px', background: '#fff', color: 'var(--text-secondary)',
    border: '1.5px solid var(--border)', borderRadius: '10px',
    fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
};

export default UpgradePrompt;
