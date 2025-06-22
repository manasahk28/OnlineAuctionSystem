// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';

import './Layout.css'; // Assuming you have a CSS file for styles
const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showFarewell, setShowFarewell] = useState(false);
  const [fadePopup, setFadePopup] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    if (storedUser && isLoggedIn) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('loggedIn');
    setShowFarewell(true);

    setTimeout(() => {
      setFadePopup(true);
    }, 4000);

    setTimeout(() => {
      setShowLogoutPopup(false);
      setShowFarewell(false);
      setFadePopup(false);
      navigate('/');
      window.location.reload();
    }, 2000);
  };

  const cancelLogout = () => {
    setShowLogoutPopup(false);
    setShowFarewell(false);
    setFadePopup(false);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <h2>Online Auction</h2>
        </div>
        <div className="navbar-right">
          
          {user ? (
            <>
              <a href="/">Home</a>
              <a href="/explore">Explore</a>
              <a href="/post-item">Post Item</a>
              <a href="/dashboard">Profile</a>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => navigate('/register')}>Register</button>
              <button className="btn" onClick={() => navigate('/login')}>Login</button>
            </>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="popup-overlay">
          <div className={`popup-box ${fadePopup ? 'fade-out' : ''}`}>
            {!showFarewell ? (
              <>
                <p>Are you sure you want to logout?</p>
                <div className="popup-actions">
                  <button className="btn confirm" onClick={confirmLogout}>Yes</button>
                  <button className="btn cancel" onClick={cancelLogout}>No</button>
                </div>
              </>
            ) : (
              <p className="farewell-text">We'll miss you! Come back soon ❤️</p>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main>{children}</main>

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

export default Layout;
