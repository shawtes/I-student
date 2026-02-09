import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Files from './Files';
import Tutoring from './Tutoring';
import StudyTools from './StudyTools';
import Schedule from './Schedule';
import Partners from './Partners';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
              <h2>I-Student</h2>
              <Link to="/student">Dashboard</Link>
              <Link to="/student/files">Files</Link>
              <Link to="/student/tutoring">AI Tutor</Link>
              <Link to="/student/study">Study Tools</Link>
              <Link to="/student/schedule">Schedule</Link>
              <Link to="/student/partners">Partners & Groups</Link>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span>Welcome, {user?.name}</span>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/files" element={<Files />} />
          <Route path="/tutoring" element={<Tutoring />} />
          <Route path="/study" element={<StudyTools />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/partners" element={<Partners />} />
        </Routes>
      </div>
    </div>
  );
}

function DashboardHome() {
  return (
    <div>
      <h1>Student Dashboard</h1>
      <div className="grid grid-3" style={{ marginTop: '20px' }}>
        <div className="card">
          <h3>📁 File Management</h3>
          <p>Upload and organize your study materials</p>
          <Link to="/student/files" className="btn btn-primary">Go to Files</Link>
        </div>
        
        <div className="card">
          <h3>🤖 AI Tutor</h3>
          <p>Get instant answers with RAG-based tutoring</p>
          <Link to="/student/tutoring" className="btn btn-primary">Start Tutoring</Link>
        </div>

        <div className="card">
          <h3>📚 Study Tools</h3>
          <p>Generate quizzes, flashcards, and guides</p>
          <Link to="/student/study" className="btn btn-primary">Study Tools</Link>
        </div>

        <div className="card">
          <h3>📅 Schedule</h3>
          <p>Plan your study sessions</p>
          <Link to="/student/schedule" className="btn btn-primary">View Schedule</Link>
        </div>

        <div className="card">
          <h3>👥 Study Partners</h3>
          <p>Find partners and join groups</p>
          <Link to="/student/partners" className="btn btn-primary">Find Partners</Link>
        </div>

        <div className="card">
          <h3>📊 Progress</h3>
          <p>Track your learning journey</p>
          <button className="btn btn-secondary">Coming Soon</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
