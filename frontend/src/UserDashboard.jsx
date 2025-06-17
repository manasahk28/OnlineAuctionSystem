import React, { useState, useRef, useEffect } from 'react';
import './Userdashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [showWelcome, setShowWelcome] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null); // for triggering file input
  const [showImageModal, setShowImageModal] = useState(false);
const statsData = [
  { name: 'Listings', value: 12 },
  { name: 'Bids', value: 5 },
  { name: 'Wins', value: 3 },
];

const spendingData = [
  { month: 'Jan', amount: 3000 },
  { month: 'Feb', amount: 4500 },
  { month: 'Mar', amount: 7000 },
];

  useEffect(() => {
  if (showImageModal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }

  return () => {
    document.body.style.overflow = 'auto';
  };
}, [showImageModal]);


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
          <a href="/explore">Explore</a>
          <a href="/post-item">Post Item</a>
          <a href="/dashboard">Profile</a>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {showWelcome ? (
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
      ) : (
        <div className="dashboard-main">
          <div className="sidebar-left">

            <div className="profile-image">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="preview-image" />
              ) : (
                <div className="image-placeholder">📷</div>
              )}

              {/* Hover Menu */}
              <div className="hover-options">
                {profileImage && (
                  <button
                    className="hover-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageModal(true);
                    }}
                  >
                    View
                  </button>
                )}
                <button
                  className="hover-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current.click();
                  }}
                >
                  {profileImage ? 'Change' : 'Add Image'}
                </button>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProfileImage(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: 'none' }}
              />
            </div>

            {/* Image Preview Modal */}
            {showImageModal && (
              <div className="image-modal">
                <div className="image-modal-content">
                  <span className="close-modal" onClick={() => setShowImageModal(false)}>✖</span>
                  <img src={profileImage} alt="Full View" />
                </div>
              </div>
            )}


            <h3 className="username">{user.name || 'Lisa M'}</h3>
            <div className="sidebar-buttons">
              <button>Profile</button>
              <button>My Listings</button>
              <button>My Bids</button>
              <button>Payments</button>
              <button>Notifications</button>
              <button>Recent Activity</button>
            </div>
          </div>
          {/* Right-side content will go here next */}

        <div className="sidebar-right">
          <div className="charts-section">
              <h2>📊 Quick Stats</h2>
              <div className="charts-container">
                
                {/* Pie Chart */}
                <div className="chart-card">
                  <h4>Activity Breakdown</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={statsData} dataKey="value" nameKey="name" outerRadius={80} label>
                        <Cell fill="#FFA500" />
                        <Cell fill="#FF7F50" />
                        <Cell fill="#FF4500" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="chart-card">
  <h4>Total Spent (per month)</h4>
  <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#FF6B00' }}>
    💸 Total Spent: ₹{spendingData.reduce((acc, item) => acc + item.amount, 0)}
  </p>

  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={spendingData}>
      <defs>
        <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFA500" stopOpacity={1} />
          <stop offset="100%" stopColor="#FF6B00" stopOpacity={1} />
        </linearGradient>
      </defs>

      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip contentStyle={{ backgroundColor: '#fff8f0', borderRadius: 8, border: '1px solid #ffa500' }}
      labelStyle={{ color: '#ff7f00' }}
      itemStyle={{ color: '#333', fontWeight: 'bold' }}
 />
      <Legend />

      <Bar dataKey="amount" fill="url(#orangeGradient)" radius={[8, 8, 0, 0]}/>
    </BarChart>
  </ResponsiveContainer>
</div>
              </div>
              </div>
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
