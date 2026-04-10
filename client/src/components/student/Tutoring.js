import { useState, useEffect } from 'react';
import api from '../../services/api';

function Tutoring() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnswer('');

    try {
      const response = await api.post('/tutoring/ask', { question, fileIds: selectedFiles });
      setAnswer(response.data.answer);
    } catch (error) {
      setAnswer('Something went wrong. ' + (error.response?.data?.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1>AI Tutor</h1>
        <p>Ask questions grounded in your study materials</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Ask a question</h2>
          <form onSubmit={handleSubmit} style={{ marginTop: '14px' }}>
            <div className="form-group">
              <label htmlFor="question">Your question</label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows="4"
                placeholder="What would you like to understand?"
                required
              />
            </div>

            {files.length > 0 && (
              <div className="form-group">
                <label>Reference files (optional)</label>
                <div className="file-select">
                  {files.map(file => (
                    <label key={file._id}>
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file._id)}
                        onChange={() => toggleFile(file._id)}
                      />
                      {file.originalName}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Response</h2>
          <div style={{ marginTop: '14px' }}>
            {loading ? (
              <div className="loading">Working on it...</div>
            ) : answer ? (
              <div className="answer-box">{answer}</div>
            ) : (
              <p>Ask a question and the answer will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tutoring;
