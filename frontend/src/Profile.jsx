import React, { useState, useEffect } from 'react';
import './Profile.css';


const ProfilePage = ({ profileImage, setProfileImage }) => {
  //const storedUser = JSON.parse(localStorage.getItem('user')) || {};

  const [profile, setProfile] = useState({
    UserName: '',
    collegeId: '',
    collegeName: '',
    phone: '',
    email: '',
    password: '',
    linkedin: '',
    profileImage: '',
    timestamp: ''
  });
  

  const [editable, setEditable] = useState({
    email:false,
    phone: false,
    UserName: false,
    collegeId: false,
    collegeName: false,
    password: false,
    linkedin: false
  });

  
useEffect(() => {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  if (!userData?.email) {
    console.warn("No stored user email found.");
    return;
  }

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
          profileImage: p.profileImage || '',
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
}, []); // 🔥 No warning now


  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => {
          const updated = { ...prev, profileImage: reader.result };
          setProfileImage(reader.result); // update sidebar image instantly
          localStorage.setItem("user", JSON.stringify(updated));
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }
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
      }
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image-wrapper">
          <label htmlFor="imageUpload" className="image-upload-label">
            <img
              src={profileImage || 'https://via.placeholder.com/120x120.png?text=Upload'}
              alt=" "
              className="profile-pic"
            />
            {profileImage && (
              <span
                className="delete-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfile(prev => {
                    const updated = { ...prev, profileImage: '' };
                    setProfileImage('');
                    localStorage.setItem("user", JSON.stringify(updated)); // update immediately
                    return updated;
                  });
                }}
              >
                ❌
              </span>
            )}
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>
        

        <h2 className="profile-name">{profile.UserName || 'Your Name'}</h2>
        <p className="profile-role">🎓 Student</p>
      </div>

      <form className="profile-form">
        {[
          { label: 'Email', name: 'email'},
          { label: 'Phone', name: 'phone' },
          { label: 'Username', name: 'UserName' },
          { label: 'Student ID', name: 'collegeId' },
          { label: 'College', name: 'collegeName' },
          { label: 'New Password (If Needed)', name: 'password', type: 'password' },
          { label: 'LinkedIn (Optional)', name: 'linkedin' },
          { label: 'Account Created', name: 'timestamp', readOnly: true },
        ].map((field, idx) => (
          <div key={idx} className="editable-field">
            <label>{field.label}</label>
           <div className="input-edit-wrapper">
             <input
               name={field.name}
               type={field.type || 'text'}
               value={field.name === 'timestamp'
                 ? profile.timestamp?.slice(0, 10)
                 : profile[field.name]
               }
               onChange={handleChange}
               readOnly={field.readOnly || !editable[field.name]}
             />
             {!field.readOnly && (
               <button
                 type="button"
                 className="edit-btn"
                 onClick={() =>
                   setEditable(prev => ({ ...prev, [field.name]: true }))
                 }
               >✏️
               </button>
             )}
           </div>
          </div>
        ))}
      </form>


      <div className="profile-actions">
        <button className="save-btn" onClick={handleSave}>💾 Save Changes</button>
        
        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
        >🚪 Log-out
        </button>
        
      </div>
    </div>
  );
};

export default ProfilePage;
