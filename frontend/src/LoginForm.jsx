import { useState } from 'react';
import './LoginForm.css';

export default function LoginForm({ onSwitchToSignup, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL =
    typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : 'https://imeta-1.vercel.app';

  const validateEmail = (val) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(val.trim());
  };

  const validatePassword = (val) => {
    if (val.length < 6) return false;
    const regex = /^(?=.*[A-Za-z])(?=.*[\d\W]).{6,}$/;
    return regex.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!validateEmail(email)) {
      setIsSuccess(false);
      setMessage('Please enter a valid email address (e.g. user@gmail.com).');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setIsSuccess(false);
      setMessage('Password must be at least 6 characters long and include letters and numbers or special characters.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Login successful!');
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setMessage('Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Welcome Back</h2>

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="submit-btn"
        >
          {loading ? 'Processing...' : 'Log In'}
        </button>
      </form>

      {/* Message */}
      {message && (
        <div className={`feedback-message ${isSuccess ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Switch mode */}
      <div className="toggle-text">
        Need an account?{' '}
        <span onClick={onSwitchToSignup} className="toggle-link">
          Sign Up
        </span>
      </div>
    </div>
  );
}