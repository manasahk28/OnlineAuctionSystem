import React, { useEffect, useState } from 'react';
import './MyBids.css';

const MyBids = () => {
  // Dummy bid data
  const [bids, setBids] = useState([
    {
      id: 1,
      itemName: 'DSA Book',
      itemImage: '/assets/dsa-book.png',
      currentBid: 1200,
      highestBid: 1500,
      endTime: Date.now() + 1000 * 60 * 60 * 2,
      outbid: true,
    },
    {
      id: 2,
      itemName: 'Wireless Headphones',
      itemImage: '/assets/headphones.png',
      currentBid: 2500,
      highestBid: 2500,
      endTime: Date.now() + 1000 * 60 * 30,
      outbid: false,
    },
    {
      id: 3,
      itemName: 'Hoodie',
      itemImage: '/assets/hoodie.png',
      currentBid: 800,
      highestBid: 900,
      endTime: Date.now() + 1000 * 60 * 10,
      outbid: true,
    },
  ]);

  // Refresh timer
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle bid increase
  const handleIncreaseBid = (id, newBid) => {
    setBids((bids) =>
      bids.map((bid) =>
        bid.id === id && newBid > bid.highestBid
          ? {
              ...bid,
              currentBid: newBid,
              highestBid: newBid,
              outbid: false,
            }
          : bid
      )
    );
  };

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
            const timeLeft = bid.endTime - now;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            return (
              <div key={bid.id} className="my-bid-card">
                <div className="my-bid-img-wrap">
                  <img src={bid.itemImage} alt={bid.itemName} className="my-bid-img" />
                </div>
                <div className="my-bid-info">
                  <h4>{bid.itemName}</h4>
                  <p>Your current bid: <b>₹{bid.currentBid}</b></p>
                  <p>Highest bid placed: <b>₹{bid.highestBid}</b></p>
                  {timeLeft > 0 ? (
                    <p>
                      Auction ends in:{' '}
                      <span style={{ color: timeLeft < 60000 ? 'red' : '#f57c00' }}>
                        {hours}h {minutes}m {seconds}s
                      </span>
                    </p>
                  ) : (
                    <p>
                      <span style={{ color: 'red', fontWeight: 'bold' }}>Auction ended</span>
                    </p>
                  )}
                  {bid.outbid && (
                    <div className="outbid-notification">⚠️ You have been outbid!</div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const newBid = Number(e.target.elements.newBid.value);
                      if (newBid > bid.highestBid) {
                        handleIncreaseBid(bid.id, newBid);
                        e.target.reset();
                      }
                    }}
                    className="increase-bid-form"
                  >
                    <input
                      type="number"
                      name="newBid"
                      min={bid.highestBid + 1}
                      placeholder={`Bid more than ₹${bid.highestBid}`}
                      required
                    />
                    <button type="submit">Increase Bid</button>
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