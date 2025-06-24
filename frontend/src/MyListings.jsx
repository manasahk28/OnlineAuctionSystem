import React, { useEffect, useState } from 'react';
import './MyListings.css';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get logged-in user info from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/items/user/${user.email}`);
        const data = await response.json();

        if (data.status === 'success') {
          // Format only required fields
          const formatted = data.items.map((item) => ({
            _id: item._id,
            title: item.title,
            description: item.description,
            startingPrice: item.startingPrice,
            endTime: item.auctionEnd,
            imageUrl: item.images?.[0] || 'https://via.placeholder.com/200', // default image fallback
          }));
          setListings(formatted);
        } else {
          console.error('Failed to fetch user listings:', data.message);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchListings();
    }
  }, [user]);

  return (
    <div className="my-listings-wrapper">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#333' }}>
        <span role="img" aria-label="box">📦</span>My Listings
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
