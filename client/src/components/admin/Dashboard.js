import { useState, useEffect } from 'react';
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
    try { setStats((await api.get('/admin/stats')).data); }
    catch {} finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try { setUsers((await api.get('/admin/users')).data); } catch {}
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure?')) return;
    try { await api.delete(`/admin/users/${userId}`); loadUsers(); }
    catch { alert('Failed to delete user'); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const statCards = stats ? [
    { label: 'Total users', value: stats.users?.total || 0, sub: `${stats.users?.students || 0} students, ${stats.users?.admins || 0} admins`, color: 'var(--accent)' },
    { label: 'Files uploaded', value: stats.files || 0, color: 'var(--green)' },
    { label: 'Study groups', value: stats.groups || 0, color: 'var(--orange)' },
    { label: 'Study content', value: stats.studyContent || 0, color: 'var(--purple)' },
  ] : [];

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <span className="nav-brand">I-Student Admin</span>
          <div className="nav-right">
            <span className="nav-user">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">Log out</button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>System overview and user management</p>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {statCards.map(s => (
                <div className="card" key={s.label}>
                  <span className="stat-label">{s.label}</span>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  {s.sub && <p style={{ fontSize: '0.8rem', marginTop: '2px' }}>{s.sub}</p>}
                </div>
              ))}
            </div>

            <div className="card" style={{ marginTop: '8px' }}>
              <h2>Users</h2>
              {users.length === 0 ? (
                <p style={{ marginTop: '12px' }}>No users found.</p>
              ) : (
                <div className="table-wrap" style={{ marginTop: '12px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td style={{ fontWeight: 500 }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`badge ${u.role === 'admin' ? 'badge-orange' : 'badge-green'}`}>{u.role}</span>
                          </td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            {u._id !== user._id && (
                              <button onClick={() => handleDeleteUser(u._id)} className="btn btn-danger btn-sm">Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
