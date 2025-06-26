import React, { useEffect, useState } from 'react';
import './MyBids.css';
import axios from 'axios';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/my-bids/${user.collegeId}`);
        setBids(response.data);
      } catch (error) {
        console.error('Failed to fetch bids:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.collegeId) {
      fetchBids();
    }
  }, [user?.collegeId]);

  const handleIncreaseBid = (itemId, newBid) => {
    setBids((prev) =>
      prev.map((bid) =>
        bid._id === itemId && newBid > bid.highest_bid
          ? {
              ...bid,
              your_bid: newBid,
              highest_bid: newBid,
              outbid: false,
            }
          : bid
      )
    );
    // Optionally send new bid to backend here using axios.post(...)
  };

  if (loading) return <div className="charts-section">Loading your bids...</div>;

  return (
    <div className="charts-section">
      <div className="profile-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="money bag">💰</span>My Bids
        </h2>
      </div>
      {bids.length === 0 ? (
        <p>You have not placed any bids yet.</p>
      ) : (
        <div className="my-bids-list">
          {bids.map((bid) => {
            const endTime = new Date(bid.end_time).getTime();
            const timeLeft = endTime - now;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const image = Array.isArray(bid.images) ? bid.images[0] : bid.image;

            return (
              <div key={bid._id} className="my-bid-card">
                <div className="my-bid-img-wrap">
                  <img src={image} alt={bid.title} className="my-bid-img" />
                </div>
                <div className="my-bid-info">
                  <h4>{bid.title}</h4>
                  <p>Your current bid: <b>₹{bid.your_bid}</b></p>
                  <p>Highest bid placed: <b>₹{bid.highest_bid}</b></p>
                  {timeLeft > 0 ? (
                    <p>
                      Auction ends in:{' '}
                      <span style={{ color: timeLeft < 60000 ? 'red' : '#f57c00' }}>
                        {hours}h {minutes}m {seconds}s
                      </span>
                    </p>
                  ) : (
                    <p><span style={{ color: 'red', fontWeight: 'bold' }}>Auction ended</span></p>
                  )}
                  {bid.outbid && (
                    <div className="outbid-notification">⚠️ You have been outbid!</div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const newBid = Number(e.target.elements.newBid.value);
                      if (newBid > bid.highest_bid) {
                        handleIncreaseBid(bid._id, newBid);
                        e.target.reset();
                        // Optional: send POST to backend to update bid
                      }
                    }}
                    className="increase-bid-form"
                  >
                    <input
                      type="number"
                      name="newBid"
                      min={bid.highest_bid + 1}
                      placeholder={`Bid more than ₹${bid.highest_bid}`}
                      required
                    />
                    <button className='increaseBid' type='submit'>Increase Bid</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBids;
