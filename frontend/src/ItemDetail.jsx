import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ItemDetail.css';
import axios from 'axios';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/item/${id}`);
        if (res.data.status === 'success') {
          setItem(res.data.item);
        }
      } catch (err) {
        console.error('Error fetching item details:', err);
      }
    };

    fetchItem();
  }, [id]);

  const handlePrev = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? item.images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === item.images.length - 1 ? 0 : prev + 1
    );
  };

  if (!item) return <p>Loading...</p>;

  const currentImage =
    item.images && item.images.length > 0
      ? item.images[currentImageIndex]
      : 'https://via.placeholder.com/300';

  return (
    <div className="item-detail-container">
      <div className="left-panel">
        <div className="carousel-wrapper">
          <button className="arrow left-arrow" onClick={handlePrev}>
            &#8592;
          </button>
          <img src={currentImage} alt="Product" className="product-image" />
          <button className="arrow right-arrow" onClick={handleNext}>
            &#8594;
          </button>
        </div>
      </div>

      <div className="right-panel">
        <h1 className="item-title">{item.title}</h1>
        <p className="item-desc">{item.description}</p>
        <p className="item-price"><strong>Base Price:</strong> ₹{item.startingPrice}</p>
        <p className="item-user"><strong>Posted By:</strong> {item.userName} ({item.userEmail})</p>
        <p className="item-date"><strong>Auction Ends:</strong> {new Date(item.auctionEnd).toLocaleString()}</p>

        <div className="action-buttons">
          <button className="back-button" onClick={() => navigate('/explore')}>
            ← Back
          </button>
          <button className="bid-button">
            💰 Bid for Auction
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
