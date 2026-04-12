import { useState, useEffect } from 'react';
import api from '../../services/api';

const CATEGORIES = [
  'General', 'Mathematics', 'Science', 'English',
  'History', 'Computer Science', 'Study Tips', 'Tutoring', 'Other'
];

function Forum() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('General');
  const [filterCat, setFilterCat] = useState('All');
  const [selected, setSelected] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyBody, setReplyBody] = useState('');
  const [alert, setAlert] = useState({ text: '', type: '' });

  useEffect(() => { load(); }, [filterCat]);

  const load = async () => {
    try {
      const params = filterCat !== 'All' ? `?category=${encodeURIComponent(filterCat)}` : '';
      const res = await api.get('/forum/posts' + params);
      setPosts(res.data.posts || []);
    } catch {}
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/forum/posts', { title, body, category });
      setTitle(''); setBody('');
      load();
    } catch (err) {
      setAlert({ text: err.response?.data?.error || 'Could not post', type: 'error' });
    }
  };

  const openPost = async (post) => {
    try {
      const res = await api.get('/forum/posts/' + post._id);
      setSelected(res.data.post);
      setReplies(res.data.replies || []);
    } catch {}
  };

  const submitReply = async () => {
    if (!replyBody.trim() || !selected) return;
    try {
      await api.post(`/forum/posts/${selected._id}/replies`, { body: replyBody });
      setReplyBody('');
      openPost(selected);
    } catch {}
  };

  const likePost = async (postId) => {
    try {
      await api.post(`/forum/posts/${postId}/like`);
      load();
      if (selected?._id === postId) openPost(selected);
    } catch {}
  };

  const back = () => { setSelected(null); setReplies([]); };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <button className="btn btn-secondary btn-sm" onClick={back} style={{ marginBottom: '10px' }}>Back to posts</button>
          <h1>{selected.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {selected.author_name} &middot; {selected.category} &middot; {new Date(selected.created_at).toLocaleString()}
          </p>
        </div>

        <div className="card">
          <p>{selected.body}</p>
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => likePost(selected._id)}>
              {selected.likes?.length || 0} likes
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selected.reply_count} replies</span>
          </div>
        </div>

        <div className="card">
          <h2>Replies</h2>
          {replies.length === 0 ? (
            <p style={{ marginTop: '10px' }}>No replies yet.</p>
          ) : (
            replies.map(r => (
              <div key={r._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {r.author_name} &middot; {new Date(r.created_at).toLocaleString()}
                </div>
                <div style={{ marginTop: '4px' }}>{r.body}</div>
              </div>
            ))
          )}

          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
            <input
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary btn-sm" onClick={submitReply}>Reply</button>
          </div>
        </div>
      </div>
    );
  }

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
              <label htmlFor="p-cat">Category</label>
              <select id="p-cat" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2>Posts</h2>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto' }}>
            <option value="All">All categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {posts.length === 0 ? (
          <p style={{ marginTop: '10px' }}>No posts yet. Be the first.</p>
        ) : (
          posts.map(p => (
            <div key={p._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => openPost(p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{p.is_pinned ? '[ Pinned ] ' : ''}{p.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {p.author_name} &middot; {p.category} &middot; {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <span>{p.likes?.length || 0} likes</span>
                  <span>{p.reply_count || 0} replies</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Forum;
