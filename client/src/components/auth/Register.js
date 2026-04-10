import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Register() {
  const [step, setStep] = useState('register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, confirmAccount, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(formData.email, formData.password, formData.name);
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmAccount(formData.email, confirmCode);
      const user = await login(formData.email, formData.password);
      navigate(`/${user?.role || 'student'}`);
    } catch (err) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirm') {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p className="auth-subtitle">
            We sent a verification code to <strong>{formData.email}</strong>
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleConfirm}>
            <div className="form-group">
              <label htmlFor="code">Verification code</label>
              <input
                id="code"
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder="6-digit code"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="auth-subtitle">Get started with I-Student</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Jane Doe" required />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@university.edu" required />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input id="reg-password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="At least 8 characters" required />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm">Confirm password</label>
            <input id="reg-confirm" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
