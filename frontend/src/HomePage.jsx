// mport React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import PreviewListings from './PreviewListings'; // adjust path if needed
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="navbar">
        <h2>Online Auction</h2>
        <div className="nav-buttons">
          <button className="btn" onClick={() => navigate('/register')}>Register</button>
          <button className="btn" onClick={() => navigate('/login')}>Login</button>
        </div>
      </nav>

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

        <div className="steps-wrapper">

            {/* Step 1 */}
             <div className="step-container">
                <div className="step-content">
                <h3>Step 1: Post Your Item</h3>
                <p>📸 Click a pic. Add details. Set a starting price.<br />
                    Whether it's books, headphones, or hoodies — if you don't need it, someone else might!</p>
                <p className="note">→ It's free to list, and takes less than a minute.</p>
                </div>
                                <img src="/images/step1.png" alt="Step 1" className="step-img" />

            </div>  
        

            {/* Step 2 */}
            <div className="step-container reverse">
                <img src="/images/step2.png" alt="Let the bidding begin" className="step-img2" />
                <div className="step-content">
                    <h3 className="step-heading orange-light">Step 2: Let the Bidding Begin</h3>
                    <p> 🛎️ Watch your item get attention!<br />
                    Others on campus can place bids before the timer ends. The highest bidder wins!
                    </p>
                    <p className="note">→ You'll get real-time notifications and updates.</p>
                    </div>
            </div>

            {/* Step 3 */}
            <div className="step-container">

          <div className="step-content">
            <h3 className="step-heading orange">Step 3: Meet & Exchange</h3>
            <p>
              🤝 Once the auction ends, the winner pays online (fake payment in demo)<br />
              Then, just meet up on campus and swap the item.
            </p>
            <p className="note">→ Simple, secure, and student-only.</p>
          </div>
            <img src="/images/step3.png" alt="Meet and exchange" className="step-img" />

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

        {/* Footer */}
        <footer className="footer">
        <div className="footer-content">
            <h3>Online Auction</h3>
            <p>© 2025 Campus Auction System · All rights reserved</p>
            <div className="footer-links">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/help">Help</a>
            </div>
        </div>
        <div className="social-icons">
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={faLinkedin} />
            </a>
            <a href="https://www.twitter.com" target="_blank" rel="noreferrer">
                <FontAwesomeIcon icon={faTwitter} />
            </a>
        </div>

        </footer>

      </div>
  );
};

export default HomePage;
