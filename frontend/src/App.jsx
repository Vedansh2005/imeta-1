import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import Dashboard from './Dashboard';
import './LoginForm.css';

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'signup' | 'dashboard'
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const API_BASE_URL =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000'
      : 'https://imeta-1.vercel.app';

  // Restore session on app load
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      fetch(`${API_BASE_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            setCurrentView('dashboard');
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoadingSession(false);
        });
    } else {
      setLoadingSession(false);
    }
  }, [API_BASE_URL]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setCurrentView('login');
    }
  };

  // 15-minute inactivity auto-logout
  useEffect(() => {
    if (!user) return;

    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [user]);

  return (
    <div className="app-container">
      {/* Background Animated Gradient Orbs */}
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>

      {loadingSession ? (
        <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }}></div>
          <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
            Verifying session...
          </div>
        </div>
      ) : user && currentView === 'dashboard' ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : currentView === 'signup' ? (
        <SignupForm onSwitchToLogin={() => setCurrentView('login')} />
      ) : (
        <LoginForm
          onSwitchToSignup={() => setCurrentView('signup')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

export default App;