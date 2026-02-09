import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('File uploaded successfully!');
      setSelectedFile(null);
      e.target.reset();
      loadFiles();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/files/${fileId}`);
      setMessage('File deleted successfully');
      loadFiles();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Delete failed');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div>
      <h1>File Management</h1>

      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}

      <div className="card">
        <h2>Upload File</h2>
        <form onSubmit={handleUpload}>
          <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.m4a" />
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>My Files</h2>
        {loading ? (
          <div className="loading">Loading files...</div>
        ) : files.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Size</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Uploaded</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{file.originalName}</td>
                  <td style={{ padding: '10px' }}>{formatFileSize(file.fileSize)}</td>
                  <td style={{ padding: '10px' }}>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleDelete(file._id)} className="btn btn-danger" style={{ fontSize: '12px', padding: '5px 10px' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Files;
