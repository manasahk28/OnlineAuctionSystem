import { useEffect, useState } from 'react';
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
  const [showMediaFullscreen, setShowMediaFullscreen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.is_admin === true;
  const isAuctionEnded = item && new Date(item.end_date_time) < new Date();



  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/item/${id}`);
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
    setCurrentMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentMediaIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
      }
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowMediaFullscreen(false);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mediaList]);
  

  const toggleMediaFullscreen = () => {
    setShowMediaFullscreen(!showMediaFullscreen);
  };


  const handleBid = async () => {
     if (isAdmin) {
      setError("Admins are not allowed to place bids.");
      return;
    }

    const minAllowed = Number(item.starting_price) + Number(item.minimum_increment);

    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      setError('Please enter a valid positive number for your bid');
      return;
    }

  if (bidAmount < minAllowed) {
    setError(`Your bid must be at least ₹${minAllowed}`);
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
      alert('🎉 Bid placed successfully!');
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

if (!item) {
  return (
    <div className="loader-wrapper">
      <div className="loading-spinner"></div>
    </div>
  );
}

  const currentMedia = mediaList[currentMediaIndex];
  const isVideo = currentMedia?.startsWith('data:video');


  const content = (
      <div className="item-detail-container">
        <div className="left-panel">

        <div className="carousel-wrapper">
        {mediaList.length > 1 && (
          <button className="arrow left-arrow" onClick={handlePrev}>
            &#8592;
          </button>
        )}
        
        {isVideo ? (
          <video controls className="product-image" onClick={toggleMediaFullscreen}>
            <source src={currentMedia} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img src={currentMedia} alt="Product" className="product-image" onClick={toggleMediaFullscreen} />
        )}
        
        {mediaList.length > 1 && (
          <button className="arrow right-arrow" onClick={handleNext}>
            &#8594;
          </button>
        )}
          </div>

          {mediaList.length > 1 && (
            <div className="thumbnail-row">
              {mediaList.map((media, index) => {
                const isVideo = media?.startsWith('data:video');
                return (
                  <div
                    key={index}
                    className={`thumbnail ${currentMediaIndex === index ? 'active' : ''}`}
                    onClick={() => setCurrentMediaIndex(index)}
                  >
                    {isVideo ? (
                        <video key={index} src={media} />
                    ) : (
                      <img src={media} alt={`Preview ${index}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        <div className="right-panel">
          <h1 className="item-title">{item.title}</h1>
          {item.status && (<p className={`approval-status ${item.status.toLowerCase()}`}><strong>Status:</strong> {item.status}</p>)}
          {item.limitedCollection && (
            <p style={{ color: '#E6521F', fontWeight: 'bold' }}>
              🚨 Exclusive Limited Collection Item
            </p>
          )}
          <p className="item-price"><strong>Base Price:</strong> ₹{item.starting_price}</p>
          <p className="item-price"><strong>Min Increment:</strong> ₹{item.minimum_increment}</p>
          {item.buy_now_price && <p className="item-price"><strong>Buy Now Price:</strong> ₹{item.buy_now_price}</p>}
          {item.custom_item_id && (<p className="item-id"><strong>Item ID:</strong> {item.custom_item_id}</p>)}
          <p className="item-user"><strong>Posted By:</strong> {item.seller_id?.replace(/(.{2}).+(@.+)/, '$1****$2')}</p>          <p className="item-date"><strong>Auction Starts:</strong> {new Date(item.start_date_time).toLocaleString()}</p>
          <p className="item-date"><strong>Auction Ends:</strong> {new Date(item.end_date_time).toLocaleString()}</p>
          {item.category && <p><strong>Category:</strong> {item.category}</p>}
          {item.tags && <p><strong>Tags:</strong> {item.tags}</p>}
          {item.location && <p><strong>Location:</strong> {item.location}</p>}
          {item.pickup_method && <p><strong>Pickup Method:</strong> {item.pickup_method}</p>}
          {item.delivery_charge && <p><strong>Delivery Charge:</strong> {item.delivery_charge}</p>}
          {item.return_policy && <p><strong>Return Policy:</strong> {item.return_policy}</p>}
          {item.highlights && <p><strong>Highlights:</strong> {item.highlights}</p>}
          {item.item_condition && <p><strong>Condition:</strong> {item.item_condition}</p>}
          {item.warranty && (
            <>
              <p><strong>Warranty:</strong> {item.warranty}</p>
              {item.warranty === 'Yes' && item.warranty_duration && (
                <p><strong>Duration:</strong> {item.warranty_duration}</p>
              )}
            </>
          )}

          {/* <div className="action-buttons">
            <button className="back-button" onClick={() => navigate('/explore')}>
              ← Back
            </button>
            <button className="bid-button" onClick={() => setShowModal(true)}>
              Bid for Auction
            </button>
          </div> 
          </div>
          </div>        */}

        <div className="action-buttons">
          <button
            className="back-button"
            onClick={() => navigate(isAdmin ? '/AdminDashboard' : '/explore')}
          >
            ← Back
          </button>
          {!isAdmin && !isAuctionEnded && (
            <button className="bid-button" onClick={() => setShowModal(true)}>
              Bid for Auction
            </button>
          )}
          
          {!isAdmin && isAuctionEnded && (
            <p className="auction-ended-text">⏳ Auction has ended. Bidding is closed.</p>
          )}

        </div>
      </div>

      {!isAdmin && showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>Place Your Bid</h2>
            <p><strong>Title:</strong> {item.title}</p>
            <p><strong>Seller Email:</strong> {item.seller_id}</p>
            <p><strong>Base Price:</strong> ₹{item.starting_price}</p>
            <p><strong>Min Increment:</strong> ₹{item.minimum_increment}</p>

            <input
              type="number"
              min={Number(item.starting_price) + Number(item.minimum_increment)}
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


      {showMediaFullscreen && (
        <div className="fullscreen-overlay" onClick={toggleMediaFullscreen}>
          <div className="fullscreen-media">
            {isVideo ? (
              <video controls autoPlay>
                <source src={currentMedia} type="video/mp4" />
              </video>
            ) : (
              <img src={currentMedia} alt="Full view" />
            )}
          </div>
        </div>
      )}
      </div>
  );
    return isAdmin ? content : <Layout>{content}</Layout>;

};

export default ItemDetail;
