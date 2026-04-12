import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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
import MyClasses from './MyClasses';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userCourses, setUserCourses] = useState([]);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const res = await api.get('/auth/me');
      setUserCourses(res.data.courses || []);
    } catch {}
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => {
    if (path === '/student') return location.pathname === '/student';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        ...S.sidebar,
        width: sidebarOpen ? '240px' : '0px',
        padding: sidebarOpen ? '16px 12px' : '16px 0',
        overflow: sidebarOpen ? 'visible' : 'hidden',
      }}>
        {/* Logo + toggle */}
        <div style={S.sidebarHeader}>
          <Link to="/student" style={{ textDecoration: 'none' }}>
            <span style={S.logo}>I-Student</span>
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={S.menuBtn} aria-label="menu">
            {sidebarOpen ? '\u2715' : '\u2630'}
          </button>
        </div>

        {sidebarOpen && (
          <>
            {/* Main nav */}
            <nav style={{ marginTop: '8px' }}>
              <NavItem to="/student" label="Home" icon="H" active={isActive('/student') && location.pathname === '/student'} />
              <NavItem to="/student/files" label="My Files" icon="F" active={isActive('/student/files')} />
              <NavItem to="/student/partners" label="Study Groups" icon="G" active={isActive('/student/partners')} />
              <NavItem to="/student/forum" label="Forum" icon="D" active={isActive('/student/forum')} />
            </nav>

            <div style={S.divider} />

            {/* Your courses */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px 4px' }}>
              <span style={S.sectionHeader}>Your courses</span>
              <Link to="/student/classes" style={{ fontSize: '0.72rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Edit</Link>
            </div>
            {userCourses.length === 0 ? (
              <Link to="/student/classes" style={{ fontSize: '0.82rem', color: 'var(--accent)', padding: '4px 10px', textDecoration: 'none', display: 'block' }}>
                + Set up your classes
              </Link>
            ) : (
              userCourses.map(f => (
                <Link key={f} to={`/student/files?folder=${encodeURIComponent(f)}`}
                  style={{ ...S.courseItem, color: location.search.includes(f) ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  <span style={S.courseIcon}>&#x1F4C1;</span>
                  <span style={S.courseLabel}>{f}</span>
                </Link>
              ))
            )}

            <div style={S.divider} />

            {/* Study tools */}
            <div style={{ ...S.sectionHeader, padding: '8px 10px 4px' }}>Study tools</div>
            <NavItem to="/student/flashcards" label="Flashcards" icon="&#x1F4C7;" active={isActive('/student/flashcards')} color="var(--accent)" />
            <NavItem to="/student/study" label="Study Guides" icon="&#x1F4D6;" active={isActive('/student/study')} color="var(--purple)" />
            <NavItem to="/student/tutoring" label="AI Tutor" icon="&#x1F916;" active={isActive('/student/tutoring')} color="var(--green)" />
            <NavItem to="/student/grades" label="Grade Calculator" icon="&#x1F4CA;" active={isActive('/student/grades')} color="var(--orange)" />

            <div style={S.divider} />

            {/* Tutoring */}
            <div style={{ ...S.sectionHeader, padding: '8px 10px 4px' }}>Tutoring</div>
            <NavItem to="/student/find-tutor" label="Find a Tutor" icon="&#x1F50D;" active={isActive('/student/find-tutor')} />
            <NavItem to="/student/bookings" label="My Bookings" icon="&#x1F4C5;" active={isActive('/student/bookings')} />
            <NavItem to="/student/schedule" label="Schedule" icon="&#x1F552;" active={isActive('/student/schedule')} />
            <NavItem to="/student/progress" label="Progress" icon="&#x1F4C8;" active={isActive('/student/progress')} />

            <div style={S.divider} />

            <NavItem to="/student/help" label="Help Desk" icon="&#x2753;" active={isActive('/student/help')} />

            {/* User + logout */}
            <div style={S.userSection}>
              <div style={S.avatar}>{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.userName}>{user?.name || 'Student'}</div>
                <div style={S.userEmail}>{user?.email}</div>
              </div>
              <button onClick={handleLogout} style={S.logoutBtn} title="Log out">&#x2192;</button>
            </div>
          </>
        )}
      </aside>

      {/* Mobile toggle (when sidebar is closed) */}
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} style={S.mobileToggle} aria-label="Open menu">
          &#9776;
        </button>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px 48px' }}>
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
          <Route path="/classes" element={<MyClasses />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label, icon, active, color }) {
  return (
    <Link to={to} style={{
      ...S.navItem,
      background: active ? 'var(--accent-light)' : 'transparent',
      color: active ? 'var(--accent)' : (color || 'var(--text-secondary)'),
      fontWeight: active ? 600 : 500,
    }}>
      <span style={{ fontSize: '1rem', width: '22px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={S.navLabel}>{label}</span>
    </Link>
  );
}

function DashboardHome() {
  const features = [
    { title: 'AI Tutor', desc: 'Ask questions grounded in your notes and readings.', link: '/student/tutoring', color: 'var(--green-light)', textColor: 'var(--green)', icon: '&#x1F916;' },
    { title: 'Flashcards', desc: 'Generate flashcards from your study materials with AI.', link: '/student/flashcards', color: 'var(--accent-light)', textColor: 'var(--accent)', icon: '&#x1F4C7;' },
    { title: 'Study Guides', desc: 'Auto-generate quizzes, guides, and practice tests.', link: '/student/study', color: 'var(--purple-light)', textColor: 'var(--purple)', icon: '&#x1F4D6;' },
    { title: 'My Files', desc: 'Upload and organize materials by course.', link: '/student/files', color: 'var(--orange-light)', textColor: 'var(--orange)', icon: '&#x1F4C1;' },
    { title: 'Find a Tutor', desc: 'Search GSU tutors by subject and availability.', link: '/student/find-tutor', color: 'var(--green-light)', textColor: 'var(--green)', icon: '&#x1F50D;' },
    { title: 'Study Groups', desc: 'Create or join groups to study together.', link: '/student/partners', color: 'var(--accent-light)', textColor: 'var(--accent)', icon: '&#x1F465;' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back</h1>
        <p>Jump into your study tools</p>
      </div>
      <div className="grid grid-3">
        {features.map(f => (
          <Link key={f.title} to={f.link} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: f.color, color: f.textColor }}>
                <span dangerouslySetInnerHTML={{ __html: f.icon }} />
              </div>
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

const S = {
  sidebar: {
    background: '#fff', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
    position: 'sticky', top: 0, height: '100vh',
    overflowY: 'auto', transition: 'width 0.2s',
    zIndex: 100,
  },
  sidebarHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 8px 12px',
  },
  logo: {
    fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)',
    letterSpacing: '-0.02em',
  },
  menuBtn: {
    background: 'none', border: 'none', fontSize: '1.2rem',
    cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px',
  },
  divider: {
    height: '1px', background: 'var(--border)',
    margin: '10px 8px',
  },
  sectionHeader: {
    fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    margin: 0,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '7px 10px', borderRadius: '8px',
    textDecoration: 'none', fontSize: '0.88rem',
    marginBottom: '2px', transition: 'background 0.1s',
  },
  navLabel: {
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  courseItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '5px 10px', borderRadius: '6px',
    textDecoration: 'none', fontSize: '0.85rem',
    marginBottom: '1px',
  },
  courseIcon: { fontSize: '0.9rem', flexShrink: 0 },
  courseLabel: {
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  userSection: {
    marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 8px 4px', borderTop: '1px solid var(--border)',
  },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'var(--accent)', color: '#fff', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
  },
  userName: {
    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  userEmail: {
    fontSize: '0.72rem', color: 'var(--text-muted)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: '1.1rem', padding: '4px',
    flexShrink: 0,
  },
  mobileToggle: {
    position: 'fixed', top: '12px', left: '12px', zIndex: 200,
    background: '#fff', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '8px 12px', fontSize: '1.2rem', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
};

export default Dashboard;
