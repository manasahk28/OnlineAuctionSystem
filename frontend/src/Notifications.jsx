import React, { useState } from 'react';
import './Notifications.css';

const NotificationsPage = () => {
  const [preferences, setPreferences] = useState({
    outbid: true,
    auctionEnding: true,
    winLoss: true,
    newListing: true,
    payment: true,
  });

  const togglePreference = (type) => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const dummyNotifications = [
    { id: 1, text: "You've been outbid on Canon DSLR 📸!", type: 'outbid' },
    { id: 2, text: "Your item Bluetooth Speaker has received 5 bids!", type: 'newListing' },
    { id: 3, text: "Auction for Study Lamp ends in 2 hours ⏰", type: 'auctionEnding' },
    { id: 4, text: "Congrats! You won the bid for HP Laptop 🎉", type: 'winLoss' },
    { id: 5, text: "Payment successful for your purchase 🧾", type: 'payment' },
  ];

  const filteredNotifications = dummyNotifications.filter(
    notif => preferences[notif.type]
  );

  return (
    <div className="notifications-wrapper">
      <div className="profile-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="money bag">🔔</span>Notifications
        </h2>
      </div>

    <div className="notifications-container">
      <div className='left-section'>
      <div className="notification-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notif => (
            <div key={notif.id} className="notification-card">
              <p>{notif.text}</p>
            </div>
          ))
        ) : (
          <p className="no-alerts">You're all caught up. 🎉</p>
        )}
      </div>
      </div>

    <div className='right-section'>
      <div className="notification-preferences">
        <h4>Manage Notifications</h4>
        {Object.keys(preferences).map(type => (
          <div key={type} className="toggle-item">
            <label>
              <input
                type="checkbox"
                checked={preferences[type]}
                onChange={() => togglePreference(type)}
              />
              {type === 'outbid' && 'Outbid Alerts'}
              {type === 'auctionEnding' && 'Auction Ending Soon'}
              {type === 'winLoss' && 'Win/Loss Updates'}
              {type === 'newListing' && 'New Listings in Favorite Categories'}
              {type === 'payment' && 'Payment Updates'}
            </label>
          </div>
        ))}
      </div>
      </div>

    
    </div>
    </div>
  );
};

export default NotificationsPage;
