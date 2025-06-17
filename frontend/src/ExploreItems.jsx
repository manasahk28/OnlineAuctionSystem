import React, { useState, useEffect } from 'react';
import './ExploreItems.css';
import { useNavigate } from 'react-router-dom';

const ExploreItems = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);

  useEffect(() => {
    // Later you can replace this with API call to fetch items
    const dummyItems = [
      {
        id: 1,
        title: 'Antique Vase',
        price: '₹1200',
        image: 'https://via.placeholder.com/150',
        description: 'Beautiful ceramic vase from 18th century.',
      },
      {
        id: 2,
        title: 'Gaming Laptop',
        price: '₹60,000',
        image: 'https://via.placeholder.com/150',
        description: 'Powerful i7 laptop with RTX graphics.',
      },
      {
        id: 3,
        title: 'Signed Cricket Bat',
        price: '₹5000',
        image: 'https://via.placeholder.com/150',
        description: 'Bat signed by international cricket legends!',
      },
    ];
    setItems(dummyItems);
  }, []);

  return (
    <div className="explore-container">
      <h2 className="explore-heading">🧭 Explore Items</h2>
      <div className="items-grid">
        {items.map(item => (
          <div key={item.id} className="item-card">
            <img src={item.image} alt={item.title} />
            <h3>{item.title}</h3>
            <p className="item-price">{item.price}</p>
            <p className="item-desc">{item.description}</p>
            <button onClick={() => navigate(`/item/${item.id}`)}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreItems;
