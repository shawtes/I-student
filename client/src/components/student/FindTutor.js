import { useState } from 'react';
import api from '../../services/api';
import { byDept, findByCode } from '../../data/gsuCourses';

function FindTutor() {
  const [subject, setSubject] = useState('');
  const [day, setDay] = useState('');
  const [pref, setPref] = useState('');
  const groups = byDept();
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const search = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (day) params.set('day', day);
      if (pref) params.set('pref', pref);
      const res = await api.get('/tutors/search?' + params.toString());
      setResults(res.data);
      setSearched(true);
    } catch (err) {
      setMessage({ text: 'Search failed, try again', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const requestBooking = async (tutorId) => {
    const date = prompt('Session start (YYYY-MM-DDTHH:mm)');
    if (!date) return;
    try {
      const res = await api.post('/bookings', {
        tutorId,
        subject,
        startTime: date,
        durationMinutes: 60
      });
      setBooking(res.data);
      setMessage({ text: 'Request sent. Waiting on tutor approval.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Booking failed', type: 'error' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Find a Tutor</h1>
        <p>Filter by subject, day, and learning preference</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>
      )}

      <div className="card">
        <form onSubmit={search}>
          <div className="grid grid-3">
            <div className="form-group">
              <label htmlFor="search-subject">GSU course</label>
              <select id="search-subject" value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Any course</option>
                {Object.keys(groups).map(dept => (
                  <optgroup key={dept} label={dept}>
                    {groups[dept].map(c => (
                      <option key={c.code} value={c.code}>{c.code} &ndash; {c.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="search-day">Day</label>
              <select id="search-day" value={day} onChange={e => setDay(e.target.value)}>
                <option value="">Any</option>
                <option>Mon</option><option>Tue</option><option>Wed</option>
                <option>Thu</option><option>Fri</option><option>Sat</option><option>Sun</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="search-pref">Learning style</label>
              <input id="search-pref" value={pref} onChange={e => setPref(e.target.value)} placeholder="visual, hands-on..." />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {searched && (
        <div className="card">
          <h2>Results ({results.length})</h2>
          {results.length === 0 ? (
            <p style={{ marginTop: '12px' }}>No tutors matched. Try widening your filters.</p>
          ) : (
            <div className="grid grid-2" style={{ marginTop: '14px' }}>
              {results.map(t => (
                <div key={t._id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                  <h3>{t.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {t.subjects?.length
                      ? t.subjects.map(s => {
                          const c = findByCode(s);
                          return c ? `${c.code} (${c.name})` : s;
                        }).join(', ')
                      : 'No courses listed'}
                  </p>
                  {t.hourlyRate != null && <p style={{ fontSize: '0.9rem' }}>${t.hourlyRate}/hr</p>}
                  {t.ratingCount > 0 && (
                    <p style={{ fontSize: '0.85rem' }}>{t.ratingAverage.toFixed(1)} ({t.ratingCount})</p>
                  )}
                  {t.bio && <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>{t.bio}</p>}
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '10px' }} onClick={() => requestBooking(t._id)}>
                    Request session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {booking && (
        <div className="card">
          <h2>Latest request</h2>
          <pre style={{ fontSize: '0.85rem', marginTop: '10px' }}>{JSON.stringify(booking, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default FindTutor;
