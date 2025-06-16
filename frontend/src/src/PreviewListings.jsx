import React from 'react';
import './PreviewListings.css'; // make sure to create and import this
import { useNavigate } from 'react-router-dom';

const dummyListings = [
  {
    id: 1,
    title: "Boat Headphones",
    image: "/assets/headphones.png",
    price: "₹799",
  },
  {
    id: 2,
    title: "DSA Book",
    image: "/assets/dsa-book.png",
    price: "₹199",
  },
  {
    id: 3,
    title: "Casual Hoodie",
    image: "/assets/hoodie.png",
    price: "₹499",
  },
];

function PreviewListings() {
      const navigate = useNavigate();
  return (
    <div className="preview-grid">
      {dummyListings.map(item => (
        <div key={item.id} className="listing-card">
          <img src={item.image} alt={item.title} className="listing-img" />
          <span className="live-badge">🟢 Auction Live</span>
          <div className="listing-details">
            <h4>{item.title}</h4>
            <p className="price">Base price: {item.price}</p>
            <button className="view-button" onClick={() => navigate('/register')}>View Details</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PreviewListings;
