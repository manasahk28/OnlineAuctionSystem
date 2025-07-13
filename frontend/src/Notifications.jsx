import axios from 'axios';
import { useEffect, useState } from 'react';
import './Notifications.css';

const NotificationsPage = () => {
  // Use the same storage logic as login.jsx
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = user.email;
  const token = localStorage.getItem('token');

  const [preferences, setPreferences] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const authHeader = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};

  // Re-fetch preferences after update, show error if fails
  const togglePreference = async (type) => {
    const updatedPrefs = {
      ...preferences,
      [type]: !preferences[type],
    };
    setPreferences(updatedPrefs);
    try {
      await axios.post(
        'http://localhost:5000/api/notifications/preferences/update',
        {
          email: userEmail,
          preferences: updatedPrefs,
        },
        authHeader
      );
      // Re-fetch preferences to ensure UI matches DB
      const prefsRes = await axios.get(
        `http://localhost:5000/api/notifications/preferences/${userEmail}`,
        authHeader
      );
      setPreferences(prefsRes.data.preferences || {});
    } catch (err) {
      setError('⚠️ Error updating preferences');
      console.error('⚠️ Error updating preferences', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.post('http://localhost:5000/api/notifications/mark_seen', {
        notification_id: notificationId,
      });
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );
    } catch (err) {
      console.error('❌ Failed to mark as read:', err);
    }
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

        setNotifications(
          (notifRes.data.notifications || []).sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )
        );
        setPreferences(prefsRes.data.preferences || {});
      } catch (err) {
        console.error(err);
        setError('Error fetching notifications or preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, [userEmail, token]);

  const calculateRemainingTime = (endTime) => {
    const diff = new Date(endTime) - currentTime;
    if (diff <= 0) return '⏳ Auction ended';

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diff < 5 * 60 * 1000) {
      return `${minutes}m ${seconds}s remaining`;
    } else if (diff < 60 * 60 * 1000) {
      return `${minutes}m remaining`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${days}d ${hours}h remaining`;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const type = n.type?.toLowerCase();
    const typeKey = type === 'payment_pending' ? 'payment' : type;
    const isEnabled = preferences[`enable_${typeKey}`] !== false;

    if (!isEnabled) return false;

    if (type === 'auction_ending') {
      const endTime = n.end_time || n.end_date_time;
      if (!endTime || new Date(endTime) <= currentTime) return false;
      if (n.seller_email && n.seller_email === userEmail) return false;
    }

    if (type === 'outbid') {
      return true;
    }

    return true;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkExpiredAuctions = () => {
      const hasExpiredAuctions = filteredNotifications.some(n => {
        if (n.type === 'auction_ending') {
          const endTime = n.end_time || n.end_date_time;
          return endTime && new Date(endTime) <= currentTime;
        }
        return false;
      });
      if (hasExpiredAuctions) {
        const fetchData = async () => {
          try {
            const [notifRes, prefsRes] = await Promise.all([
              axios.get(`http://localhost:5000/api/notifications/${userEmail}`),
              axios.get(
                `http://localhost:5000/api/notifications/preferences/${userEmail}`,
                authHeader
              ),
            ]);
            setNotifications(
              (notifRes.data.notifications || []).sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )
            );
            setPreferences(prefsRes.data.preferences || {});
          } catch (err) {
            console.error(err);
          }
        };
        fetchData();
      }
    };
    const expiredTimer = setInterval(checkExpiredAuctions, 30000);
    return () => clearInterval(expiredTimer);
  }, [filteredNotifications, currentTime, userEmail, token]);

  const typeLabels = {
    payment_pending: 'Payment Pending',
    winner: 'Winner',
    outbid: 'Outbid',
    auction_ending: 'Auction Ending Soon',
    auction_end: 'Auction Ended',
  };

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
            filteredNotifications.map((n) => {
              const notifId = String(n._id);
              const type = n.type?.toLowerCase();
              const isWinner = type === 'winner';
              const isAuctionEnding = type === 'auction_ending';
              const isAuctionEnd = type === 'auction_end';
              const isOutbid = type === 'outbid';
              const isPayment = type === 'payment_pending';
              const isAdminComment = type === 'admin_comment';
              const isOutbidDuringBidding = isOutbid && n.actionable !== false;
              const isOutbidAuctionEnd = isOutbid && n.actionable === false;
              const isExpanded = expandedNotificationId === notifId;
              const endTime = n.end_time || n.end_date_time;
              const isActionable = n.actionable !== false;

              return (
                <div
                  key={notifId}
                  className={`notification-card ${n.seen ? 'seen' : 'unseen'} ${
                    isWinner
                      ? 'winner-notif'
                      : isAuctionEnding
                      ? 'auction-ending-notif'
                      : isAuctionEnd
                      ? 'auction-end-notif'
                      : isOutbidDuringBidding
                      ? 'outbid-notif'
                      : isOutbidAuctionEnd
                      ? 'auction-end-notif'
                      : isPayment || isAdminComment
                      ? 'auction-ending-notif'
                      : ''
                  }`}
                  onClick={() => {
                    if (isWinner || isAuctionEnding || isOutbidDuringBidding) {
                      setExpandedNotificationId((prev) =>
                        prev === notifId ? null : notifId
                      );
                    }
                  }}
                >
                  <strong className="notif-title">
                    {typeLabels[type] || type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </strong>
                  <div className="notif-message">
                    {n.message}
                    <span className="notif-time-inline"> {new Date(n.timestamp).toLocaleString()}</span>
                    {isAuctionEnding && endTime && (
                      <span className={`countdown ${
                        new Date(endTime) - currentTime < 60 * 1000 ? 'critical' :
                        new Date(endTime) - currentTime < 5 * 60 * 1000 ? 'urgent' : ''
                      }`}>
                        {' '}{new Date(endTime) - currentTime < 60 * 1000 ? '🚨 ' : '⏰ '}
                        {calculateRemainingTime(endTime)}
                      </span>
                    )}
                  </div>
                  {!n.seen && (
                    <button
                      className="mark-read-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notifId);
                      }}
                    >
                      Mark as Read
                    </button>
                  )}
                  {isAuctionEnding && isExpanded && isActionable && (
                    <div className="expanded-section">
                      <p>🚀 Hurry! This auction is ending soon. Don’t miss your chance to bid.</p>
                      <button
                        className="view-item-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/item/${n.item_id}`;
                        }}
                      >
                        Place Your Bid
                      </button>
                    </div>
                  )}
                  {isWinner && isExpanded && isActionable && (
                    <div className="expanded-section">
                      <p>✅ You’ve won the auction! Click below to complete your payment.</p>
                      <button
                        className="payment-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = '/payments';
                        }}
                      >
                        Go to Payment
                      </button>
                    </div>
                  )}
                  {isOutbidDuringBidding && isExpanded && isActionable && (
                    <div className="expanded-section">
                      <p>⚠ You've been outbid. Want to reclaim the lead?</p>
                      <button
                        className="view-item-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/item/${n.item_id}`;
                        }}
                      >
                        Rebid Now
                      </button>
                    </div>
                  )}
                  {isOutbidAuctionEnd && isExpanded && (
                    <div className="expanded-section">
                      <p>❌ You didn't win this auction. Better luck next time!</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="no-alerts">🎉 You're all caught up!</p>
          )}
        </div>
        <div className="right-section">
          <h4>Manage Notifications</h4>
          {Object.keys(preferences)
            .filter(
              key =>
                !key.toLowerCase().includes('email') &&
                key !== 'enable_new_item'
            )
            .map((key) => (
              <div key={key} className="toggle-item">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={() => togglePreference(key)}
                  />{' '}
                  {key === 'enable_payment'
                    ? 'Payment Pending'
                    : key.replace('enable_', '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

