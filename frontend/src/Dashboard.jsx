import './LoginForm.css';

export default function Dashboard({ user, onLogout }) {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="auth-card dashboard-card">
      <div className="profile-avatar-container">
        <div className="profile-avatar">
          {getInitials(user.name)}
        </div>
        <h2 className="auth-title" style={{ marginBottom: '4px' }}>
          Welcome, {user.name}!
        </h2>
        <div className="status-badge" style={{ marginTop: '6px' }}>
          <span className="status-dot"></span>
          Active Session • 10 Hours
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-item">
          <span className="profile-label">Full Name</span>
          <span className="profile-value">{user.name}</span>
        </div>

        <div className="profile-item">
          <span className="profile-label">Email Address</span>
          <span className="profile-value" style={{ wordBreak: 'break-all' }}>{user.email}</span>
        </div>

        <div className="profile-item">
          <span className="profile-label">Age</span>
          <span className="profile-value">{user.age} yrs</span>
        </div>

        <div className="profile-item">
          <span className="profile-label">College</span>
          <span className="profile-value">{user.college}</span>
        </div>
      </div>

      <button onClick={onLogout} className="logout-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Log Out of Session
      </button>
    </div>
  );
}
