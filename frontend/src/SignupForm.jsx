import { useState } from 'react';
import './LoginForm.css';

export default function SignupForm({ onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState('');
  const [college, setCollege] = useState('');

  // Signup OTP
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Status
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : 'https://imeta-1.vercel.app';

  // Validation helpers
  const validateName = (val) => {
    const regex = /^[a-zA-Z\s]+$/;
    return regex.test(val.trim());
  };

  const validateEmail = (val) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(val.trim());
  };

  const validatePassword = (val) => {
    if (val.length < 6) return false;
    const regex = /^(?=.*[A-Za-z])(?=.*[\d\W]).{6,}$/;
    return regex.test(val);
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return { width: '0%', color: '#64748b', text: '' };
    if (password.length < 6) return { width: '33%', color: '#ef4444', text: 'Weak' };
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumOrSpec = /[\d\W]/.test(password);
    if (password.length >= 8 && hasLetter && hasNumOrSpec) {
      return { width: '100%', color: '#10b981', text: 'Strong' };
    }
    return { width: '66%', color: '#f59e0b', text: 'Medium' };
  };

  const strength = getPasswordStrength();

  // Send signup OTP
  const handleSendOtp = async () => {
    if (!email) {
      setIsSuccess(false);
      setMessage('Enter your email address first.');
      return;
    }

    if (!validateEmail(email)) {
      setIsSuccess(false);
      setMessage('Please enter a valid email address (e.g. user@gmail.com).');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch(`${API_BASE_URL}/api/send-signup-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtp('');
        setIsSuccess(true);
        setMessage('OTP generated. Check the browser console (F12)!');
        console.log('================================');
        console.log(`Signup OTP for ${email}: ${data.otp}`);
        console.log('OTP valid for 5 minutes');
        console.log('================================');
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to generate OTP.');
      }
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setMessage('Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Verify signup OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      setIsSuccess(false);
      setMessage('Please enter the OTP.');
      return;
    }

    if (otp.length !== 6) {
      setIsSuccess(false);
      setMessage('OTP must contain 6 digits.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch(`${API_BASE_URL}/api/verify-signup-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setIsSuccess(true);
        setMessage('OTP verified! You can now complete registration.');
      } else {
        setOtpVerified(false);
        setIsSuccess(false);
        setMessage(data.message || 'Invalid OTP.');
      }
    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setMessage('Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Submit signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!name || !validateName(name)) {
      setIsSuccess(false);
      setMessage('Full Name can only contain letters and spaces (no numbers or special characters).');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setIsSuccess(false);
      setMessage('Please enter a valid email address (e.g. user@gmail.com).');
      setLoading(false);
      return;
    }

    if (!otpVerified) {
      setIsSuccess(false);
      setMessage('Please verify your email address with OTP before completing registration.');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setIsSuccess(false);
      setMessage('Password must be at least 6 characters long and include letters and numbers or special characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setIsSuccess(false);
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
      setIsSuccess(false);
      setMessage('Please enter a valid age between 13 and 120.');
      setLoading(false);
      return;
    }

    if (!college || !college.trim()) {
      setIsSuccess(false);
      setMessage('College / University is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          age,
          college
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          if (onSwitchToLogin) {
            onSwitchToLogin();
          }
        }, 1500);
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Registration failed.');
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
    <div className="auth-card auth-card-wide">
      <div className="brand-header">
        <div className="brand-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <polyline points="17 11 19 13 23 9"/>
          </svg>
          Student Registration
        </div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Verify your email and complete registration</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="input-wrapper">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                setName(sanitized);
              }}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Email & OTP Request */}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtp('');
                }}
                className="form-input"
                required
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || !email || !validateEmail(email) || otpVerified}
              className="action-btn-inline"
            >
              {otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>
        </div>

        {/* OTP Input & Verification */}
        {otpSent && (
          <div className="form-group">
            <label className="form-label">Enter 6-Digit OTP</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setOtp(value.slice(0, 6));
                  }}
                  maxLength="6"
                  className="form-input"
                  disabled={otpVerified}
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6 || otpVerified}
                className="action-btn-inline"
              >
                {otpVerified ? '✓ Verified' : 'Verify OTP'}
              </button>
            </div>
            {otpVerified && (
              <div style={{ marginTop: '8px', color: '#34d399', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Email verified with OTP
              </div>
            )}
          </div>
        )}

        {/* Age and College */}
        <div className="form-row">
          <div className="form-col-1">
            <label className="form-label">Age</label>
            <div className="input-wrapper">
              <input
                type="number"
                placeholder="20"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="form-input form-input-no-icon"
                required
              />
            </div>
          </div>
          <div className="form-col-2">
            <label className="form-label">College / University</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="MIT, Stanford, etc."
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="form-input form-input-no-icon"
                required
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-wrapper">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {/* Password Strength Indicator */}
          {password && (
            <div className="strength-meter">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{ width: strength.width, backgroundColor: strength.color }}
                ></div>
              </div>
              <span className="strength-text" style={{ color: strength.color }}>
                {strength.text}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div className="input-wrapper">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !otpVerified}
          className="submit-btn"
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            <>
              Register Account
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Message Banner */}
      {message && (
        <div className={`feedback-banner ${isSuccess ? 'success' : 'error'}`}>
          {isSuccess ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
          {message}
        </div>
      )}

      {/* Switch mode */}
      <div className="toggle-text">
        Already registered?{' '}
        <span onClick={onSwitchToLogin} className="toggle-link">
          Log In
        </span>
      </div>
    </div>
  );
}
