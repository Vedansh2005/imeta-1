import { useState } from 'react';
import './LoginForm.css';

export default function SignupForm({ onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    <div className="auth-card">
      <h2 className="auth-title">Student Registration</h2>

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
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

        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ display: 'flex', gap: '10px' }}>
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
              style={{ flex: 1 }}
              required
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || !email || !validateEmail(email) || otpVerified}
              className="submit-btn"
              style={{ width: '130px', marginTop: 0 }}
            >
              {otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>
        </div>

        {/* OTP Input */}
        {otpSent && (
          <div className="form-group">
            <label className="form-label">Enter OTP</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setOtp(value.slice(0, 6));
                }}
                maxLength="6"
                className="form-input"
                style={{ flex: 1 }}
                disabled={otpVerified}
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6 || otpVerified}
                className="submit-btn"
                style={{ width: '130px', marginTop: 0 }}
              >
                {otpVerified ? 'Verified' : 'Verify OTP'}
              </button>
            </div>
            {otpVerified && (
              <div style={{ marginTop: '8px', color: 'green', fontSize: '14px' }}>
                ✓ Email verified successfully with OTP
              </div>
            )}
          </div>
        )}

        {/* Age and College */}
        <div className="form-row">
          <div className="form-col-1">
            <label className="form-label">Age</label>
            <input
              type="number"
              placeholder="20"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="form-input"
              required
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
              required
            />
          </div>
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

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !otpVerified}
          className="submit-btn"
        >
          {loading ? 'Processing...' : 'Register'}
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
        Already registered?{' '}
        <span onClick={onSwitchToLogin} className="toggle-link">
          Log In
        </span>
      </div>
    </div>
  );
}
