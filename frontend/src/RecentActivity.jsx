import React, { useEffect, useState } from 'react';
import './RecentActivity.css';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const [postedRes, bidsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/items/user/${user.email}`),
          fetch(`http://localhost:5000/my-bids/email/${user.email}`),
        ]);

        const postedData = await postedRes.json();
        const bidData = await bidsRes.json();

        let combinedActivities = [];

        // Handle posted items
        if (postedData.status === 'success') {
          const postActivities = postedData.items.map((item) => ({
            type: 'post',
            amount: parseInt(item.starting_price) || 0,
            item: item.title,
            time: new Date(item.timestamp || item.end_date_time).toLocaleString(),
          }));
          combinedActivities = [...combinedActivities, ...postActivities];
        }

        // Handle bid activities
        if (Array.isArray(bidData)) {
          const bidActivities = bidData.map((bid) => ({
            type: 'bid',
            amount: parseInt(bid.your_bid) || 0,
            item: bid.title,
            time: new Date(bid.end_time).toLocaleString(), // or use bid.timestamp if preferred
          }));
          combinedActivities = [...combinedActivities, ...bidActivities];
        }

        // Sort by newest first
        combinedActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
        setActivities(combinedActivities);
      } catch (error) {
        console.error('Error fetching activity:', error);
      }
    };

    if (user?.email) {
      fetchActivities();
    }
  }, [user]);

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
