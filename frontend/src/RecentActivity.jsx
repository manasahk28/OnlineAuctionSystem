import React, { useEffect, useState } from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  // const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Dummy data
    const dummyActivities = [
      {
        type: 'bid',
        amount: 500,
        item: 'Wireless Headphones',
        time: '2025-06-18 10:24 AM',
      },
      {
        type: 'post',
        amount: 1200,
        item: 'Bluetooth Speaker',
        time: '2025-06-17 3:12 PM',
      },
      {
        type: 'win',
        amount: 850,
        item: 'Gaming Mouse',
        time: '2025-06-16 6:45 PM',
      },
      {
        type: 'bid',
        amount: 999,
        item: 'Smartwatch',
        time: '2025-06-15 11:15 AM',
      },
    ];

    setActivities(dummyActivities);
  }, []);

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
