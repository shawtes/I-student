import { useState, useEffect } from 'react';
import api from '../../services/api';
import GoogleCalendarCard from '../GoogleCalendarCard';
import StripePaymentModal from './StripePaymentModal';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [payingFor, setPayingFor] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch {}
  };

  const pay = (b) => setPayingFor(b);

  const onPaid = () => {
    setPayingFor(null);
    setMessage({ text: 'Payment succeeded. Session confirmed.', type: 'success' });
    load();
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

      <GoogleCalendarCard />

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

      {payingFor && (
        <StripePaymentModal
          booking={payingFor}
          amount={50}
          onClose={() => setPayingFor(null)}
          onSuccess={onPaid}
        />
      )}
    </div>
  );
}

export default Bookings;
