import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import PreviewListings from './PreviewListings'; // adjust path if needed
import Layout from './Layout';

const interestingInfo = [
  "Free to list! Use clear photos and details for more bids.",
  "Bidding is live—set a fair price and get instant updates!",
  "Safe, student-only deals. Meet on campus and pay online."
];

const HomePage = () => {
  const navigate = useNavigate();
  // const user = JSON.parse(localStorage.getItem('user')); // assuming you stored user after login
  const [isSessionLoggedIn, setIsSessionLoggedIn] = useState(false);
  const [flipped, setFlipped] = useState([false, false, false]);

  useEffect(() => {
    const sessionStatus = sessionStorage.getItem('loggedIn');
    if (sessionStatus === 'true') {
      setIsSessionLoggedIn(true);
    }
  }, []);

  const handleFlip = idx => {
    setFlipped(f => f.map((val, i) => (i === idx ? !val : val)));
  };

  return (
    <Layout>
      <div className="homepage">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-container">
            <div className="hero-left">
              <h1 className="slogan"><span className="highlight">Buy</span> · <span className="highlight">Bid</span> · <span className="highlight">Belong</span></h1>
              <h3 className="subheading">Your Campus Marketplace</h3>
            </div>
            <div className="hero-right">
              <img src="/assets/auction-banner.jpg" alt="Auction" className="hero-image" />
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="how-section" id="how-it-works" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', marginTop: '-1.5rem', width: '100%' }}>
            <h2 className="how-title how-animate" style={{ textAlign: 'center', margin: 0, fontSize: '2.7rem', fontWeight: 800, letterSpacing: '2px', width: '100%' }}>How it works?</h2>
          </div>
          <div className="steps-horizontal">
            {/* Step 1 */}
            <div className={`how-step how-step-animate flip-card${flipped[0] ? ' flipped' : ''}`} onClick={() => handleFlip(0)}>
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <h3 className="step-title orange">Step 1: Post Your Item</h3>
                  <img src="/images/step1.png" alt="Post Item" className="how-img" />
                  <p>📸 Click a pic. Add details. Set a starting price.</p>
                  <p className="note">→Click on card to Know more.</p>
                </div>
                <div className="flip-card-back">
                  <h3>Did you know?</h3>
                  <p>{interestingInfo[0]}</p>
                  <p className="note">→ It's free to list, and takes less than a minute.</p>
                </div>
              </div>
            </div>
            {/* Step 2 */}
            <div className={`how-step how-step-animate flip-card${flipped[1] ? ' flipped' : ''}`} onClick={() => handleFlip(1)}>
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <h3 className="step-title orange">Step 2: Let the Bidding Begin</h3>
                  <img src="/images/step2.png" alt="Bidding" className="how-img" />
                  <p>🛎️ Watch your item get attention!</p>
                  <p className="note">→Click on card to Know more.</p>
                </div>
                <div className="flip-card-back">
                  <h3>Fun Fact!</h3>
                  <p>{interestingInfo[1]}</p>
                  <p className="note">→ You'll get real-time notifications and updates.</p>
                </div>
              </div>
            </div>
            {/* Step 3 */}
            <div className={`how-step how-step-animate flip-card${flipped[2] ? ' flipped' : ''}`} onClick={() => handleFlip(2)}>
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <h3 className="step-title orange">Step 3: Meet & Exchange</h3>
                  <img src="/images/step3.png" alt="Exchange" className="how-img" />
                  <p>🤝 Once the auction ends, the winner pays online</p>
                  <p className="note">→Click on card to Know more.</p>               
                </div>
                <div className="flip-card-back">
                  <h3>Why choose us?</h3>
                  <p>{interestingInfo[2]}</p>
                  <p className="note">→ Simple, secure, and student-only.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Preview Listings */}
        <section className="preview-section">
          <h2 className="preview">Featured Listings</h2>
          <PreviewListings />
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
