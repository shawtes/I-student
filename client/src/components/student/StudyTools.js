import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function StudyTools() {
  const [contentType, setContentType] = useState('quiz');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [studyContent, setStudyContent] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadFiles();
    loadStudyContent();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadStudyContent = async () => {
    try {
      const response = await api.get('/study');
      setStudyContent(response.data);
    } catch (error) {
      console.error('Error loading study content:', error);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage('');

    try {
      await api.post('/study/generate', {
        type: contentType,
        title,
        topic,
        fileIds: selectedFiles
      });
      setMessage('Study content generated successfully!');
      setTitle('');
      setTopic('');
      setSelectedFiles([]);
      loadStudyContent();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm('Delete this study content?')) return;

    try {
      await api.delete(`/study/${contentId}`);
      setMessage('Content deleted successfully');
      loadStudyContent();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <h1>Study Tools</h1>
      <p>Generate quizzes, flashcards, and study guides from your materials</p>

      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}

      <div className="card">
        <h2>Generate Study Content</h2>
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Content Type</label>
            <select value={contentType} onChange={(e) => setContentType(e.target.value)}>
              <option value="quiz">Quiz</option>
              <option value="flashcard">Flashcards</option>
              <option value="guide">Study Guide</option>
            </select>
          </div>

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 5 Quiz"
              required
            />
          </div>

          <div className="form-group">
            <label>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis"
              required
            />
          </div>

          <div className="form-group">
            <label>Select Source Files (optional)</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
              {files.length === 0 ? (
                <p>No files available.</p>
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

          <button type="submit" className="btn btn-primary" disabled={generating}>
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>My Study Content</h2>
        {studyContent.length === 0 ? (
          <p>No study content generated yet.</p>
        ) : (
          <div className="grid grid-2">
            {studyContent.map(content => (
              <div key={content._id} className="card" style={{ background: '#f9f9f9' }}>
                <h3>{content.title}</h3>
                <p><strong>Type:</strong> {content.type}</p>
                <p><strong>Created:</strong> {new Date(content.createdAt).toLocaleDateString()}</p>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                  <button className="btn btn-danger" onClick={() => handleDelete(content._id)}>
                    Delete
                  </button>
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
