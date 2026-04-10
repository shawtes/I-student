import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';

function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(pct);
        }
      });
      setMessage({ text: `"${file.name}" uploaded to S3 successfully`, type: 'success' });
      loadFiles();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      uploadFile(droppedFiles[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await api.get(`/files/${fileId}/download`);
      const link = document.createElement('a');
      link.href = response.data.url;
      link.download = response.data.filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setMessage({ text: 'Download failed', type: 'error' });
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      setMessage({ text: 'File deleted', type: 'success' });
      loadFiles();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Delete failed', type: 'error' });
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (type) => {
    if (!type) return 'doc';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('word') || type.includes('document')) return 'DOC';
    if (type.includes('audio')) return 'AUD';
    if (type.includes('video')) return 'VID';
    if (type.includes('text')) return 'TXT';
    return 'FILE';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Files</h1>
        <p>Upload and manage your study materials — stored securely on AWS S3</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* Dropzone */}
      <div
        className={`dropzone ${dragActive ? 'dropzone-active' : ''} ${uploading ? 'dropzone-uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.m4a"
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div className="dropzone-progress">
            <div className="dropzone-icon">Uploading...</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <div className="dropzone-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
              {dragActive ? 'Drop your file here' : 'Drag & drop a file here'}
            </p>
            <p style={{ fontSize: '0.82rem' }}>
              or click to browse — PDF, DOC, TXT, audio, video up to 100 MB
            </p>
          </>
        )}
      </div>

      {/* File list */}
      <div className="card">
        <h2>My files</h2>
        {loading ? (
          <div className="loading">Loading files...</div>
        ) : files.length === 0 ? (
          <p style={{ marginTop: '12px' }}>No files uploaded yet. Drop a file above to get started.</p>
        ) : (
          <div className="table-wrap" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file._id}>
                    <td><span className="file-type-badge">{getFileIcon(file.fileType)}</span></td>
                    <td style={{ fontWeight: 500 }}>{file.originalName}</td>
                    <td>{formatSize(file.fileSize)}</td>
                    <td>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleDownload(file._id)} className="btn btn-secondary btn-sm">Download</button>
                      <button onClick={() => handleDelete(file._id)} className="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Files;
