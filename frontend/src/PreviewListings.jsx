import React, { useEffect, useState } from 'react';
import './PreviewListings.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function getRandomItems(arr, n) {
  if (arr.length <= n) return arr;
  const shuffled = arr.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

const FEATURED_KEY = 'featured_items_ids_v1';

function PreviewListings() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/items');
        if (response.data.status === 'success') {
          const allItems = response.data.items;
          let featuredIds = JSON.parse(localStorage.getItem(FEATURED_KEY) || 'null');
          let featured;
          if (featuredIds && Array.isArray(featuredIds)) {
            // Use stored featured ids
            featured = featuredIds
              .map(id => allItems.find(item => item._id === id))
              .filter(Boolean);
            // If some ids are missing (item deleted), refill
            if (featured.length < 5 && allItems.length >= 5) {
              const missing = 5 - featured.length;
              const remaining = allItems.filter(item => !featuredIds.includes(item._id));
              const fill = getRandomItems(remaining, missing);
              featured = [...featured, ...fill];
              localStorage.setItem(FEATURED_KEY, JSON.stringify(featured.map(i => i._id)));
            }
          } else {
            // Pick new random featured items
            featured = getRandomItems(allItems, 5);
            localStorage.setItem(FEATURED_KEY, JSON.stringify(featured.map(i => i._id)));
          }
          setItems(featured);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) {
    return <div className="preview-grid"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="preview-grid">
      {items.map((item) => (
        <div key={item._id} className="listing-card">
          <img src={item.thumbnail || 'https://via.placeholder.com/200'} alt={item.title} className="listing-img" />
          <span className="live-badge">🟢 Auction Live</span>
          <div className="listing-details">
            <h4>{item.title}</h4>
            <p className="price">Base price: ₹{item.startingPrice}</p>
            <button className="view-button" onClick={() => navigate(`/item/${item._id}`)}>
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PreviewListings;
