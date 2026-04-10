import { useState, useEffect } from 'react';
import api from '../../services/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Availability() {
  const [slots, setSlots] = useState([]);
  const [day, setDay] = useState('Mon');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/availability/me');
      setSlots(res.data);
    } catch {}
  };

  const submit = async (e) => {
    e.preventDefault();
    setAlert({ text: '', type: '' });
    try {
      await api.post('/availability', { day, startTime, endTime });
      setAlert({ text: 'Slot added', type: 'success' });
      load();
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Could not add slot', type: 'error' });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this slot?')) return;
    try {
      await api.delete('/availability/' + id);
      load();
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Availability</h1>
        <p>Set the days and times you're open for tutoring sessions</p>
      </div>

      {alert.text && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>
      )}

      <div className="card">
        <h2>Add a slot</h2>
        <form onSubmit={submit} style={{ marginTop: '14px' }}>
          <div className="grid grid-3">
            <div className="form-group">
              <label htmlFor="day">Day</label>
              <select id="day" value={day} onChange={e => setDay(e.target.value)}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="start">Start</label>
              <input id="start" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="end">End</label>
              <input id="end" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Add slot</button>
        </form>
      </div>

      <div className="card">
        <h2>Current slots</h2>
        {slots.length === 0 ? (
          <p style={{ marginTop: '10px' }}>Nothing yet. Add some above so students can book you.</p>
        ) : (
          DAYS.map(d => {
            const dayRows = slots.filter(s => s.day === d);
            if (dayRows.length === 0) return null;
            return (
              <div key={d} style={{ marginTop: '12px' }}>
                <strong>{d}</strong>
                {dayRows.map(s => (
                  <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span>{s.startTime} &ndash; {s.endTime}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(s._id)}>Remove</button>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Availability;
