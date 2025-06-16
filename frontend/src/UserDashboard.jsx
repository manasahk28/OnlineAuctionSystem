import React from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-card">
          <h2>User not found</h2>
          <p>Please login again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-card">
        <h1 className="dashboard-heading">👋 Welcome !</h1>
        <p className="dashboard-user">
          You're logged in as <strong>{user.email}</strong>
        </p>
        <p className="dashboard-message">
          This is your personalized Auction Dashboard. Explore listings, track bids, or post something of your own!
        </p>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default UserDashboard;
