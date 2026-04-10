import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Availability from './Availability';
import Requests from './Requests';
import Profile from './Profile';

function TutorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/tutor', label: 'Home' },
    { path: '/tutor/requests', label: 'Requests' },
    { path: '/tutor/availability', label: 'Availability' },
    { path: '/tutor/profile', label: 'Profile' },
  ];

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <span className="nav-brand">I-Student &middot; Tutor</span>
            <div className="nav-links">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={location.pathname === item.path ? { color: 'var(--accent)', background: 'var(--accent-light)' } : {}}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="nav-right">
            <span className="nav-user">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">Log out</button>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
        <Routes>
          <Route path="/" element={<TutorHome />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}

function TutorHome() {
  const cards = [
    { title: 'Requests', desc: 'Accept or decline incoming session requests.', link: '/tutor/requests', color: 'var(--accent-light)', textColor: 'var(--accent)', initials: 'Rq' },
    { title: 'Availability', desc: 'Set the days and times you can tutor.', link: '/tutor/availability', color: 'var(--green-light)', textColor: 'var(--green)', initials: 'Av' },
    { title: 'Profile', desc: 'Subjects, rate, and bio visible to students.', link: '/tutor/profile', color: 'var(--purple-light)', textColor: 'var(--purple)', initials: 'Pr' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Tutor Dashboard</h1>
        <p>Manage your sessions, hours, and profile</p>
      </div>
      <div className="grid grid-3">
        {cards.map(c => (
          <Link key={c.title} to={c.link} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: c.color, color: c.textColor }}>{c.initials}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <span style={{ fontSize: '0.825rem', fontWeight: 550, color: 'var(--accent)' }}>Open &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TutorDashboard;
