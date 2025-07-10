import axios from 'axios';
import { useEffect, useState } from 'react';
import './Notifications.css';

const NotificationsPage = () => {
  const userEmail = localStorage.getItem('userEmail');
  const token = localStorage.getItem('token');

  const [preferences, setPreferences] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const togglePreference = (type) => {
    const updatedPrefs = {
      ...preferences,
      [type]: !preferences[type],
    };
    setPreferences(updatedPrefs);

    axios
      .post(
        'http://localhost:5000/api/notifications/preferences/update',
        {
          email: userEmail,
          preferences: updatedPrefs,
        },
        authHeader
      )
      .catch((err) => {
        console.error('⚠️ Error updating preferences', err);
      });
  };

  useEffect(() => {
    if (!userEmail || !token) {
      setError('User not logged in or token missing');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [notifRes, prefsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/notifications/${userEmail}`),
          axios.get(
            `http://localhost:5000/api/notifications/preferences/${userEmail}`,
            authHeader
          ),
        ]);

        setNotifications(notifRes.data.notifications || []);
        setPreferences(prefsRes.data.preferences || {});
      } catch (err) {
        console.error(err);
        setError('Error fetching notifications or preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail, token]);

  const filteredNotifications = notifications.filter(
    (n) => preferences[`enable_${n.type}`]
  );

  return (
    <div className="notifications-wrapper">
      <div className="profile-header">
        <h2>🔔 Notifications</h2>
      </div>

      <div className="notifications-container">
        <div className="left-section">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <div
                key={n._id}
                className={`notification-card ${
                  n.type === 'admin_comment' ? 'admin-comment' : ''
                }`}
              >
                <strong className="notif-title">
                  {n.type.replace(/_/g, ' ').toUpperCase()}
                </strong>
                <p className="notif-message">{n.message}</p>
                <small className="notif-time">
                  {new Date(n.timestamp).toLocaleString()}
                </small>
              </div>
            ))
          ) : (
            <p className="no-alerts">🎉 You're all caught up!</p>
          )}
        </div>

        <div className="right-section">
          <h4>Manage Notifications</h4>
          {Object.keys(preferences).map((key) => (
            <div key={key} className="toggle-item">
              <label>
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={() => togglePreference(key)}
                />
                {' '}
                {key
                  .replace('enable_', '')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

