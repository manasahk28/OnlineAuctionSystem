import { useEffect, useState } from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true); // 🌟 added loading state
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true); // 🔄 start loading
      try {
        const [postedRes, bidsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/items/user/${user.email}`),
          fetch(`http://localhost:5000/my-bids/email/${user.email}`),
        ]);

        const postedData = await postedRes.json();
        const bidData = await bidsRes.json();

        let combinedActivities = [];

        // 📨 Handle posted items
        if (postedData.status === 'success') {
          const postActivities = postedData.items.map((item) => ({
            type: 'post',
            amount: parseInt(item.starting_price) || 0,
            item: item.title,
            time: item.timestamp || item.end_date_time || null,
          }));
          combinedActivities = [...combinedActivities, ...postActivities];
        }

        // 🪙 Handle bid activities
        if (Array.isArray(bidData)) {
          const bidActivities = bidData.map((bid) => ({
            type: 'bid',
            amount: parseInt(bid.your_bid) || 0,
            item: bid.title,
            time: bid.timestamp || null,
          }));
          combinedActivities = [...combinedActivities, ...bidActivities];
        }

        // 🕒 Sort by newest first
        combinedActivities.sort((a, b) => {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeB - timeA;
        });

        setActivities(combinedActivities);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false); // ✅ stop loading no matter what
      }
    };

    if (user?.email) {
      fetchActivities();
    } else {
      setLoading(false); // ✅ prevent infinite loading if no user
    }
  }, []);

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'bid':
        return `💸 You placed a bid of ₹${activity.amount.toLocaleString()} on "${activity.item}"`;
      case 'post':
        return `📦 You posted "${activity.item}" for ₹${activity.amount.toLocaleString()}`;
      case 'win':
        return `🏆 You won "${activity.item}" for ₹${activity.amount.toLocaleString()}`;
      default:
        return '❔ Unknown activity';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString(); // handled by browser
  };

  return (
    <div className="recent-activity-wrapper">
      <div className="profile-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#444', marginLeft:'30px'}}>
          <span role="img" aria-label="recent activity">🗒️</span>Recent Activity
        </h2>
      </div>
      {loading ? (
        <p className="loading-text">⏳ Loading your activities...</p>
      ) : activities.length === 0 ? (
        <p className="no-activity">No recent activity yet.</p>
      ) : (
        <ul className="activity-list">
          {activities.map((activity, index) => (
            <li key={index} className={`activity-card ${activity.type}`}>
              <span className="activity-time">{formatTime(activity.time)}</span>
              <p className="activity-message">{getActivityMessage(activity)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivity;
