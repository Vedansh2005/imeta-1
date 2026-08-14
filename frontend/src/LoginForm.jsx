import { useState } from 'react';
import './LoginForm.css';

export default function AuthForm() {
  const [isSignup, setIsSignup] = useState(false);
  const [user, setUser] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [college, setCollege] = useState('');

  // Login OTP
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Status
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Switch login/signup
  const toggleMode = () => {
    setIsSignup(!isSignup);
    setMessage('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAge('');
    setCollege('');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setMessage('');
    setEmail('');
    setPassword('');
    setOtp('');
    setOtpSent(false);
    setOtpVerified(false);
  };

  const API_BASE_URL = 'https://imeta-1.vercel.app';

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

  // Send login OTP
  const handleSendOtp = async () => {
    if (!email || !password) {
      setIsSuccess(false);
      setMessage('Enter your email and password first.');
      return;
    }

    if (!validateEmail(email)) {
      setIsSuccess(false);
      setMessage('Please enter a valid email address (e.g. user@gmail.com).');
      return;
    }

    if (!validatePassword(password)) {
      setIsSuccess(false);
      setMessage('Password must be at least 6 characters long and include letters and numbers or special characters.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch(
        `${API_BASE_URL}/api/send-login-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtp('');
        setIsSuccess(true);
        const otpCode = data.otp || '';
        setMessage(
          otpCode
            ? `OTP generated: ${otpCode} (Also printed in F12 console!)`
            : 'OTP generated. Check the browser console (F12)!'
        );
        console.log('================================');
        console.log(`Login OTP for ${email}: ${otpCode}`);
        console.log('OTP valid for 5 minutes');
        console.log('================================');
      } else {
        setIsSuccess(false);
        setMessage(
          data.message || 'Failed to generate OTP.'
        );
      }

    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setMessage(
        'Unable to connect to the backend server.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify login OTP
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

      const response = await fetch(
        `${API_BASE_URL}/api/verify-login-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            otp
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setIsSuccess(true);
        setMessage(
          'OTP verified. You can now log in.'
        );
      } else {
        setOtpVerified(false);
        setIsSuccess(false);
        setMessage(
          data.message || 'Invalid OTP.'
        );
      }

    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setMessage(
        'Unable to connect to the backend server.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Login / signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate email
    if (!validateEmail(email)) {
      setIsSuccess(false);
      setMessage('Please enter a valid email address (e.g. user@gmail.com).');
      setLoading(false);
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      setIsSuccess(false);
      setMessage('Password must be at least 6 characters long and include letters and numbers or special characters.');
      setLoading(false);
      return;
    }

    if (isSignup) {
      // Validate name
      if (!name || !validateName(name)) {
        setIsSuccess(false);
        setMessage('Full Name can only contain letters and spaces (no numbers or special characters).');
        setLoading(false);
        return;
      }

      // Check signup password
      if (password !== confirmPassword) {
        setIsSuccess(false);
        setMessage('Passwords do not match.');
        setLoading(false);
        return;
      }

      // Check age
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 13 || parsedAge > 120) {
        setIsSuccess(false);
        setMessage('Please enter a valid age between 13 and 120.');
        setLoading(false);
        return;
      }

      // Check college
      if (!college || !college.trim()) {
        setIsSuccess(false);
        setMessage('College / University is required.');
        setLoading(false);
        return;
      }
    } else {
      // Check login OTP
      if (!otpVerified) {
        setIsSuccess(false);
        setMessage(
          'Please verify the OTP before logging in.'
        );
        setLoading(false);
        return;
      }
    }

    try {
      const apiBaseUrl =
        'https://imeta-1.vercel.app';

      const endpoint = isSignup
        ? `${apiBaseUrl}/api/signup`
        : `${apiBaseUrl}/api/login`;

      const payload = isSignup
        ? {
            name,
            email,
            password,
            age,
            college
          }
        : {
            email,
            password
          };

      const response = await fetch(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message);

        if (isSignup) {
          // Registration complete
          setTimeout(() => {
            setIsSignup(false);
            setMessage(
              'Account created successfully! Please log in.'
            );
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setAge('');
            setCollege('');
            setOtp('');
            setOtpSent(false);
            setOtpVerified(false);
          }, 1500);
        } else {
          // Login complete
          setUser(data.user);
        }

      } else {
        setIsSuccess(false);
        setMessage(
          data.message || 'Action failed.'
        );
      }

    } catch (error) {
      console.error(error);
      setIsSuccess(false);
      setMessage(
        'Unable to connect to the backend server.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Dashboard
  if (user) {
    return (
      <div className="auth-card">
        <h2 className="dashboard-title">
          Welcome, {user.name}!
        </h2>

        <p className="dashboard-subtitle">
          Your account is verified and authenticated.
        </p>

        <div className="profile-box">
          <div className="profile-row">
            <strong>Full Name:</strong>
            <span>{user.name}</span>
          </div>

          <div className="profile-row">
            <strong>Email:</strong>
            <span>{user.email}</span>
          </div>

          <div className="profile-row">
            <strong>Age:</strong>
            <span>{user.age} years old</span>
          </div>

          <div className="profile-row">
            <strong>College:</strong>
            <span>{user.college}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="logout-btn"
        >
          Log Out
        </button>
      </div>
    );
  }

  // Login / signup form
  return (
    <div className="auth-card">
      <h2 className="auth-title">
        {isSignup
          ? 'Student Registration'
          : 'Welcome Back'}
      </h2>

      <form onSubmit={handleSubmit}>

        {/* Signup name */}
        {isSignup && (
          <div className="form-group">
            <label className="form-label">
              Full Name
            </label>

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
        )}

        {/* Email */}
        <div className="form-group">
          <label className="form-label">
            Email Address
          </label>

          <div
            style={{
              display: 'flex',
              gap: '10px'
            }}
          >
            <input
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (!isSignup) {
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtp('');
                }
              }}
              className="form-input"
              style={{ flex: 1 }}
              required
            />

            {/* OTP button only on login */}
            {!isSignup && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={
                  loading ||
                  !email ||
                  !password
                }
                className="submit-btn"
                style={{ width: '130px' }}
              >
                {otpSent
                  ? 'Resend OTP'
                  : 'Send OTP'}
              </button>
            )}
          </div>
        </div>

        {/* Age and college */}
        {isSignup && (
          <div className="form-row">
            <div className="form-col-1">
              <label className="form-label">
                Age
              </label>

              <input
                type="number"
                placeholder="20"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value)
                }
                className="form-input"
                required
              />
            </div>

            <div className="form-col-2">
              <label className="form-label">
                College / University
              </label>

              <input
                type="text"
                placeholder="MIT, Harvard, etc."
                value={college}
                onChange={(e) =>
                  setCollege(e.target.value)
                }
                className="form-input"
                required
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div className="form-group">
          <label className="form-label">
            Password
          </label>

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="form-input"
            required
          />
        </div>

        {/* Login OTP */}
        {!isSignup && otpSent && (
          <div className="form-group">
            <label className="form-label">
              Enter OTP
            </label>

            <div
              style={{
                display: 'flex',
                gap: '10px'
              }}
            >
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value =
                    e.target.value.replace(
                      /\D/g,
                      ''
                    );

                  setOtp(
                    value.slice(0, 6)
                  );
                }}
                maxLength="6"
                className="form-input"
                style={{ flex: 1 }}
                disabled={otpVerified}
              />

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={
                  loading ||
                  otp.length !== 6 ||
                  otpVerified
                }
                className="submit-btn"
                style={{ width: '130px' }}
              >
                {otpVerified
                  ? 'Verified'
                  : 'Verify OTP'}
              </button>
            </div>

            {otpVerified && (
              <div
                style={{
                  marginTop: '8px',
                  color: 'green',
                  fontSize: '14px'
                }}
              >
                ✓ OTP verified successfully
              </div>
            )}
          </div>
        )}

        {/* Confirm password */}
        {isSignup && (
          <div className="form-group">
            <label className="form-label">
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              className="form-input"
              required
            />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={
            loading ||
            (!isSignup && !otpVerified)
          }
          className="submit-btn"
        >
          {loading
            ? 'Processing...'
            : isSignup
            ? 'Register'
            : 'Log In'}
        </button>
      </form>

      {/* Message */}
      {message && (
        <div
          className={`feedback-message ${
            isSuccess
              ? 'success'
              : 'error'
          }`}
        >
          {message}
        </div>
      )}

      {/* Switch mode */}
      <div className="toggle-text">
        {isSignup
          ? 'Already registered? '
          : 'Need an account? '}

        <span
          onClick={toggleMode}
          className="toggle-link"
        >
          {isSignup
            ? 'Log In'
            : 'Sign Up'}
        </span>
      </div>
    </div>
  );
}