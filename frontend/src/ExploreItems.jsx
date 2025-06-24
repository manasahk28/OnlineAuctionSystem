import React, { useState, useEffect } from 'react';
import './ExploreItems.css';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExploreItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/items');
        if (response.data.status === 'success') {
          setItems(response.data.items);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const getColorByIndex = (index) => {
    const colors = ['#FCEF91', '#FB9E3A', '#E6521F', '#EA2F14'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="explore-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="explore-container">
        <div className="explore-header">
          <h2 className="explore-heading">🧭 Explore Items</h2>
          <div className="header-underline"></div>
        </div>

        <div className="items-grid">
          {items.map((item, index) => (
            <div
              key={item._id}
              className="item-card"
              style={{
                borderTop: `4px solid ${getColorByIndex(index)}`,
                backgroundColor: 'white'
              }}
            >
              <div className="square-image-container">
                <img
                  src={item.thumbnail || 'https://via.placeholder.com/150'}
                  alt={item.title}
                  className="item-image"
                />
                {item.limitedCollection && (
                  <div className="exclusive-badge" title="Exclusive Item">⭐</div>
                )}
              </div>

              <div className="item-content">
                <h3 className="item-title">{item.title}</h3>
                <p className="item-price" style={{ color: getColorByIndex(index) }}>
                  ₹{item.starting_price}
                </p>
                <button
                  onClick={() => navigate(`/item/${item._id}`)}
                  style={{
                    backgroundColor: getColorByIndex(index),
                    color: index % 2 === 0 ? '#333' : 'white'
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ExploreItems;
