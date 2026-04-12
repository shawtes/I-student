import { useState, useEffect } from 'react';
import api from '../../services/api';

const CATEGORIES = [
  'Bug Report', 'Account Issue', 'Billing / Payment',
  'Tutoring Issue', 'General Question', 'Feature Request'
];

const STATUS_COLORS = {
  open: 'badge-blue',
  in_progress: 'badge-blue',
  resolved: 'badge-blue',
  closed: 'badge-blue',
};

function HelpDesk() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General Question');
  const [selected, setSelected] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/helpdesk/tickets');
      setTickets(res.data.tickets || []);
    } catch {}
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/helpdesk/tickets', { subject, description, category });
      setSubject(''); setDescription('');
      setAlert({ text: 'Ticket submitted', type: 'success' });
      load();
    } catch (err) {
      setAlert({ text: err.response?.data?.error || 'Could not submit', type: 'error' });
    }
  };

  const openTicket = async (t) => {
    try {
      const res = await api.get('/helpdesk/tickets/' + t._id);
      setSelected(res.data.ticket);
    } catch {}
  };

  const sendReply = async () => {
    if (!replyBody.trim() || !selected) return;
    try {
      const res = await api.post(`/helpdesk/tickets/${selected._id}/messages`, { body: replyBody });
      setSelected(prev => ({
        ...prev,
        status: res.data.status,
        messages: [...prev.messages, res.data.message]
      }));
      setReplyBody('');
    } catch {}
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: '10px' }}>Back</button>
          <h1>{selected.subject}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {selected.ticket_number} &middot; {selected.category} &middot; <span className={`badge ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
          </p>
        </div>

        <div className="card">
          <h2>Conversation</h2>
          {(selected.messages || []).map((msg, i) => (
            <div key={msg._id || i} style={{
              padding: '10px 0',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>{msg.sender_name}</strong>
                {msg.sender_role === 'admin' && ' (Support)'}
                {' '}&middot; {new Date(msg.sent_at).toLocaleString()}
              </div>
              <div style={{ marginTop: '4px' }}>{msg.body}</div>
            </div>
          ))}

          {selected.status !== 'closed' ? (
            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
              <input
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Type a reply..."
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={sendReply}>Send</button>
            </div>
          ) : (
            <p style={{ marginTop: '14px', color: 'var(--text-muted)' }}>This ticket is closed.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Help Desk</h1>
        <p>Need help? Submit a ticket and our team will respond.</p>
      </div>

      {alert.text && (
        <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>{alert.text}</div>
      )}

      <div className="card">
        <h2>New ticket</h2>
        <form onSubmit={submit} style={{ marginTop: '14px' }}>
          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="subj">Subject</label>
              <input id="subj" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="cat">Category</label>
              <select id="cat" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="desc">Description</label>
            <textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} rows="4" required />
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
        </form>
      </div>

      <div className="card">
        <h2>My tickets</h2>
        {tickets.length === 0 ? (
          <p style={{ marginTop: '10px' }}>No tickets yet.</p>
        ) : (
          tickets.map(t => (
            <div key={t._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => openTicket(t)}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{t.subject}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t.ticket_number} &middot; {t.category} &middot; {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`badge ${STATUS_COLORS[t.status]}`}>{t.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HelpDesk;
