import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { GSU_COURSES } from '../../data/gsuCourses';

const courseOptions = ['Unsorted', ...GSU_COURSES.map(c => c.code)];

function Files() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { loadFiles(); loadFolders(); }, [activeFolder]);

  const loadFiles = async () => {
    try {
      const params = activeFolder && activeFolder !== 'All' ? `?folder=${encodeURIComponent(activeFolder === 'Unsorted' ? 'root' : activeFolder)}` : '';
      const res = await api.get('/files' + params);
      setFiles(res.data);
    } catch {}
  };

  const loadFolders = async () => {
    try {
      const res = await api.get('/files/folders');
      setFolders(res.data);
    } catch {}
  };

  const uploadFile = useCallback(async (file) => {
    setUploading(true);
    setProgress(0);
    setMessage({ text: '', type: '' });
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (activeFolder && activeFolder !== 'All') {
        formData.append('folder', activeFolder === 'Unsorted' ? 'root' : activeFolder);
      }
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100))
      });
      setMessage({ text: `Uploaded ${file.name}`, type: 'success' });
      loadFiles();
      loadFolders();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [activeFolder]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  const deleteFile = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await api.delete(`/files/${id}`);
      loadFiles();
    } catch {}
  };

  const downloadFile = async (id) => {
    try {
      const res = await api.get(`/files/${id}/download`);
      window.open(res.data.url, '_blank');
    } catch {}
  };

  const moveFile = async (id, folder) => {
    try {
      await api.put(`/files/${id}`, { folder: folder === 'Unsorted' ? 'root' : folder });
      loadFiles();
      loadFolders();
    } catch {}
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const folderLabel = (f) => (!f || f === 'root') ? 'Unsorted' : f;

  const allFolders = [...new Set(['All', ...folders.map(folderLabel)])];

  return (
    <div>
      <div className="page-header">
        <h1>Files</h1>
        <p>Upload and organize study materials by class</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>{message.text}</div>
      )}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {allFolders.map(f => (
          <button
            key={f}
            className={`btn btn-sm ${(activeFolder || 'All') === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveFolder(f === 'All' ? null : f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        className="card"
        style={{
          border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)',
          textAlign: 'center', padding: '32px', cursor: 'pointer',
          background: dragOver ? 'var(--accent-light)' : 'var(--bg)'
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input id="file-input" type="file" style={{ display: 'none' }} onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.m4a" />
        {uploading ? (
          <div>
            <p>Uploading... {progress}%</p>
            <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', marginTop: '8px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
            </div>
          </div>
        ) : (
          <p>Drop a file here or click to browse
            {activeFolder && activeFolder !== 'All' && <span style={{ color: 'var(--accent)' }}> (uploads to {activeFolder})</span>}
          </p>
        )}
      </div>

      <div className="card" style={{ marginTop: '12px' }}>
        {files.length === 0 ? (
          <p>No files{activeFolder && activeFolder !== 'All' ? ` in ${activeFolder}` : ''}. Upload something above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Folder</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {files.map(f => (
                  <tr key={f._id}>
                    <td style={{ fontWeight: 500 }}>{f.originalName}</td>
                    <td>
                      <select
                        value={folderLabel(f.folder)}
                        onChange={(e) => moveFile(f._id, e.target.value)}
                        style={{ fontSize: '0.85rem', padding: '2px 6px', width: 'auto' }}
                      >
                        {courseOptions.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatSize(f.fileSize)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(f.uploadedAt).toLocaleDateString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => downloadFile(f._id)}>Download</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteFile(f._id)}>Delete</button>
                      </div>
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
