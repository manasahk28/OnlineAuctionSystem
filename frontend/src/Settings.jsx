import { useState } from 'react';
import './Settings.css';
import { useTheme } from './ThemeContext';

    // ChangePassword component
    const EyeIcon = ({ visible }) => visible ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="8" ry="5"/><circle cx="12" cy="12" r="2.5"/></svg>
    ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="8" ry="5"/><circle cx="12" cy="12" r="2.5"/><line x1="3" y1="21" x2="21" y2="3" stroke="#555" strokeWidth="2"/></svg>
    );

    const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [step, setStep] = useState(1); // 1: verify old password, 2: set new password
    const [success, setSuccess] = useState(false);

    const verifyCurrentPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/auth/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ current_password: currentPassword })
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setStep(2);
                setMessage('');
            } else {
                setError(data.message || 'Incorrect password.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        setLoading(true);
        try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/auth/change-password', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
            })
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            setMessage('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setStep(1);
            setSuccess(true);
        } else {
            setError(data.message || 'Failed to change password.');
        }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        }
        setLoading(false);
    };

    const inputWrapper = { position: 'relative', display: 'flex', alignItems: 'center' };
    const eyeStyle = { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: 18, color: '#888' };

    return (
        <div className="settings-section change-password-section">
            <h3>Change Password</h3>
            {success ? (
                <div style={{textAlign: 'center', color: 'green', fontWeight: 600, margin: '1.2rem 0'}}>
                    <div style={{fontSize: '1.1rem', marginBottom: '1rem'}}>{message || 'Your password has been changed successfully!'}</div>
                    <button onClick={() => setSuccess(false)} style={{marginTop: '0.5rem'}}>Change Again</button>
                </div>
            ) : step === 1 ? (
                <form onSubmit={verifyCurrentPassword}>
                    <div>
                        <label>Current Password:</label>
                        <div style={inputWrapper}>
                            <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required disabled={loading} style={{ width: '100%' }} placeholder="Enter current password" />
                            <span style={eyeStyle} onClick={() => setShowCurrent(v => !v)}><EyeIcon visible={showCurrent} /></span>
                        </div>
                    </div>
                    <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Next'}</button>
                    {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                </form>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>New Password:</label>
                        <div style={inputWrapper}>
                            <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={loading} style={{ width: '100%' }} placeholder="New password" />
                            <span style={eyeStyle} onClick={() => setShowNew(v => !v)}><EyeIcon visible={showNew} /></span>
                        </div>
                    </div>
                    <div>
                        <label>Confirm New Password:</label>
                        <div style={inputWrapper}>
                            <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={loading} style={{ width: '100%' }} placeholder="Confirm new password" />
                            <span style={eyeStyle} onClick={() => setShowConfirm(v => !v)}><EyeIcon visible={showConfirm} /></span>
                        </div>
                    </div>
                    <button type="submit" disabled={loading}>{loading ? 'Changing...' : 'Change Password'}</button>
                    {message && <div style={{ color: 'green', marginTop: '10px' }}>{message}</div>}
                    {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                </form>
            )}
        </div>
    );
    };

    // AccountActions component
    const AccountActions = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const token = localStorage.getItem('token');
            console.log('JWT token:', token); // Debug: log the token
            const res = await fetch('http://localhost:5000/api/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setMessage('Account deleted successfully. Redirecting...');
                localStorage.removeItem('token');
                localStorage.removeItem('user'); // Remove user info
                sessionStorage.removeItem('loggedIn'); // Remove login session
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                setError(data.message || 'Failed to delete account.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="settings-section">
            <h3>Account Actions</h3>
            <button onClick={handleDelete} style={{ color: 'white' }} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Account'}
            </button>
            {message && <div style={{ color: 'green', marginTop: '10px' }}>{message}</div>}
            {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        </div>
    );
};

    // PrivacySettings component
    const toggleStyle = {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
    marginRight: '12px',
    verticalAlign: 'middle',
    };
    const sliderStyle = {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    borderRadius: '24px',
    transition: '.4s',
    };
    const sliderCheckedStyle = {
    ...sliderStyle,
    backgroundColor: '#FF6B00',
    };
    const circleStyle = {
    position: 'absolute',
    content: '',
    height: '18px',
    width: '18px',
    left: '3px',
    bottom: '3px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: '.4s',
    };
    const circleCheckedStyle = {
    ...circleStyle,
    transform: 'translateX(20px)',
    };

    const PrivacySettings = () => {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);

    return (
        <div className="settings-section">
        <h3>Notification Preferences</h3>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.2rem' }}>
            <span style={{ marginRight: '16px', minWidth: '120px' }}>Email Notifications</span>
            <label style={toggleStyle}>
            <input
                type="checkbox"
                checked={emailNotifications}
                onChange={() => setEmailNotifications(!emailNotifications)}
                style={{ display: 'none' }}
            />
            <span style={emailNotifications ? sliderCheckedStyle : sliderStyle}>
                <span style={emailNotifications ? circleCheckedStyle : circleStyle}></span>
            </span>
            </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '16px', minWidth: '120px' }}>Push Notifications</span>
            <label style={toggleStyle}>
            <input
                type="checkbox"
                checked={pushNotifications}
                onChange={() => setPushNotifications(!pushNotifications)}
                style={{ display: 'none' }}
            />
            <span style={pushNotifications ? sliderCheckedStyle : sliderStyle}>
                <span style={pushNotifications ? circleCheckedStyle : circleStyle}></span>
            </span>
            </label>
        </div>
        </div>
    );
    };

    // ThemeSettings component
    const ThemeSettings = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="settings-section">
        <h3>Theme / Appearance</h3>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '16px', minWidth: '120px' }}>Dark Mode</span>
            <label style={toggleStyle}>
            <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                style={{ display: 'none' }}
            />
            <span style={theme === 'dark' ? sliderCheckedStyle : sliderStyle}>
                <span style={theme === 'dark' ? circleCheckedStyle : circleStyle}></span>
            </span>
            </label>
        </div>
        </div>
    );
    };

    const TABS = [
    { key: 'change', label: 'Change Password', component: <ChangePassword /> },
    { key: 'privacy', label: 'Privacy', component: <PrivacySettings /> },
    { key: 'theme', label: 'Theme', component: <ThemeSettings /> },
    { key: 'account', label: 'Account Actions', component: <AccountActions /> },
    ];

    const Settings = () => {
    const [activeTab, setActiveTab] = useState('change');

    return (
        <div className="settings-main-container">
        <div className="settings-flex-layout">
            <nav className="settings-sidebar">
            {TABS.map(tab => (
            <button
                key={tab.key}
                className={`settings-tab-btn${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
            >
                {tab.label}
            </button>
            ))}
            </nav>
            <div className="settings-content-card">
            {TABS.find(tab => tab.key === activeTab)?.component}
        </div>
        </div>
        </div>
    );
    };

export default Settings; 