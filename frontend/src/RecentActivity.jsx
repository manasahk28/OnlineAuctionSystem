import React, { useEffect, useState } from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${user._id}/activities`);
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    if (user?._id) {
      fetchActivities();
    }
  }, [user._id]);

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'bid':
        return `💸 You placed a bid of ₹${activity.amount} on "${activity.item}"`;
      case 'post':
        return `📦 You posted "${activity.item}" for ₹${activity.amount}`;
      case 'win':
        return `🏆 You won "${activity.item}" for ₹${activity.amount}`;
      default:
        return '❔ Unknown activity';
    }
  };
<p>haii</p>
  return (
    <div className="recent-activity-wrapper">
      <div className="profile-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#444' }}>
          <span role="img" aria-label="money bag">🗒️</span>Recent Activity
        </h2>
      </div>
      {activities.length === 0 ? (
        <p className="no-activity">No recent activity yet.</p>
      ) : (
        <ul className="activity-list">
          {activities.map((activity, index) => (
            <li key={index} className={`activity-card ${activity.type}`}>
              <span className="activity-time">{activity.time}</span>
              <p className="activity-message">{getActivityMessage(activity)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentActivity;
