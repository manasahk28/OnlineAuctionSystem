import React, { useState, useRef, useEffect } from 'react';
import './Userdashboard.css';
import Layout from './Layout';
import { logProfileActivity, ActivityActions } from './utils/activityLogger';

import ProfilePage from './Profile';
import MyListings from './MyListings';
import Payments from './Payments';
import MyBids from './MyBids';
import RecentActivity from './RecentActivity';
import Notifications from './Notifications';
import EditItem from './EditItem';
import Settings from './Settings';

import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { FaTimes } from 'react-icons/fa';
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

  // Define the predefined categories that should be shown in the graph (matching the dropdown exactly)
  const predefinedCategories = [
    "Books", "Electronics", "Clothing", "Stationery", "Lab Equipment", 
    "Sports Gear", "Hostel Essentials", "Cycle/Bike Accessories", "Art Supplies", "Other"
  ];

  // Helper to normalize category names (trim and case-insensitive)
  function normalizeCategory(name) {
    return name ? name.trim().toLowerCase() : '';
  }

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
          // Build a map of normalized category to count
          const pieMap = {};
          data.pie_data.forEach(d => {
            const norm = normalizeCategory(d.category);
            pieMap[norm] = (pieMap[norm] || 0) + d.count;
          });
          // Map predefined categories to their normalized form
          const normalizedPredefined = predefinedCategories.map(c => normalizeCategory(c));
          // Build filteredPieData using normalized matching
          const filteredPieData = predefinedCategories.map((category, i) => {
            const norm = normalizedPredefined[i];
            return {
              name: category,
              value: pieMap[norm] || 0
            };
          }).filter(item => item.value > 0);

          // Repeat for bar data
          const barMap = {};
          data.bar_data.forEach(d => {
            const norm = normalizeCategory(d.category);
            barMap[norm] = (barMap[norm] || 0) + d.count;
          });
          const filteredBarData = predefinedCategories.map((category, i) => {
            const norm = normalizedPredefined[i];
            return {
              category: category,
              count: barMap[norm] || 0
            };
          }).filter(item => item.count > 0);

          setCategoryData(filteredPieData);
          setBiddedCategoryData(filteredBarData);
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
          // Log the profile image activity
          await logProfileActivity(
            ActivityActions.ADDED_PROFILE_PICTURE,
            'Profile Image'
          );
          
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

  const handleDeleteProfileImage = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete your profile image? This action cannot be undone.');
    
    if (!confirmDelete) return;

    try {
      // Get current profile data
      const res1 = await fetch(`http://localhost:5000/api/get-profile?email=${user.email}`);
      const data1 = await res1.json();
      const existingProfile = data1.profile;

      // Update profile with empty profileImage
      const updatedProfile = {
        ...existingProfile,
        email: user.email,
        profileImage: '' // Set to empty string to remove the image
      };

      const res = await fetch('http://localhost:5000/api/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });

      const result = await res.json();
      if (result.status === 'success') {
        // Update local state
        setProfileImage(null);
        setProfile(updatedProfile);
        localStorage.setItem('user', JSON.stringify({ ...user, profileImage: null }));
        
        // Log the profile image deletion activity
        await logProfileActivity(
          ActivityActions.DELETED_PROFILE_PICTURE,
          'Profile Image'
        );
        
        alert('✅ Profile image deleted successfully!');
      } else {
        alert('❌ Failed to delete profile image: ' + result.message);
      }
    } catch (err) {
      console.error('Error deleting profile image:', err);
      alert('❌ Something went wrong while deleting the profile image.');
    }
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
                {profileImage && (
                  <button className="hover-btn delete-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfileImage();
                  }}>Delete</button>
                )}
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
              <div
                className="image-modal"
                onClick={(e) => {
                  if (e.target.classList.contains("image-modal")) {
                    setShowImageModal(false);
                  }
                }}
              >
                <div className="image-modal-content" style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="image-modal-close-btn"
                    aria-label="Close"
                  >
                    <FaTimes />
                  </button>
                  <img src={profileImage} alt="Full View" />
                </div>
              </div>            
            )}            
              <h3 className="username">{profile.UserName || user.UserName || 'Your Name'}</h3>

            <div className="sidebar-buttons">
              <button onClick={() => setActiveSection('ProfilePage')}>Account</button>
              <button onClick={() => setActiveSection('My Listings')}>My Listings</button>
              <button onClick={() => setActiveSection('My Bids')}>My Bids</button>
              <button onClick={() => setActiveSection('Payments')}>Payments</button>
              <button onClick={() => setActiveSection('Notifications')}>Notifications</button>
              <button onClick={() => setActiveSection('RecentActivity')}>Recent Activity</button>
              <button onClick={() => setActiveSection('Settings')}>Settings</button>            
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
                {activeSection === 'Settings' && (
                  <div className="dashboard-section">
                    <h2 style={{ marginLeft: '24px', marginTop: '32px' }}>⚙️ Settings</h2>
                    <Settings />
                  </div>
                )}       
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserDashboard;
