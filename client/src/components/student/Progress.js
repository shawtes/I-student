import { useState, useEffect } from 'react';
import api from '../../services/api';

function Progress() {
  const [data, setData] = useState({ notes: [], sessionsAttended: 0, sessionsScheduled: 0 });
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/progress');
      setData(res.data);
    } catch {}
  };

  const notes = filter
    ? data.notes.filter(n => (n.subject || '').toLowerCase().includes(filter.toLowerCase()))
    : data.notes;

  return (
    <div>
      <div className="page-header">
        <h1>My Progress</h1>
        <p>Sessions attended, scheduled, and tutor feedback</p>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <h3>Sessions attended</h3>
          <div style={{ fontSize: '2.4rem', fontWeight: 600 }}>{data.sessionsAttended}</div>
        </div>
        <div className="card">
          <h3>Upcoming / pending</h3>
          <div style={{ fontSize: '2.4rem', fontWeight: 600 }}>{data.sessionsScheduled}</div>
        </div>
        <div className="card">
          <h3>Tutor notes</h3>
          <div style={{ fontSize: '2.4rem', fontWeight: 600 }}>{data.notes.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="form-group">
          <label htmlFor="filter">Filter by subject</label>
          <input id="filter" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Math, Biology..." />
        </div>
        {notes.length === 0 ? (
          <p>No feedback yet.</p>
        ) : (
          notes.map(n => (
            <div key={n._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <strong>{n.subject || 'General'}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {new Date(n.updatedAt).toLocaleDateString()}
              </div>
              <p style={{ marginTop: '6px' }}>{n.notes}</p>
              {n.assignmentsTotal > 0 && (
                <div style={{ fontSize: '0.85rem' }}>
                  Assignments: {n.assignmentsCompleted}/{n.assignmentsTotal}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Progress;
