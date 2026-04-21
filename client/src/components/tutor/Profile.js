import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { byDept } from '../../data/gsuCourses';

function Profile() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(new Set());
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');
  const [learningPrefs, setLearningPrefs] = useState('');
  const [filter, setFilter] = useState('');
  const [alert, setAlert] = useState({ text: '', type: '' });
  const [calStatus, setCalStatus] = useState({ configured: false, linked: false });

  const groups = byDept();

  useEffect(() => { load(); loadCalStatus(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'linked') {
      setAlert({ text: 'Google Calendar linked. Future sessions will auto-create Meet links.', type: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('calendar') === 'error') {
      setAlert({ text: `Google link failed: ${params.get('reason') || 'unknown'}`, type: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/auth/me');
      setSelected(new Set(res.data.subjects || []));
      setLearningPrefs((res.data.learningPrefs || []).join(', '));
      setHourlyRate(res.data.hourlyRate || '');
      setBio(res.data.bio || '');
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
      setAlert({ text: err.response?.data?.message || 'Google OAuth is not configured', type: 'error' });
    }
  };

  const unlinkCalendar = async () => {
    if (!window.confirm('Disconnect Google Calendar? Future sessions will go back to the email flow.')) return;
    try {
      await api.delete('/calendar/link');
      setCalStatus(s => ({ ...s, linked: false }));
      setAlert({ text: 'Disconnected', type: 'success' });
    } catch {}
  };

  const toggle = (code) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', {
        name: user?.name,
        bio,
        subjects: Array.from(selected),
        learningPrefs: learningPrefs.split(',').map(s => s.trim()).filter(Boolean),
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined
      });
      setAlert({ text: 'Saved', type: 'success' });
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Save failed', type: 'error' });
    }
  };

  const matches = (c) => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return c.code.toLowerCase().includes(f) || c.name.toLowerCase().includes(f);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tutor Profile</h1>
        <p>Pick the GSU courses you can tutor and set your rate</p>
      </div>

      {alert.text && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Google Calendar</h2>
        {!calStatus.configured ? (
          <p style={{ color: 'var(--text-muted)' }}>
            Server isn't configured for Google OAuth — ask the admin to set <code>GOOGLE_CLIENT_ID</code>,{' '}
            <code>GOOGLE_CLIENT_SECRET</code>, and <code>GOOGLE_REDIRECT_URI</code>.
          </p>
        ) : calStatus.linked ? (
          <div>
            <p style={{ color: 'var(--green)', margin: '0 0 10px' }}>Connected. Accepted sessions get a Google Meet link automatically.</p>
            <button type="button" onClick={unlinkCalendar} className="btn btn-secondary btn-sm">Disconnect</button>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 10px' }}>
              Connect to auto-create Google Meet links and calendar invites when you accept a session.
            </p>
            <button type="button" onClick={linkCalendar} className="btn btn-primary btn-sm">Connect Google Calendar</button>
          </div>
        )}
      </div>

      <div className="card">
        <form onSubmit={save}>
          <div className="form-group">
            <label htmlFor="rate">Hourly rate (USD)</label>
            <input id="rate" type="number" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="prefs">Learning styles you support</label>
            <input id="prefs" value={learningPrefs} onChange={e => setLearningPrefs(e.target.value)} placeholder="visual, hands-on, discussion" />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows="4" />
          </div>

          <div className="form-group">
            <label>
              GSU courses ({selected.size} selected)
            </label>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter by code or name (e.g. CSC, Calculus)"
              style={{ marginBottom: '10px' }}
            />
            <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
              {Object.keys(groups).map(dept => {
                const visible = groups[dept].filter(matches);
                if (visible.length === 0) return null;
                return (
                  <div key={dept} style={{ marginBottom: '14px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {dept}
                    </div>
                    {visible.map(c => (
                      <label key={c.code} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selected.has(c.code)}
                          onChange={() => toggle(c.code)}
                        />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.code}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{c.name}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
