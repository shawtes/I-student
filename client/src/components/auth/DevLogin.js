import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Local-only login bypass. Hit /dev-login, pick a role, and you're in
// without needing Cognito. Only works if the backend is also running with
// DEV_AUTH=1 so the API calls authenticate via the x-dev-user header.
function DevLogin() {
  const { devLogin } = useAuth();
  const navigate = useNavigate();

  const pick = (role) => {
    devLogin(role);
    if (role === 'admin') navigate('/admin');
    else navigate('/student');
  };

  return (
    <div style={{ maxWidth: '480px', margin: '80px auto', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div className="card">
        <h1>Dev Login</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Bypass Cognito and log in as a fake user. Only works locally. Make
          sure the backend is running with <code>DEV_AUTH=1</code> in its env.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={() => pick('student')}>Log in as Student</button>
          <button className="btn btn-primary" onClick={() => pick('tutor')}>Log in as Tutor</button>
          <button className="btn btn-primary" onClick={() => pick('admin')}>Log in as Admin</button>
        </div>

        <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <strong>Pages you can visit after student login:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>/student - home</li>
            <li>/student/grades - grade calculator</li>
            <li>/student/find-tutor - search tutors</li>
            <li>/student/bookings - my bookings</li>
            <li>/student/flashcards - flashcards</li>
            <li>/student/forum - discussion</li>
            <li>/student/progress - progress tracking</li>
            <li>/student/help - help desk</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DevLogin;
