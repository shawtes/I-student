import { useState, useEffect } from 'react';
import api from '../../services/api';

function HelpDesk() {
  const [tickets, setTickets] = useState([]);
  const [category, setCategory] = useState('technical');
  const [message, setMessage] = useState('');
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch {}
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tickets', { category, message });
      setMessage('');
      setAlert({ text: 'Ticket submitted', type: 'success' });
      load();
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Could not submit', type: 'error' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Help Desk</h1>
        <p>Need help? Send us a ticket and an admin will respond.</p>
      </div>

      {alert.text && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>
      )}

      <div className="card">
        <h2>New ticket</h2>
        <form onSubmit={submit} style={{ marginTop: '14px' }}>
          <div className="form-group">
            <label htmlFor="cat">Category</label>
            <select id="cat" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="technical">Technical</option>
              <option value="account">Account</option>
              <option value="tutoring">Tutoring</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="msg">Describe the problem</label>
            <textarea id="msg" value={message} onChange={e => setMessage(e.target.value)} rows="4" required />
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      </div>

      <div className="card">
        <h2>My tickets</h2>
        {tickets.length === 0 ? (
          <p style={{ marginTop: '10px' }}>Nothing open.</p>
        ) : (
          tickets.map(t => (
            <div key={t._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{t.category}</strong>
                <span className="badge badge-blue">{t.status}</span>
              </div>
              <p style={{ marginTop: '6px' }}>{t.message}</p>
              {t.response && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg)', borderRadius: '4px' }}>
                  <strong>Response:</strong> {t.response}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HelpDesk;
