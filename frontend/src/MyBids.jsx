import React, { useEffect, useState } from 'react';
import './MyBids.css';
import axios from 'axios';

const MyBids = () => {
  const [bids, setBids] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  // Timer for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user's bids using their email
  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/my-bids/email/${user.email}`);
        setBids(response.data);
      } catch (error) {
        console.error('Failed to fetch bids:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchBids();
    }
  }, [user?.email]);

  // Handle increasing the bid and send it to backend
  const handleIncreaseBid = async (itemId, newBid) => {
    try {
      const res = await axios.post('http://localhost:5000/api/place-bid', {
        item_id: itemId,
        bid_amount: Number(newBid), // 👈 Ensure this is a number
        bidder_email: user?.email || '',
        bidder_id: user?.collegeId || ''
      });

      if (res.data.status === 'success') {
        setBids((prev) =>
          prev.map((bid) =>
            bid._id === itemId
              ? {
                  ...bid,
                  your_bid: newBid,
                  highest_bid: newBid,
                  outbid: false
                }
              : bid
          )
        );
        alert("Bid updated successfully!");
      } else {
        alert(res.data.message || "Failed to update bid");
      }
    } catch (error) {
      console.error('Error updating bid:', error);
      alert("Error updating bid. Please try again.");
    }
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
                  <p>Your current bid: <b>₹{Number(bid.your_bid).toLocaleString()}</b></p>
                  <p>Highest bid placed: <b>₹{Number(bid.highest_bid).toLocaleString()}</b></p>
                  {bid.seller_email && <p>Seller: <b>{bid.seller_email}</b></p>}
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

                  {timeLeft > 0 ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const newBid = Number(e.target.elements.newBid.value);
                        if (newBid >= bid.highest_bid + 1) {
                          handleIncreaseBid(bid._id, newBid);
                          e.target.reset();
                        } else {
                          alert(`Your bid must be at least ₹${bid.highest_bid + 1}`);
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
                      <button className="increaseBid" type="submit">Increase Bid</button>
                    </form>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#999' }}>
                      Bidding closed – auction has ended.
                    </p>
                  )}

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
