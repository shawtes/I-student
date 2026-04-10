import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Files from './Files';
import Tutoring from './Tutoring';
import StudyTools from './StudyTools';
import Schedule from './Schedule';
import Partners from './Partners';
import GradeCalculator from './GradeCalculator';
import FindTutor from './FindTutor';
import Bookings from './Bookings';
import Progress from './Progress';
import HelpDesk from './HelpDesk';
import Forum from './Forum';
import Flashcards from './Flashcards';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/student', label: 'Home' },
    { path: '/student/files', label: 'Files' },
    { path: '/student/tutoring', label: 'AI Tutor' },
    { path: '/student/find-tutor', label: 'Find Tutor' },
    { path: '/student/bookings', label: 'Bookings' },
    { path: '/student/study', label: 'Study' },
    { path: '/student/flashcards', label: 'Cards' },
    { path: '/student/forum', label: 'Forum' },
    { path: '/student/partners', label: 'Groups' },
    { path: '/student/progress', label: 'Progress' },
    { path: '/student/grades', label: 'Grades' },
    { path: '/student/help', label: 'Help' },
  ];

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <span className="nav-brand">I-Student</span>
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
          <Route path="/" element={<DashboardHome />} />
          <Route path="/files" element={<Files />} />
          <Route path="/tutoring" element={<Tutoring />} />
          <Route path="/study" element={<StudyTools />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/grades" element={<GradeCalculator />} />
          <Route path="/find-tutor" element={<FindTutor />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/help" element={<HelpDesk />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/flashcards" element={<Flashcards />} />
        </Routes>
      </div>
    </div>
  );
}

function DashboardHome() {
  const features = [
    { title: 'Files', desc: 'Upload and manage your study materials in one place.', link: '/student/files', color: 'var(--accent-light)', textColor: 'var(--accent)', initials: 'Fi' },
    { title: 'AI Tutor', desc: 'Ask questions grounded in your uploaded notes and readings.', link: '/student/tutoring', color: 'var(--green-light)', textColor: 'var(--green)', initials: 'Ai' },
    { title: 'Study Tools', desc: 'Auto-generate quizzes, flashcards, and study guides.', link: '/student/study', color: 'var(--purple-light)', textColor: 'var(--purple)', initials: 'St' },
    { title: 'Schedule', desc: 'Plan and track your study sessions.', link: '/student/schedule', color: 'var(--orange-light)', textColor: 'var(--orange)', initials: 'Sc' },
    { title: 'Groups', desc: 'Find study partners and collaborate.', link: '/student/partners', color: 'var(--accent-light)', textColor: 'var(--accent)', initials: 'Gr' },
    { title: 'Grades', desc: 'Calculate your current grade with weighted categories.', link: '/student/grades', color: 'var(--green-light)', textColor: 'var(--green)', initials: 'Gd' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your workspace at a glance</p>
      </div>
      <div className="grid grid-3">
        {features.map(f => (
          <Link key={f.title} to={f.link} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: f.color, color: f.textColor }}>{f.initials}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span style={{ fontSize: '0.825rem', fontWeight: 550, color: 'var(--accent)' }}>Open &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
