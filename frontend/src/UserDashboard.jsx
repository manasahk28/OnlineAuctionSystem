import React, { useState } from 'react';
import './Userdashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [showWelcome, setShowWelcome] = useState(true); // state for welcome box

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
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <h2>Online Auction</h2>
        </div>
        <div className="navbar-right">
          <a href="/">Home</a>
          <a href="/my-bids">Explore</a>
          <a href="/post-item">Post Item</a>
          <a href="/dashboard">Profile</a>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {showWelcome && (
        <div className="dashboard-wrapper">
          <div className="dashboard-card">
            <button className="close-btn" onClick={() => setShowWelcome(false)}>✖</button>
            <h1 className="dashboard-heading">👋 Welcome!</h1>
            <p className="dashboard-user">
              You're logged in as <strong>{user.email}</strong>
            </p>
            <p className="dashboard-message">
              This is your personalized Auction Dashboard. Explore listings, track bids, or post something of your own!
            </p>
          </div>
          
        </div>
      )}
      {/* Footer */}
              <footer className="footer">
              <div className="footer-content">
                  <h3>Online Auction</h3>
                  <p>© 2025 Campus Auction System · All rights reserved</p>
                  <div className="footer-links">
                  <a href="/about">About</a>
                  <a href="/contact">Contact</a>
                  <a href="/help">Help</a>
                  </div>
              </div>
              <div className="social-icons">
                  <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
                      <FontAwesomeIcon icon={faInstagram} />
                  </a>
                  <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                      <FontAwesomeIcon icon={faLinkedin} />
                  </a>
                  <a href="https://www.twitter.com" target="_blank" rel="noreferrer">
                      <FontAwesomeIcon icon={faTwitter} />
                  </a>
              </div>
      
              </footer>
    </>
    
  );
};

export default UserDashboard;
