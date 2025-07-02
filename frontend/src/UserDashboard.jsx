import React, { useState, useRef, useEffect } from 'react';
import './Userdashboard.css';
import Layout from './Layout';

import ProfilePage from './Profile';
import MyListings from './MyListings';
import Payments from './Payments';
import MyBids from './MyBids';
import RecentActivity from './RecentActivity';
import Notifications from './Notifications';
import EditItem from './EditItem';

import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const UserDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [editingItemId, setEditingItemId] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [profile, setProfile] = useState({});
  const [activeSection, setActiveSection] = useState('Profile');
  const [now, setNow] = useState(Date.now());

  // Dynamic chart states
  const [categoryData, setCategoryData] = useState([]);       // For pie chart
  const [biddedCategoryData, setBiddedCategoryData] = useState([]); // For bar chart

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
  }, [activeSection]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showImageModal ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showImageModal]);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`http://localhost:5000/api/user-category-stats/${user.email}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          const pieFormatted = data.pie_data.map(d => ({ name: d.category, value: d.count }));
          const barFormatted = data.bar_data.map(d => ({ category: d.category, count: d.count }));
          setCategoryData(pieFormatted);
          setBiddedCategoryData(barFormatted);
        }
      });
  }, [user?.email]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const updatedImage = reader.result;
      setProfileImage(updatedImage);

      try {
        const res1 = await fetch(`http://localhost:5000/api/get-profile?email=${user.email}`);
        const data1 = await res1.json();
        const existingProfile = data1.profile;

        const updatedProfile = {
          ...existingProfile,
          email: user.email,
          profileImage: updatedImage
        };

        const res = await fetch('http://localhost:5000/api/update-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile)
        });

        const result = await res.json();
        if (result.status === 'success') {
          localStorage.setItem('user', JSON.stringify({ ...user, profileImage: updatedImage }));
          setProfile(updatedProfile);
        } else {
          alert('Failed to update profile image');
        }
      } catch (err) {
        console.error('Error saving profile image:', err);
      }
    };

    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <Layout>
      {showWelcome ? (
        <div className="dashboard-container">
          <div className="dashboard-card">
            <h1 className="dashboard-heading">👋 Welcome!</h1>
            <p className="dashboard-user">
              You're logged in as <strong>{user.email}</strong>
            </p>
            <p className="dashboard-message">
              This is your personalized Auction Dashboard. Explore listings, track bids, or post something of your own!
            </p>
            <button className="close-btn" onClick={() => setShowWelcome(false)}>→</button>
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

              <div className="hover-options">
                {profileImage && (
                  <button className="hover-btn" onClick={(e) => {
                    e.stopPropagation();
                    setShowImageModal(true);
                  }}>View</button>
                )}
                <button className="hover-btn" onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current.click();
                }}>{profileImage ? 'Change' : 'Add Image'}</button>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {showImageModal && (
              <div className="image-modal">
                <div className="image-modal-content">
                  <span className="close-modal" onClick={() => setShowImageModal(false)}>✖</span>
                  <img src={profileImage} alt="Full View" />
                </div>
              </div>
            )}

            <h3 className="username">{profile.UserName || user.UserName || 'Your Name'}</h3>

            <div className="sidebar-buttons">
              <button onClick={() => setActiveSection('ProfilePage')}>Profile</button>
              <button onClick={() => setActiveSection('My Listings')}>My Listings</button>
              <button onClick={() => setActiveSection('My Bids')}>My Bids</button>
              <button onClick={() => setActiveSection('Payments')}>Payments</button>
              <button onClick={() => setActiveSection('Notifications')}>Notifications</button>
              <button onClick={() => setActiveSection('RecentActivity')}>Recent Activity</button>
            </div>
          </div>

          <div className="sidebar-right">
            {activeSection === 'ProfilePage' ? (
              <div className="scroll-container">
                <ProfilePage profileImage={profileImage} setProfileImage={setProfileImage} />
              </div>
            ) : (
              <>
                {activeSection === 'Profile' && (
                  <div className="charts-section">
                    <h2>📊 Quick Stats</h2>
                    <div className="charts-container">
                      {/* Pie Chart: Posted items by category */}
                      <div className="chart-card">
                        <h4>Posted Items by Category</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={80} label>
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#FFA500', '#FF7F50', '#FF4500', '#FF6B00', '#FFC300'][index % 5]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        {categoryData.length > 0 && (
                          <p style={{ fontWeight: 'bold', color: '#FF6B00', marginTop: '10px' }}>
                            🔝 Most Auctioned Category: {categoryData[0].name} ({categoryData[0].value} items)
                          </p>
                        )}
                      </div>

                      {/* Bar Chart: Bidded items per category */}
                      <div className="chart-card">
                        <h4>Bids Placed by Category</h4>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={biddedCategoryData}>
                            <XAxis dataKey="category" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#FF6B00" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'My Bids' && <MyBids />}
                {activeSection === 'Payments' && <Payments />}
                {activeSection === 'My Listings' && (
                  <MyListings
                    setActiveSection={setActiveSection}
                    setEditingItemId={setEditingItemId}
                  />
                )}
                {activeSection === 'Edit Item' && (
                  <EditItem itemId={editingItemId} setActiveSection={setActiveSection} />
                )}
                {activeSection === 'Notifications' && <Notifications />}
                {activeSection === 'RecentActivity' && <RecentActivity />}
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserDashboard;
