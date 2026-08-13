import { useState } from 'react';
import './LoginForm.css';

export default function AuthForm() {
  const [isSignup, setIsSignup] = useState(false);
  const [user, setUser] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [college, setCollege] = useState('');

  // Status & Feedback States
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setMessage('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAge('');
    setCollege('');
  };

  const handleLogout = () => {
    setUser(null);
    setMessage('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignup && password !== confirmPassword) {
      setIsSuccess(false);
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Replace localhost with your live Vercel backend URL
const BACKEND_BASE_URL = 'https://imeta-1.vercel.app/'; 

const endpoint = isSignup
  ? `${BACKEND_BASE_URL}/api/signup`
  : `${BACKEND_BASE_URL}/api/login`;

      const payload = isSignup
        ? { name, email, password, age, college }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message);

        if (isSignup) {
          setTimeout(() => {
            setIsSignup(false);
            setMessage('Account created successfully! Please log in.');
          }, 1500);
        } else {
          setUser(data.user);
        }
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Action failed.');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // DASHBOARD VIEW (Shown when user is logged in)
  if (user) {
    return (
      <div className="auth-card">
        <h2 className="dashboard-title">Welcome, {user.name}!</h2>
        <p className="dashboard-subtitle">
          Your account is verified and authenticated.
        </p>

        <div className="profile-box">
          <div className="profile-row">
            <strong>Full Name:</strong> <span>{user.name}</span>
          </div>
          <div className="profile-row">
            <strong>Email:</strong> <span>{user.email}</span>
          </div>
          <div className="profile-row">
            <strong>Age:</strong> <span>{user.age} years old</span>
          </div>
          <div className="profile-row">
            <strong>College:</strong> <span>{user.college}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          Log Out
        </button>
      </div>
    );
  }

  // AUTHENTICATION FORM VIEW (Login / Signup)
  return (
    <div className="auth-card">
      <h2 className="auth-title">
        {isSignup ? 'Student Registration' : 'Welcome Back'}
      </h2>

      <form onSubmit={handleSubmit}>
        {isSignup && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="text"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </div>

        {isSignup && (
          <div className="form-row">
            <div className="form-col-1">
              <label className="form-label">Age</label>
              <input
                type="number"
                placeholder="20"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-col-2">
              <label className="form-label">College / University</label>
              <input
                type="text"
                placeholder="MIT, Harvard, etc."
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>

        {isSignup && (
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
            />
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Processing...' : isSignup ? 'Register' : 'Log In'}
        </button>
      </form>

      {message && (
        <div className={`feedback-message ${isSuccess ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="toggle-text">
        {isSignup ? 'Already registered? ' : "Need an account? "}
        <span onClick={toggleMode} className="toggle-link">
          {isSignup ? 'Log In' : 'Sign Up'}
        </span>
      </div>
    </div>
  );
}