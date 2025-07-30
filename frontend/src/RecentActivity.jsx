import { useEffect, useState } from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, posts, bids, profile, payments
  const user = JSON.parse(localStorage.getItem('user'));
  const backend = process.env.REACT_APP_BACKEND_URL;

  const fetchActivities = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Fetch activities from the new user activities API
      const activitiesRes = await fetch(`${backend}/api/user-activities/${user.email}`);
      const activitiesData = await activitiesRes.json();

      if (activitiesData.status === 'success') {
        setActivities(activitiesData.activities);
      } else {
        // Fallback to old method if new API is not available
        const [postedRes, bidsRes, profileRes, paymentsRes, notificationsRes] = await Promise.all([
          fetch(`${backend}/api/items/user/${user.email}`),
          fetch(`${backend}/my-bids/email/${user.email}`),
          fetch(`${backend}/api/get-profile?email=${user.email}`),
          fetch(`${backend}/api/payments/${user.email}`),
          fetch(`${backend}/api/notifications/${user.email}`)
        ]);

        const postedData = await postedRes.json();
        const bidData = await bidsRes.json();
        const profileData = await profileRes.json();
        const paymentsData = await paymentsRes.json();
        const notificationsData = await notificationsRes.json();

        let combinedActivities = [];

        // 📦 Handle posted items
        if (postedData.status === 'success') {
          const postActivities = postedData.items.map((item) => ({
            type: 'post',
            action: 'posted',
            amount: parseInt(item.starting_price) || 0,
            item: item.title,
            time: item.timestamp || item.end_date_time || new Date().toISOString(),
            status: item.status || 'active',
            category: item.category || 'Other',
            id: item._id
          }));
          combinedActivities = [...combinedActivities, ...postActivities];
        }

        // 🪙 Handle bid activities
        if (Array.isArray(bidData)) {
          const bidActivities = bidData.map((bid) => ({
            type: 'bid',
            action: 'placed bid',
            amount: parseInt(bid.your_bid) || 0,
            item: bid.title,
            time: bid.timestamp || new Date().toISOString(),
            status: bid.auction_result || 'active',
            category: bid.category || 'Other',
            id: bid._id
          }));
          combinedActivities = [...combinedActivities, ...bidActivities];
        }

        // 👤 Handle profile activities
        if (profileData.status === 'success' && profileData.profile) {
          const profile = profileData.profile;
          const profileActivities = [];

          // Profile creation/update
          if (profile.timestamp) {
            profileActivities.push({
              type: 'profile',
              action: 'updated profile',
              amount: 0,
              item: 'Profile Information',
              time: profile.timestamp,
              status: 'completed',
              category: 'Profile',
              id: 'profile'
            });
          }

          // Profile image activities (if we track them)
          if (profile.profileImage) {
            profileActivities.push({
              type: 'profile',
              action: 'added profile picture',
              amount: 0,
              item: 'Profile Image',
              time: profile.timestamp || new Date().toISOString(),
              status: 'completed',
              category: 'Profile',
              id: 'profile-image'
            });
          }

          combinedActivities = [...combinedActivities, ...profileActivities];
        }

        // 💰 Handle payment activities
        if (paymentsData.payments && Array.isArray(paymentsData.payments)) {
          const paymentActivities = paymentsData.payments.map((payment) => ({
            type: 'payment',
            action: payment.status === 'Completed' ? 'completed payment' : 'pending payment',
            amount: parseInt(payment.amount) || 0,
            item: payment.item_title || 'Auction Item',
            time: payment.timestamp || new Date().toISOString(),
            status: payment.status || 'pending',
            category: 'Payment',
            id: payment._id
          }));
          combinedActivities = [...combinedActivities, ...paymentActivities];
        }

        // 🔔 Handle notification activities (if they represent user actions)
        if (notificationsData.notifications && Array.isArray(notificationsData.notifications)) {
          const notificationActivities = notificationsData.notifications
            .filter(notif => notif.type !== 'admin_comment') // Filter out admin notifications
            .map((notif) => ({
              type: 'notification',
              action: 'received notification',
              amount: 0,
              item: notif.message,
              time: notif.timestamp || new Date().toISOString(),
              status: notif.read ? 'read' : 'unread',
              category: 'Notification',
              id: notif._id
            }));
          combinedActivities = [...combinedActivities, ...notificationActivities];
        }

        // 🕒 Sort by newest first
        combinedActivities.sort((a, b) => {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeB - timeA;
        });

        setActivities(combinedActivities);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchActivities();
    } else {
      setLoading(false);
    }
  }, [user?.email]);

  const getActivityMessage = (activity) => {
    const emoji = getActivityEmoji(activity.type, activity.action);
    const amount = activity.amount > 0 ? ` for ₹${activity.amount.toLocaleString()}` : '';
    const status = getStatusText(activity.status);

    return `${emoji} You ${activity.action}${amount} on "${activity.item}" ${status}`;
  };

  const getActivityEmoji = (type, action) => {
    switch (type) {
      case 'post':
        return '📦';
      case 'bid':
        return '💸';
      case 'profile':
        return action.includes('picture') ? '📷' : '👤';
      case 'payment':
        return '💳';
      case 'notification':
        return '🔔';
      case 'edit':
        return '✏️';
      case 'delete':
        return '🗑️';
      default:
        return '📝';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'won':
        return '(Won!)';
      case 'lost':
        return '(Lost)';
      case 'active':
        return '(Active)';
      case 'completed':
        return '(Completed)';
      case 'pending':
        return '(Pending)';
      case 'read':
        return '(Read)';
      case 'unread':
        return '(Unread)';
      default:
        return '';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';

    // Handle different timestamp formats
    let date;
    if (typeof timestamp === 'string') {
      // Try to parse the timestamp
      date = new Date(timestamp);
    } else if (timestamp.time) {
      // Handle case where timestamp is an object with time property
      date = new Date(timestamp.time);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      // If parsing fails, try to create a reasonable fallback
      const now = new Date();
      return now.toLocaleString();
    }

    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      if (diffInMinutes < 1) return 'Just now';
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getFilteredActivities = () => {
    if (filter === 'all') return activities;
    return activities.filter(activity => activity.type === filter);
  };

  const filteredActivities = getFilteredActivities();

  const handleFilterClick = async (newFilter) => {
    setFilterLoading(true);
    setFilter(newFilter);

    try {
      // Always try to populate activities first when filter is clicked
      const populateRes = await fetch(`${backend}/api/populate-activities/${user.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const populateData = await populateRes.json();

      if (populateData.status === 'success') {
        // Fetch activities after populating
        const activitiesRes = await fetch(`${backend}/api/user-activities/${user.email}`);
        const activitiesData = await activitiesRes.json();

        if (activitiesData.status === 'success') {
          setActivities(activitiesData.activities);
        } else {
          // Fallback to old method
          await fetchActivities(false);
        }
      } else {
        // Fallback to old method
        await fetchActivities(false);
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
      // Fallback to old method
      await fetchActivities(false);
    } finally {
      setFilterLoading(false);
    }
  };



  const handleRefreshActivities = async () => {
    setFilterLoading(true);

    try {
      // Always try to populate activities first when refresh is clicked
      const populateRes = await fetch(`${backend}/api/populate-activities/${user.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const populateData = await populateRes.json();

      if (populateData.status === 'success') {
        // Fetch activities after populating
        const activitiesRes = await fetch(`${backend}/api/user-activities/${user.email}`);
        const activitiesData = await activitiesRes.json();

        if (activitiesData.status === 'success') {
          setActivities(activitiesData.activities);
        } else {
          // Fallback to old method
          await fetchActivities(false);
        }
      } else {
        // Fallback to old method
        await fetchActivities(false);
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
      // Fallback to old method
      await fetchActivities(false);
    } finally {
      setFilterLoading(false);
    }
  };

  return (
    <div className="recent-activity-wrapper">
      <div className="profile-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#444', marginLeft: '-40px', marginTop: '-20px' }}>
          <span role="img" aria-label="recent activity">🗒️</span>Recent Activity
        </h2>

      </div>

      {/* Activity Filter */}
      <div className="activity-filters" style={{ margin: '20px 30px' }}>
        <button
          className="refresh-filter-btn"
          onClick={handleRefreshActivities}
          disabled={filterLoading}
          style={{
            padding: '8px 12px',
            backgroundColor: filterLoading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: filterLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginRight: '10px',
            marginLeft: '-60px',
          }}
        >
          {filterLoading ? '⏳' : '🔄'} Refresh
        </button>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterClick('all')}
          disabled={filterLoading}
        >
          {filterLoading && filter === 'all' ? '⏳' : '📊'} All Activities
        </button>
        <button
          className={`filter-btn ${filter === 'post' ? 'active' : ''}`}
          onClick={() => handleFilterClick('post')}
          disabled={filterLoading}
        >
          {filterLoading && filter === 'post' ? '⏳' : '📦'} Posts
        </button>
        <button
          className={`filter-btn ${filter === 'bid' ? 'active' : ''}`}
          onClick={() => handleFilterClick('bid')}
          disabled={filterLoading}
        >
          {filterLoading && filter === 'bid' ? '⏳' : '💰'} Bids
        </button>
        <button
          className={`filter-btn ${filter === 'profile' ? 'active' : ''}`}
          onClick={() => handleFilterClick('profile')}
          disabled={filterLoading}
        >
          {filterLoading && filter === 'profile' ? '⏳' : '👤'} Profile
        </button>
        <button
          className={`filter-btn ${filter === 'payment' ? 'active' : ''}`}
          onClick={() => handleFilterClick('payment')}
          disabled={filterLoading}
        >
          {filterLoading && filter === 'payment' ? '⏳' : '💳'} Payments
        </button>
      </div>

      {(loading || filterLoading) ? (
        <p className="loading-text">⏳ {filterLoading ? 'Refreshing activities...' : 'Loading your activities...'}</p>
      ) : filteredActivities.length === 0 ? (
        <p className="no-activity">No {filter === 'all' ? '' : filter} activity yet.</p>
      ) : (
        <ul className="activity-list">
          {filteredActivities.map((activity, index) => (
            <li key={`${activity.id}-${index}`} className={`activity-card ${activity.type} ${activity.status}`}>
              <div className="activity-header">
                <span className="activity-time">{formatTime(activity.timestamp || activity.time)}</span>
                <span className="activity-category">{activity.category}</span>
              </div>
              <p className="activity-message">{getActivityMessage(activity)}</p>
              {activity.amount > 0 && (
                <div className="activity-amount">₹{activity.amount.toLocaleString()}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivity;
