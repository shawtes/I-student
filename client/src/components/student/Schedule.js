import { useState } from 'react';
import api from '../../services/api';

function Schedule() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/scheduling/sessions', formData);
      setMessage('Session scheduled successfully!');
      setFormData({ title: '', description: '', startTime: '', endTime: '' });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Scheduling failed');
    }
  };

  return (
    <div>
      <h1>Schedule</h1>
      <p>Plan your study sessions and manage your availability</p>

      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}

      <div className="card">
        <h2>Schedule Study Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">Schedule Session</button>
        </form>
      </div>

      <div className="card">
        <h2>Upcoming Sessions</h2>
        <p>No sessions scheduled yet.</p>
      </div>
    </div>
  );
}

export default Schedule;
