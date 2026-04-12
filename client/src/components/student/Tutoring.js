import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

function Tutoring() {
  // Conversations
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [convoFolder, setConvoFolder] = useState(null);

  // Files
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});

  // Folders
  const [folders, setFolders] = useState([]);
  const [filterFolder, setFilterFolder] = useState(null);

  // Input
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => { loadConvos(); loadFiles(); loadFolders(); }, []);
  useEffect(() => { loadConvos(); }, [filterFolder]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConvos = async () => {
    try {
      const params = filterFolder ? `?folder=${encodeURIComponent(filterFolder)}` : '';
      const res = await api.get('/tutoring/conversations' + params);
      setConvos(res.data);
    } catch {}
  };

  const loadFiles = async () => {
    try {
      const res = await api.get('/files');
      setFiles(res.data);
    } catch {}
  };

  const loadFolders = async () => {
    try {
      const res = await api.get('/tutoring/folders');
      setFolders(res.data);
    } catch {}
  };

  const openConvo = async (id) => {
    try {
      const res = await api.get('/tutoring/conversations/' + id);
      setActiveId(id);
      setMessages(res.data.messages || []);
      setConvoFolder(res.data.folder);
      setSelectedFiles(res.data.fileIds || []);
    } catch {}
  };

  const startNewChat = async () => {
    try {
      const res = await api.post('/tutoring/conversations', {
        folder: filterFolder || 'root',
        fileIds: selectedFiles
      });
      setActiveId(res.data._id);
      setMessages([]);
      setConvoFolder(res.data.folder);
      loadConvos();
    } catch {}
  };

  const deleteConvo = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    try {
      await api.delete('/tutoring/conversations/' + id);
      if (activeId === id) { setActiveId(null); setMessages([]); }
      loadConvos();
    } catch {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    let convoId = activeId;

    // Auto-create a conversation if none is active
    if (!convoId) {
      try {
        const res = await api.post('/tutoring/conversations', {
          folder: filterFolder || 'root',
          fileIds: selectedFiles
        });
        convoId = res.data._id;
        setActiveId(convoId);
      } catch { return; }
    }

    const userMsg = { role: 'user', content: question, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post(`/tutoring/conversations/${convoId}/messages`, {
        content: userMsg.content,
        fileIds: selectedFiles
      });
      setMessages(prev => [...prev, res.data.message]);
      loadConvos();
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. ' + (err.response?.data?.message || 'Please try again.'),
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (id) => {
    setSelectedFiles(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  // Group files by folder
  const grouped = {};
  for (const f of files) {
    const key = (!f.folder || f.folder === 'root') ? 'Unsorted' : f.folder;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  // Group conversations by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const convoGroups = { Today: [], Yesterday: [], Older: [] };
  for (const c of convos) {
    const d = new Date(c.updatedAt).toDateString();
    if (d === today) convoGroups.Today.push(c);
    else if (d === yesterday) convoGroups.Yesterday.push(c);
    else convoGroups.Older.push(c);
  }

  return (
    <div style={{ display: 'flex', gap: '12px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Left: File Explorer */}
      <div style={{ width: '220px', flexShrink: 0 }}>
        <div className="card" style={{ position: 'sticky', top: '80px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Files</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 10px' }}>
            Check files to use as reference
          </p>

          {Object.keys(grouped).length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No files uploaded yet</p>
          ) : (
            Object.entries(grouped).sort().map(([folder, folderFiles]) => (
              <div key={folder} style={{ marginBottom: '8px' }}>
                <div
                  onClick={() => toggleFolder(folder)}
                  style={{
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                    color: 'var(--accent)', padding: '4px 0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span>{expandedFolders[folder] === false ? '>' : 'v'} {folder}</span>
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{folderFiles.length}</span>
                </div>
                {expandedFolders[folder] !== false && folderFiles.map(f => (
                  <label key={f._id} style={{
                    display: 'flex', gap: '6px', alignItems: 'center',
                    padding: '3px 0 3px 12px', fontSize: '0.82rem', cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(f._id)}
                      onChange={() => toggleFile(f._id)}
                    />
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: selectedFiles.includes(f._id) ? 'var(--accent)' : 'inherit'
                    }}>
                      {f.originalName}
                    </span>
                  </label>
                ))}
              </div>
            ))
          )}

          {selectedFiles.length > 0 && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'var(--accent-light)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px' }}>
                Using as reference:
              </div>
              {files.filter(f => selectedFiles.includes(f._id)).map(f => (
                <div key={f._id} style={{ fontSize: '0.78rem', color: 'var(--accent)', padding: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  &#x2713; {f.originalName}
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '6px', width: '100%', fontSize: '0.75rem' }}
                onClick={() => setSelectedFiles([])}>
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center: Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 16px' }}>
                <h2 style={{ fontWeight: 600 }}>AI Tutor</h2>
                <p>Ask questions about your study materials. Select reference files on the left.</p>
                {selectedFiles.length > 0 && (
                  <p style={{ color: 'var(--accent)', marginTop: '8px' }}>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected as reference
                  </p>
                )}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  padding: '6px 0'
                }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                    color: msg.role === 'user' ? '#fff' : 'inherit',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    fontSize: '0.9rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '6px 0' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  fontSize: '0.9rem', color: 'var(--text-muted)'
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{
            display: 'flex', gap: '8px', padding: '12px 0 0',
            borderTop: '1px solid var(--border)'
          }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !question.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Right: Chat History */}
      <div style={{ width: '220px', flexShrink: 0 }}>
        <div className="card" style={{ position: 'sticky', top: '80px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', marginBottom: '10px' }} onClick={startNewChat}>
            + New Chat
          </button>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <select
              value={filterFolder || ''}
              onChange={(e) => setFilterFolder(e.target.value || null)}
              style={{ fontSize: '0.82rem', padding: '4px 8px' }}
            >
              <option value="">All classes</option>
              {folders.filter(f => f && f !== 'root').map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {convos.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No conversations yet</p>
          ) : (
            Object.entries(convoGroups).map(([label, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={label} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {label}
                  </div>
                  {items.map(c => (
                    <div
                      key={c._id}
                      onClick={() => openConvo(c._id)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        background: activeId === c._id ? 'var(--accent-light)' : 'transparent',
                        color: activeId === c._id ? 'var(--accent)' : 'inherit',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2px'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {c.title}
                      </span>
                      <button
                        onClick={(e) => deleteConvo(c._id, e)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 2px',
                          flexShrink: 0, visibility: activeId === c._id ? 'visible' : 'hidden'
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Tutoring;
