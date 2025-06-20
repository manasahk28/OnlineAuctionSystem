import React, { useState, useRef, useEffect } from 'react';
import './Userdashboard.css';

import ProfilePage from './Profile'; 
import MyListings from './MyListings';
import Payments from './Payments';
import MyBids from './MyBids';
import RecentActivity from './RecentActivity';
import Notifications from './Notifications';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';


// function App() {
//   const [profileImage, setProfileImage] = useState(
//     JSON.parse(localStorage.getItem('user'))?.profileImage || ''
//   );

//   return (
//     <ProfilePage profileImage={profileImage} setProfileImage={setProfileImage} />
//   );
// }

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [showWelcome, setShowWelcome] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null); // for triggering file input
  const [showImageModal, setShowImageModal] = useState(false);
  const [profile, setProfile] = useState({});
  const [activeSection, setActiveSection] = useState('Profile');
  const [now, setNow] = useState(Date.now());


  // Dummy stats and spending
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


// Dummy bid data
  const [bids, setBids] = useState([
    {
      id: 1,
      itemName: 'DSA Book',
      itemImage: '/assets/dsa-book.png',
      currentBid: 1200,
      highestBid: 1500,
      endTime: Date.now() + 1000 * 60 * 60 * 2,
      outbid: true,
    },
    {
      id: 2,
      itemName: 'Wireless Headphones',
      itemImage: '/assets/headphones.png',
      currentBid: 2500,
      highestBid: 2500,
      endTime: Date.now() + 1000 * 60 * 30,
      outbid: false,
    },
    {
      id: 3,
      itemName: 'Hoodie',
      itemImage: '/assets/hoodie.png',
      currentBid: 800,
      highestBid: 900,
      endTime: Date.now() + 1000 * 60 * 10,
      outbid: true,
    },
  ]);


  // useEffect(() => {
  // if (showImageModal) {
  //   document.body.style.overflow = 'hidden';
  // } else {
  //   document.body.style.overflow = 'auto';
  // }

//   return () => {
//     document.body.style.overflow = 'auto';
//   };
// }, [showImageModal]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
      const userData = JSON.parse(localStorage.getItem("user") || '{}');
      if (!userData.email) return;
    
      fetch(`http://localhost:5000/api/get-profile?email=${userData.email}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setProfile(data.profile);
            setProfileImage(data.profile.profileImage || null);
            localStorage.setItem("user", JSON.stringify({ ...userData, ...data.profile }));
          }
        });
    }, [activeSection]); // <-- this makes sure it refreshes when you return from profile
  
  
    useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }, []);

    // Modal scroll freeze
  useEffect(() => {
    document.body.style.overflow = showImageModal ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showImageModal]);

const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const updatedImage = reader.result;
      setProfileImage(updatedImage);
      setProfile(prev => ({ ...prev, profileImage: updatedImage }));

      try {
        const res = await fetch('http://localhost:5000/api/update-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            profileImage: updatedImage
          })
        });
        const result = await res.json();
        if (result.status === 'success') {
          localStorage.setItem('user', JSON.stringify({ ...user, profileImage: updatedImage }));
        } else {
          alert('Failed to update profile image');
        }
      } catch (err) {
        console.error('Error saving profile image:', err);
      }
    };
    reader.readAsDataURL(file);
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
    {/* Navbar */}
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

 {/* Welcome */}
      {showWelcome ? (
        <div className="dashboard-wrapper">
          <div className="dashboard-card">
            <h1 className="dashboard-heading">👋 Welcome!</h1>
            <p className="dashboard-user">
              You're logged in as <strong>{user.email}</strong>
            </p>
            <p className="dashboard-message">
              This is your personalized Auction Dashboard. Explore listings, track bids, or post something of your own!
            </p><button className="close-btn" onClick={() => setShowWelcome(false)}>→</button>
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


            <h3 className="username">{profile.UserName || user.UserName || 'Your Name'}</h3>
            {/* <div className="sidebar-buttons">
              <button>Profile</button>
              <button>My Listings</button>
              <button>My Bids</button>
              <button>Payments</button>
              <button>Notifications</button>
              <button>Recent Activity</button>
            </div>
          </div> */}

          <div className="sidebar-buttons">
              <button onClick={() => setActiveSection('ProfilePage')}>Profile</button>
              <button onClick={() => setActiveSection('My Listings')}>My Listings</button>
              <button onClick={() => setActiveSection('My Bids')}>My Bids</button>
              <button onClick={() => setActiveSection('Payments')}>Payments</button>
              <button onClick={() => setActiveSection('Notifications')}>Notifications</button>
              <button onClick={() => setActiveSection('RecentActivity')}>Recent Activity</button>
            </div>
          </div>


          {/* Right-side content will go here next */}
        <div className="sidebar-right">
         {activeSection === 'ProfilePage' ? (
          <div className="scroll-container">
                          <ProfilePage
                            profileImage={profileImage}
                            setProfileImage={setProfileImage}
                          />
                        </div>
                      ) : (
                        <>
                          {activeSection === 'Profile' && (
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
        
              )}
               {activeSection === 'My Bids' && <MyBids />}
               {activeSection === 'Payments' && <Payments />}
               {activeSection === 'My Listings' && <MyListings />}
               {activeSection === 'Notifications' && <Notifications />}
               {activeSection === 'RecentActivity' && <RecentActivity/>}
               {/* {activeSection === 'ProfilePage' && (
                <profile
                profileImage={profileImage}
                setProfileImage={setProfileImage} */}
                </>
               )}
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
