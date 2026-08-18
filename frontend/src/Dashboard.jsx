import './LoginForm.css';

export default function Dashboard({ user, onLogout }) {
  return (
    <div className="auth-card">
      <h2 className="dashboard-title">Welcome, {user.name}!</h2>
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

      <button onClick={onLogout} className="logout-btn">
        Log Out
      </button>
    </div>
  );
}
