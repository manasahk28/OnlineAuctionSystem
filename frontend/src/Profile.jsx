import React, { useState, useEffect } from 'react';
import './Profile.css';
import { logProfileActivity, ActivityActions } from './utils/activityLogger';

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
  const [completionPercent, setCompletionPercent] = useState(0); // 🆕 State for % completed
  const backend = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData?.email) return;

    const fetchProfileData = async () => {
      try {
        const res = await fetch(`${backend}/api/get-profile?email=${userData.email}`);
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

          // 🧮 Calculate completion percentage
          calculateCompletion(updatedProfile);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfileData();
  }, []);

  const calculateCompletion = (data) => {
    const fieldsToCheck = ['UserName', 'collegeId', 'collegeName', 'phone', 'linkedin'];
    const filled = fieldsToCheck.filter(field => data[field] && data[field].trim() !== '');
    const percent = Math.round((filled.length / fieldsToCheck.length) * 100);
    setCompletionPercent(percent);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...profile, [name]: value };
    setProfile(updated);
    calculateCompletion(updated); // 🆕 update % live while editing
  };

  const handleSave = async () => {
    try {
      // Step 1: Get the latest profile data from the DB
      const res1 = await fetch(`${backend}/api/get-profile?email=${profile.email}`);
      const data1 = await res1.json();

      if (data1.status !== 'success') {
        alert('Failed to fetch latest profile info');
        return;
      }

      const existingProfile = data1.profile;

      // Step 2: Merge existing with newly edited fields
      const updatedProfile = {
        ...existingProfile,
        ...profile,
        email: profile.email  // make sure email stays consistent
      };

      // Step 3: Save merged data
      const res = await fetch(`${backend}/api/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });

      const result = await res.json();
      alert(result.message);

      if (result.status === 'success') {
        // Log the profile update activity
        await logProfileActivity(
          ActivityActions.UPDATED_PROFILE,
          'Profile Information'
        );

        localStorage.setItem("user", JSON.stringify(updatedProfile));
        setEditMode(false);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Failed to update profile.');
    }
  };

  const fields = [
    { label: 'Email :', name: 'email', readOnly: true },
    { label: 'Phone :', name: 'phone' },
    { label: 'Username :', name: 'UserName' },
    { label: 'Student ID :', name: 'collegeId', readOnly: true },
    { label: 'College :', name: 'collegeName' },
    { label: 'LinkedIn (Optional) :', name: 'linkedin' },
    { label: 'Account Created :', name: 'timestamp', readOnly: true },
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-title">👤 Account Details</h2>
        <button className="edit-top-btn" onClick={() => setEditMode(prev => !prev)}>
          {editMode ? '🔙 Back' : '✏️ Edit'}
        </button>
      </div>

      {/* ✅ Completion Line */}
      <p className="completion-text">
        ✅ Your profile is <strong>{completionPercent}%</strong> complete! {completionPercent < 100 ? 'Keep going! 💪' : 'Awesome! 🎉'}
      </p>

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
