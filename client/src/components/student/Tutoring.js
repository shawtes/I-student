import { useState, useEffect } from 'react';
import api from '../../services/api';

function Tutoring() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnswer('');

    try {
      const response = await api.post('/tutoring/ask', {
        question,
        fileIds: selectedFiles
      });
      setAnswer(response.data.answer);
    } catch (error) {
      setAnswer('Error: ' + (error.response?.data?.message || 'Failed to get answer'));
    } finally {
      setLoading(false);
    }
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  return (
    <div>
      <h1>AI Tutor (RAG)</h1>
      <p>Ask questions and get answers grounded in your study materials</p>

      <div className="grid grid-2">
        <div className="card">
          <h2>Your Question</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows="4"
                placeholder="Ask any question about your study materials..."
                required
              />
            </div>

            <div className="form-group">
              <label>Select Files (optional)</label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                {files.length === 0 ? (
                  <p>No files available. Upload files first.</p>
                ) : (
                  files.map(file => (
                    <div key={file._id} style={{ marginBottom: '5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file._id)}
                          onChange={() => toggleFileSelection(file._id)}
                          style={{ width: 'auto', marginRight: '10px' }}
                        />
                        {file.originalName}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Getting Answer...' : 'Ask'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Answer</h2>
          {loading ? (
            <div className="loading">Thinking...</div>
          ) : answer ? (
            <div style={{ padding: '15px', background: '#f9f9f9', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
              {answer}
            </div>
          ) : (
            <p style={{ color: '#999' }}>Your answer will appear here...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tutoring;
