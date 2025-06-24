import React, { useEffect, useState } from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchPostedItems = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/items/user/${user.email}`);
        const data = await response.json();

        if (data.status === 'success') {
          const postActivities = data.items.map((item) => ({
            type: 'post',
            amount: item.startingPrice,
            item: item.title,
            time: new Date(item.timestamp || item.auctionEnd).toLocaleString(), // fallback to endTime if timestamp is missing
          }));
          setActivities(postActivities);
        } else {
          console.error('Failed to fetch activities:', data.message);
        }
      } catch (error) {
        console.error('Error fetching user listings:', error);
      }
    };

    if (user?.email) {
      fetchPostedItems();
    }
  }, [user]);

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
          <span role="img" aria-label="recent activity">🗒️</span>Recent Activity
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
