import { useState, useEffect } from 'react';
import api from '../../services/api';

function Requests() {
  const [bookings, setBookings] = useState([]);
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch {}
  };

  const respond = async (id, action) => {
    try {
      await api.patch(`/bookings/${id}/respond`, { action });
      setAlert({ text: action === 'accept' ? 'Accepted' : 'Declined', type: 'success' });
      load();
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Action failed', type: 'error' });
    }
  };

  const grouped = {
    pending: bookings.filter(b => b.status === 'pending'),
    accepted: bookings.filter(b => b.status === 'accepted'),
    confirmed: bookings.filter(b => b.status === 'confirmed'),
    other: bookings.filter(b => !['pending', 'accepted', 'confirmed'].includes(b.status)),
  };

  const Section = ({ title, rows, showActions }) => (
    <div className="card">
      <h2>{title} ({rows.length})</h2>
      {rows.length === 0 ? (
        <p style={{ marginTop: '10px' }}>Nothing here.</p>
      ) : (
        rows.map(b => (
          <div key={b._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{b.student?.name || 'Student'}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {b.subject || 'Tutoring'} &middot; {new Date(b.startTime).toLocaleString()} &middot; {b.durationMinutes}min
                </div>
                <span className="badge badge-blue">{b.status}</span>
                {(b.status === 'accepted' || b.status === 'confirmed') && (
                  <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                    {b.meetingUrl ? (
                      <>
                        Meet link: <a href={b.meetingUrl} target="_blank" rel="noreferrer">{b.meetingUrl}</a>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Auto-added to your Google Calendar. Student was invited by email.
                        </div>
                      </>
                    ) : b.student?.email ? (
                      <>
                        Student contact: <a href={`mailto:${b.student.email}?subject=${encodeURIComponent(`Meeting link for ${b.subject || 'our session'}`)}`}>{b.student.email}</a>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Link your Google Calendar on your Profile to auto-create Meet links.
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              {showActions && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => respond(b._id, 'accept')}>Accept</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => respond(b._id, 'decline')}>Decline</button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Session Requests</h1>
        <p>Incoming requests, accepted sessions awaiting payment, and confirmed bookings</p>
      </div>

      {alert.text && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>
      )}

      <Section title="Pending" rows={grouped.pending} showActions />
      <Section title="Accepted (waiting on payment)" rows={grouped.accepted} />
      <Section title="Confirmed" rows={grouped.confirmed} />
      {grouped.other.length > 0 && <Section title="Other" rows={grouped.other} />}
    </div>
  );
}

export default Requests;
