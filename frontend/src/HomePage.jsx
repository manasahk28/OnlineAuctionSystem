import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import PreviewListings from './PreviewListings'; // adjust path if needed
import Layout from './Layout';

const HomePage = () => {
  const navigate = useNavigate();
  // const user = JSON.parse(localStorage.getItem('user')); // assuming you stored user after login
  const [isSessionLoggedIn, setIsSessionLoggedIn] = useState(false);


   useEffect(() => {
    const sessionStatus = sessionStorage.getItem('loggedIn');
    if (sessionStatus === 'true') {
      setIsSessionLoggedIn(true);
    }
  }, []);
 

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
        <section className="how-section" id="how-it-works">
        <h2 className="how-title">How it works?</h2>

        <div className="steps-horizontal">
  {/* Step 1 */}
  <div className="how-step">
    <h3 className="step-title orange">Step 1: Post Your Item</h3>
    <img src="/images/step1.png" alt="Post Item" className="how-img" />
    <p>📸 Click a pic. Add details. Set a starting price.</p>
    <p className="note">→ It's free to list, and takes less than a minute.</p>
  </div>

  {/* Step 2 */}
  <div className="how-step">
    <h3 className="step-title orange">Step 2: Let the Bidding Begin</h3>
    <img src="/images/step2.png" alt="Bidding" className="how-img" />
    <p>🛎️ Watch your item get attention!</p>
    <p className="note">→ You'll get real-time notifications and updates.</p>
  </div>

  {/* Step 3 */}
  <div className="how-step">
    <h3 className="step-title orange">Step 3: Meet & Exchange</h3>
    <img src="/images/step3.png" alt="Exchange" className="how-img" />
    <p>🤝 Once the auction ends, the winner pays online</p>
    <p className="note">→ Simple, secure, and student-only.</p>
  </div>
</div>

        </section>


<hr className="section-divider" />

        {/* Preview Listings */}
        <div className='preview-container'>
        <section className="preview-section">
        <h2 className="preview">Featured Listings</h2>
        <PreviewListings />
      </section>
      </div>

      </div>
      </Layout>
  );
};

export default HomePage;
