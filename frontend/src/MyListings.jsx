import React, { useEffect, useState } from 'react';
import './MyListings.css';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);


  // TO BE FETCHED FROM DB
   
  // const user = JSON.parse(localStorage.getItem('user'));

  // useEffect(() => {
  //   const fetchListings = async () => {
  //     try {
  //       const response = await fetch(`http://localhost:5000/api/listings/user/${user._id}`);
  //       const data = await response.json();
  //       setListings(data);
  //     } catch (error) {
  //       console.error('Failed to fetch listings:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (user?._id) {
  //     fetchListings();
  //   }
  // }, [user]);

  useEffect(() => {
    // Dummy data with aesthetic images
    const dummyListings = [
      {
        _id: '1',
        imageUrl: 'https://images.pexels.com/photos/37397/camera-old-antique-voigtlander.jpg', // Vintage Camera
        title: 'Vintage Camera',
        description: 'Old-school camera in great condition.',
        startingPrice: 2500,
        endTime: new Date(Date.now() + 86400000).toISOString(), // +1 day
      },
      {
        _id: '2',
        imageUrl: 'https://images.pexels.com/photos/32608375/pexels-photo-32608375.jpeg', // Acoustic Guitar
        title: 'Acoustic Guitar',
        description: 'Acoustic guitar, barely used.',
        startingPrice: 4500,
        endTime: new Date(Date.now() + 172800000).toISOString(), // +2 days
      },
      {
        _id: '3',
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', // Smartphone
        title: 'Smartphone',
        description: 'Latest model, excellent condition.',
        startingPrice: 15000,
        endTime: new Date(Date.now() + 259200000).toISOString(), // +3 days
      },
    ];

    setTimeout(() => {
      setListings(dummyListings);
      setLoading(false);
    }, 1000); // simulate loading delay
  }, []);


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
