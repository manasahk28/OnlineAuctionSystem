import React, { useState, useEffect } from 'react';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState({
    UserName: '',
    collegeId: '',
    collegeName: '',
    phone: '',
    email: '',
    linkedin: '',
    timestamp: ''
  });

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData?.email) return;

    const fetchProfileData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/get-profile?email=${userData.email}`);
        const data = await res.json();
        if (data.status === 'success') {
          const p = data.profile;
          const updatedProfile = {
            UserName: p.UserName || p.username || '',
            collegeId: p.collegeId || '',
            collegeName: p.collegeName || '',
            phone: p.phone || '',
            email: p.email || '',
            password: '',
            linkedin: p.linkedin || '',
            timestamp: p.timestamp || ''
          };
          setProfile(updatedProfile);
          localStorage.setItem("user", JSON.stringify({ ...userData, ...updatedProfile }));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const result = await res.json();
      alert(result.message);
      if (result.status === 'success') {
        localStorage.setItem("user", JSON.stringify(profile));
        setEditMode(false);
      }
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const fields = [
    { label: 'Email :', name: 'email', readOnly: true },
    { label: 'Phone :', name: 'phone' },
    { label: 'Username :', name: 'UserName'},
    { label: 'Student ID :', name: 'collegeId', readOnly: true },
    { label: 'College :', name: 'collegeName' },
    { label: 'LinkedIn (Optional) :', name: 'linkedin' },
    { label: 'Account Created :', name: 'timestamp', readOnly: true },
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-title">👤 Profile Details</h2>
        <button className="edit-top-btn" onClick={() => setEditMode(prev => !prev)}>
          {editMode ? '🔙 Back' : '✏️ Edit'}
        </button>
      </div>
    <div className="profile-description">
      <form className="profile-form">
        {fields.map((field, idx) => {
          const value = profile[field.name];
          if (!editMode && (!value || value.trim() === '')) return null;

          return (
            <div key={idx} className="profile-field">
              <label>{field.label}</label>
              {editMode ? (
                <input
                  className="profile-input"
                  name={field.name}
                  type={field.type || 'text'}
                  value={field.name === 'timestamp'
                    ? profile.timestamp?.slice(0, 10)
                    : profile[field.name]}
                  onChange={handleChange}
                  readOnly={field.readOnly}
                />
              ) : (
                <div className="profile-text">
                  {field.name === 'timestamp'
                    ? profile.timestamp?.slice(0, 10)
                    : profile[field.name]}
                </div>
              )}
            </div>
          );
        })}
      </form>
      </div>

      {editMode && (
        <div className="profile-actions">
          <button className="save-btn" onClick={handleSave}>💾 Save</button>
        </div>
      )}
    </div>
  );
};

export default Profile;
