import { useState, useEffect } from 'react';
import api from '../../services/api';

function StudyTools() {
  const [contentType, setContentType] = useState('quiz');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [studyContent, setStudyContent] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadFiles();
    loadStudyContent();
  }, []);

  const loadFiles = async () => {
    try { setFiles((await api.get('/files')).data); } catch {}
  };

  const loadStudyContent = async () => {
    try { setStudyContent((await api.get('/study')).data); } catch {}
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage({ text: '', type: '' });

    try {
      await api.post('/study/generate', { type: contentType, title, topic, fileIds: selectedFiles });
      setMessage({ text: 'Content generated', type: 'success' });
      setTitle('');
      setTopic('');
      setSelectedFiles([]);
      loadStudyContent();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Generation failed', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const toggleFile = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Delete this content?')) return;
    try {
      await api.delete(`/study/${contentId}`);
      loadStudyContent();
    } catch {}
  };

  const typeLabels = { quiz: 'Quiz', flashcard: 'Flashcards', guide: 'Study Guide' };

  return (
    <div>
      <div className="page-header">
        <h1>Study Tools</h1>
        <p>Generate quizzes, flashcards, and study guides from your materials</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>
      )}

      <div className="card">
        <h2>Generate content</h2>
        <form onSubmit={handleGenerate} style={{ marginTop: '14px' }}>
          <div className="grid grid-3">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select id="type" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                <option value="quiz">Quiz</option>
                <option value="flashcard">Flashcards</option>
                <option value="guide">Study Guide</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="gen-title">Title</label>
              <input id="gen-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Review" required />
            </div>
            <div className="form-group">
              <label htmlFor="gen-topic">Topic</label>
              <input id="gen-topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Photosynthesis" required />
            </div>
          </div>

          {files.length > 0 && (
            <div className="form-group">
              <label>Source files (optional)</label>
              <div className="file-select">
                {files.map(file => (
                  <label key={file._id}>
                    <input type="checkbox" checked={selectedFiles.includes(file._id)} onChange={() => toggleFile(file._id)} />
                    {file.originalName}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={generating}>
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Saved content</h2>
        {studyContent.length === 0 ? (
          <p style={{ marginTop: '12px' }}>Nothing here yet. Generate some content above.</p>
        ) : (
          <div className="grid grid-2" style={{ marginTop: '14px' }}>
            {studyContent.map(content => (
              <div key={content._id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3>{content.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                      <span className="badge badge-blue">{typeLabels[content.type] || content.type}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(content.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(content._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyTools;
