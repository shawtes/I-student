import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      loadUsers();
    } catch (error) {
      alert('Error deleting user');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="nav">
        <div className="container">
          <div className="nav-links" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <h2>I-Student Admin</h2>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span>Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container">
        <h1>Admin Dashboard</h1>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="grid grid-3">
              <div className="card">
                <h3>👥 Total Users</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {stats?.users.total || 0}
                </p>
                <p>Students: {stats?.users.students || 0} | Admins: {stats?.users.admins || 0}</p>
              </div>

              <div className="card">
                <h3>📁 Files Uploaded</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>
                  {stats?.files || 0}
                </p>
              </div>

              <div className="card">
                <h3>👥 Study Groups</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800' }}>
                  {stats?.groups || 0}
                </p>
              </div>

              <div className="card">
                <h3>📚 Study Content</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {stats?.studyContent || 0}
                </p>
              </div>
            </div>

            <div className="card">
              <h2>User Management</h2>
              {users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Role</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Joined</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{u.name}</td>
                        <td style={{ padding: '10px' }}>{u.email}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: u.role === 'admin' ? '#ff9800' : '#4CAF50',
                            color: 'white',
                            fontSize: '12px'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '10px' }}>
                          {u._id !== user._id && (
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="btn btn-danger"
                              style={{ fontSize: '12px', padding: '5px 10px' }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
