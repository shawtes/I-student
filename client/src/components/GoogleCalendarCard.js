import { useState, useEffect } from 'react';
import api from '../services/api';

// Reusable "Connect Google Calendar" card. Drop it on any page.
// Handles the OAuth redirect callback (?calendar=linked|error) automatically.
function GoogleCalendarCard({ compact = false }) {
  const [status, setStatus] = useState({ configured: false, linked: false });
  const [alert, setAlert] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/calendar/status')
      .then(r => { if (mounted) setStatus(r.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'linked') {
      setAlert({ text: 'Google Calendar linked.', type: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
      api.get('/calendar/status').then(r => setStatus(r.data)).catch(() => {});
    } else if (params.get('calendar') === 'error') {
      setAlert({ text: `Link failed: ${params.get('reason') || 'unknown'}`, type: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const connect = async () => {
    try {
      const res = await api.get('/calendar/auth-url');
      window.location.href = res.data.url;
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Google OAuth not ready', type: 'error' });
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Google Calendar?')) return;
    try {
      await api.delete('/calendar/link');
      setStatus(s => ({ ...s, linked: false }));
      setAlert({ text: 'Disconnected', type: 'success' });
    } catch {}
  };

  if (loading) return null;
  if (!status.configured) return null;

  return (
    <div className="card" style={{ marginBottom: compact ? '12px' : '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <strong>Google Calendar</strong>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {status.linked
              ? 'Connected. Tutoring sessions auto-create Meet links on your calendar.'
              : 'Connect once and every session you accept or book gets a Google Meet invite automatically.'}
          </div>
          {alert.text && (
            <div style={{ fontSize: '0.82rem', marginTop: '6px', color: alert.type === 'error' ? 'var(--red)' : 'var(--green)' }}>
              {alert.text}
            </div>
          )}
        </div>
        {status.linked ? (
          <button className="btn btn-secondary btn-sm" onClick={disconnect}>Disconnect</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={connect}>Connect Google Calendar</button>
        )}
      </div>
    </div>
  );
}

export default GoogleCalendarCard;
