import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import Dashboard from './Dashboard';

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'signup' | 'dashboard'
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  if (user && currentView === 'dashboard') {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (currentView === 'signup') {
    return <SignupForm onSwitchToLogin={() => setCurrentView('login')} />;
  }

  return (
    <LoginForm
      onSwitchToSignup={() => setCurrentView('signup')}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

export default App;