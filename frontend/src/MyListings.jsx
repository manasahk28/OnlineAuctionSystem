import React, { useEffect, useState } from 'react';
import './MyListings.css';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/listings/user/${user._id}`);
        const data = await response.json();
        setListings(data);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchListings();
    }
  }, [user]);

  return (
    <div className="my-listings-wrapper">
<h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#333' }}>
        <span role="img" aria-label="money bag">📦</span>My Listings
      </h2>
      {loading ? (
        <p className="loading-text">Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="no-listings-text">You haven't posted any listings yet.</p>
      ) : (
        <div className="listings-grid">
          {listings.map((item) => (
            <div className="listing-card" key={item._id}>
              <img src={item.imageUrl} alt={item.title} className="listing-image" />
              <div className="listing-content">
                <h3 className="listing-title">{item.title}</h3>
                <p className="listing-description">{item.description}</p>
                <div className="listing-meta">
                  <span className="price-tag">₹{item.startingPrice}</span>
                  <span className="end-time">⏳ Ends: {new Date(item.endTime).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
