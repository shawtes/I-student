import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DevLogin from './components/auth/DevLogin';
import StudentDashboard from './components/student/Dashboard';
import AdminDashboard from './components/admin/Dashboard';
import TutorDashboard from './components/tutor/Dashboard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: '#666', marginTop: '8px' }}>Please refresh the page or try again later.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '10px 20px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', background: '#fff' }}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dev-login" element={<DevLogin />} />
            <Route path="/student/*" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/tutor/*" element={<ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}`} />;
  }

  return children;
}

export default App;
