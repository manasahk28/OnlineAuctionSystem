import React, { useState, useEffect } from 'react';
import './ExploreItems.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExploreItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/items');
        if (response.data.status === 'success') {
          setItems(response.data.items);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };

    fetchItems();
  }, []);

  return (
    <div className="explore-container">
      <h2 className="explore-heading">🧭 Explore Items</h2>
      <div className="items-grid">
        {items.map(item => (
          <div key={item._id} className="item-card">
            <img src={item.thumbnail || 'https://via.placeholder.com/150'} alt={item.title} />
            <h3>{item.title}</h3>
            <p className="item-price">₹{item.startingPrice}</p>
            <button onClick={() => navigate(`/item/${item._id}`)}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreItems;
