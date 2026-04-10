import { useState, useEffect } from 'react';
import api from '../../services/api';

function Forum() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [replyBody, setReplyBody] = useState({});
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await api.get('/forum');
      setPosts(res.data);
    } catch {}
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/forum', { title, body, subject });
      setTitle(''); setBody(''); setSubject('');
      load();
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Could not post', type: 'error' });
    }
  };

  const reply = async (postId) => {
    const b = replyBody[postId];
    if (!b) return;
    try {
      await api.post(`/forum/${postId}/replies`, { body: b });
      setReplyBody({ ...replyBody, [postId]: '' });
      load();
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h1>Forum</h1>
        <p>Discuss courses and share tips with other students</p>
      </div>

      {alert.text && <div className="alert alert-error">{alert.text}</div>}

      <div className="card">
        <h2>New post</h2>
        <form onSubmit={submit} style={{ marginTop: '14px' }}>
          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="p-title">Title</label>
              <input id="p-title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="p-subject">Subject (optional)</label>
              <input id="p-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Calc II" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="p-body">Body</label>
            <textarea id="p-body" value={body} onChange={e => setBody(e.target.value)} rows="3" required />
          </div>
          <button className="btn btn-primary" type="submit">Post</button>
        </form>
      </div>

      <div className="card">
        <h2>Recent posts</h2>
        {posts.length === 0 ? (
          <p style={{ marginTop: '10px' }}>Be the first to post something.</p>
        ) : (
          posts.map(p => (
            <div key={p._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <h3>{p.title}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {p.author?.name} &middot; {new Date(p.createdAt).toLocaleString()}
                {p.subject && <> &middot; {p.subject}</>}
              </div>
              <p style={{ marginTop: '8px' }}>{p.body}</p>

              {p.replies?.length > 0 && (
                <div style={{ marginTop: '10px', paddingLeft: '14px', borderLeft: '2px solid var(--border)' }}>
                  {p.replies.map((r, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {r.author?.name} &middot; {new Date(r.createdAt).toLocaleString()}
                      </div>
                      <div>{r.body}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <input
                  value={replyBody[p._id] || ''}
                  onChange={e => setReplyBody({ ...replyBody, [p._id]: e.target.value })}
                  placeholder="Write a reply..."
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary btn-sm" onClick={() => reply(p._id)}>Reply</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Forum;
