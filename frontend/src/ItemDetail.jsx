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
  const [showModal, setShowModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/items/${id}`);
        if (res.data.status === 'success') {
          const fetchedItem = res.data.item;
          setItem(fetchedItem);

          const images = fetchedItem.images || [];
          const media = [...images];
          if (fetchedItem.video) media.push(fetchedItem.video);
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

  const handleBid = async () => {
    const minAllowed = Number(item.starting_price) + Number(item.minimum_increment);
    if (!bidAmount || bidAmount < minAllowed) {
      setError(`Bid must be at least ₹${minAllowed}`);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.post('http://localhost:5000/api/place-bid', {
        item_id: item._id,
        bid_amount: bidAmount,
        bidder_email: user?.email || '',
        bidder_id: user?.collegeId || ''
      });

      if (res.data.status === 'success') {
        alert('Bid placed successfully!');
        setShowModal(false);
        setBidAmount('');
        setError('');
      } else {
        setError(res.data.message || 'Failed to place bid');
      }
    } catch (err) {
      console.error('Bid error:', err);
      setError('Something went wrong while placing the bid');
    }
  };

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
          <p className="item-user"><strong>Posted By:</strong> {item.seller_id}</p>
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
            <button className="bid-button" onClick={() => setShowModal(true)}>
              Bid for Auction
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Place Your Bid</h2>
            <p><strong>Title:</strong> {item.title}</p>
            <p><strong>Seller Email:</strong> {item.seller_id}</p>
            <p><strong>Base Price:</strong> ₹{item.starting_price}</p>
            <p><strong>Min Increment:</strong> ₹{item.minimum_increment}</p>

            <input
              type="number"
              placeholder={`Enter bid ≥ ₹${Number(item.starting_price) + Number(item.minimum_increment)}`}
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              className="bid-input"
            />

            {error && <p className="error-text">{error}</p>}

            <div className="modal-actions">
              <button className="cancel-button" onClick={() => {
                setShowModal(false);
                setError('');
                setBidAmount('');
              }}>
                Cancel
              </button>

              <button className="confirm-bid-button" onClick={handleBid}>
                Place Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ItemDetail;
