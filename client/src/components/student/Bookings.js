import { useState, useEffect } from 'react';
import api from '../../services/api';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [calStatus, setCalStatus] = useState({ configured: false, linked: false });

  useEffect(() => { load(); loadCalStatus(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'linked') {
      setMessage({ text: 'Google Calendar linked. Session invites will land in your Gmail.', type: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
      loadCalStatus();
    } else if (params.get('calendar') === 'error') {
      setMessage({ text: `Google link failed: ${params.get('reason') || 'unknown'}`, type: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch {}
  };

  const loadCalStatus = async () => {
    try {
      const res = await api.get('/calendar/status');
      setCalStatus(res.data);
    } catch {}
  };

  const linkCalendar = async () => {
    try {
      const res = await api.get('/calendar/auth-url');
      window.location.href = res.data.url;
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Google OAuth is not configured yet', type: 'error' });
    }
  };

  const unlinkCalendar = async () => {
    if (!window.confirm('Disconnect Google Calendar?')) return;
    try {
      await api.delete('/calendar/link');
      setCalStatus(s => ({ ...s, linked: false }));
    } catch {}
  };

  const pay = async (b) => {
    const method = prompt('Payment method? (card / paypal / applepay / fail to test failure)', 'card');
    if (!method) return;
    try {
      await api.post('/payments', {
        bookingId: b._id,
        amount: 50,
        method
      });
      setMessage({ text: 'Paid. Session confirmed.', type: 'success' });
      load();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Payment failed', type: 'error' });
    }
  };

  const cancel = async (b) => {
    if (!window.confirm('Cancel this session?')) return;
    try {
      await api.delete(`/bookings/${b._id}`);
      load();
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h1>My bookings</h1>
        <p>Track pending, accepted, and confirmed sessions</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>
      )}

      {calStatus.configured && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <strong>Google Calendar</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {calStatus.linked
                  ? 'Connected. Session invites show up on your calendar.'
                  : 'Connect to get Google Meet invites on your calendar automatically.'}
              </div>
            </div>
            {calStatus.linked ? (
              <button className="btn btn-secondary btn-sm" onClick={unlinkCalendar}>Disconnect</button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={linkCalendar}>Connect Google Calendar</button>
            )}
          </div>
        </div>
      )}

      <div className="card">
        {bookings.length === 0 ? (
          <p>No bookings yet. Find a tutor to get started.</p>
        ) : (
          bookings.map(b => (
            <div key={b._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{b.subject || 'Tutoring session'}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {b.tutor?.name} &middot; {new Date(b.startTime).toLocaleString()} &middot; {b.durationMinutes}min
                  </div>
                  <span className="badge badge-blue">{b.status}</span>
                  {(b.status === 'accepted' || b.status === 'confirmed') && (
                    <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                      {b.meetingUrl ? (
                        <>
                          Meet link: <a href={b.meetingUrl} target="_blank" rel="noreferrer">{b.meetingUrl}</a>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Added to your tutor's Google Calendar — invite should be in your email.
                          </div>
                        </>
                      ) : b.tutor?.email ? (
                        <>
                          Tutor contact: <a href={`mailto:${b.tutor.email}?subject=${encodeURIComponent(`Meeting link for ${b.subject || 'our session'}`)}`}>{b.tutor.email}</a>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Your tutor hasn't linked Google Calendar — email them for the meeting link.
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {b.status === 'accepted' && (
                    <button className="btn btn-primary btn-sm" onClick={() => pay(b)}>Pay</button>
                  )}
                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => cancel(b)}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Bookings;
