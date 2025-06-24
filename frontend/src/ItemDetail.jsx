import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ItemDetail.css';
import Layout from './Layout';
import axios from 'axios';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaList, setMediaList] = useState([]);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/item/${id}`);
        if (res.data.status === 'success') {
          const fetchedItem = res.data.item;
          setItem(fetchedItem);

          // Combine images and video into one list for carousel
          const images = fetchedItem.images || [];
          const media = [...images];
          if (fetchedItem.video) {
            media.push(fetchedItem.video);
          }
          setMediaList(media);
        }
      } catch (err) {
        console.error('Error fetching item details:', err);
      }
    };

    fetchItem();
  }, [id]);

  const handlePrev = () => {
    setCurrentMediaIndex((prev) =>
      prev === 0 ? mediaList.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentMediaIndex((prev) =>
      prev === mediaList.length - 1 ? 0 : prev + 1
    );
  };

  if (!item) return <p>Loading...</p>;

  const currentMedia = mediaList[currentMediaIndex];
  const isVideo = currentMedia?.startsWith('data:video');
  return (
    <Layout>
      <div className="item-detail-container">
        <div className="left-panel">
          <div className="carousel-wrapper">
            <button className="arrow left-arrow" onClick={handlePrev}>
              &#8592;
            </button>
            {isVideo ? (
              <video controls className="product-image">
                <source src={currentMedia} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img src={currentMedia} alt="Product" className="product-image" />
            )}
            <button className="arrow right-arrow" onClick={handleNext}>
              &#8594;
            </button>
          </div>
        </div>

        <div className="right-panel">
          <h1 className="item-title">{item.title}</h1>
          {item.limitedCollection && (
            <p style={{ color: '#E6521F', fontWeight: 'bold' }}>
              🚨 Exclusive Limited Collection Item
            </p>
          )}

          <p className="item-price"><strong>Base Price:</strong> ₹{item.starting_price}</p>
          <p className="item-price"><strong>Min Increment:</strong> ₹{item.minimum_increment}</p>
          {item.buy_now_price && (
            <p className="item-price"><strong>Buy Now Price:</strong> ₹{item.buy_now_price}</p>
          )}
          <p className="item-desc"><strong>Description:</strong> {item.description}</p>
          <p className="item-user"><strong>Posted By:</strong> {item.seller_id} ({item.contact_email})</p>
          <p className="item-date"><strong>Auction Starts:</strong> {new Date(item.start_date_time).toLocaleString()}</p>
          <p className="item-date"><strong>Auction Ends:</strong> {new Date(item.end_date_time).toLocaleString()}</p>
          {item.category && <p><strong>Category:</strong> {item.category}</p>}
          {item.tags && <p><strong>Tags:</strong> {item.tags}</p>}
          {item.location && <p><strong>Location:</strong> {item.location}</p>}
          {item.pickup_method && <p><strong>Pickup Method:</strong> {item.pickup_method}</p>}
          {item.delivery_charge && <p><strong>Delivery Charge:</strong> {item.delivery_charge}</p>}
          {item.return_policy && <p><strong>Return Policy:</strong> {item.return_policy}</p>}
          {item.highlights && <p><strong>Highlights:</strong> {item.highlights}</p>}
          {item.item_condition && <p><strong>Condition:</strong> {item.item_condition}</p>}
          {item.warranty && <p><strong>Warranty:</strong> {item.warranty}</p>}

          <div className="action-buttons">
            <button className="back-button" onClick={() => navigate('/explore')}>
              ← Back
            </button>
            <button className="bid-button">
               Bid for Auction
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ItemDetail;
