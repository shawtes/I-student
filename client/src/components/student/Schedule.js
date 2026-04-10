import { useState } from 'react';
import api from '../../services/api';

function Schedule() {
  const [formData, setFormData] = useState({
    title: '', description: '', startTime: '', endTime: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/scheduling/sessions', formData);
      setMessage({ text: 'Session scheduled', type: 'success' });
      setFormData({ title: '', description: '', startTime: '', endTime: '' });
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Scheduling failed', type: 'error' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Schedule</h1>
        <p>Plan and track your study sessions</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h2>New session</h2>
          <form onSubmit={handleSubmit} style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label htmlFor="s-title">Title</label>
              <input id="s-title" type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Calc II Review" required />
            </div>

            <div className="form-group">
              <label htmlFor="s-desc">Notes</label>
              <textarea id="s-desc" name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="What to focus on..." />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="s-start">Start</label>
                <input id="s-start" type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="s-end">End</label>
                <input id="s-end" type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">Schedule</button>
          </form>
        </div>

        <div className="card">
          <h2>Upcoming</h2>
          <p style={{ marginTop: '12px' }}>No sessions scheduled yet.</p>
        </div>
      </div>
    </div>
  );
}

export default Schedule;
