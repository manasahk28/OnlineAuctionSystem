// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FaInfoCircle, FaEnvelopeOpenText, FaQuestionCircle, FaArrowLeft } from 'react-icons/fa';

import './Layout.css'; // Assuming you have a CSS file for styles
import './Layout.css'; // Assuming you have a CSS file for styles

const Layout = ({ children, hideFooter }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showFarewell, setShowFarewell] = useState(false);
  const [fadePopup, setFadePopup] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    if (storedUser && isLoggedIn) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('loggedIn');
    setShowFarewell(true);

    setTimeout(() => {
      setFadePopup(true);
    }, 4000);

    setTimeout(() => {
      setShowLogoutPopup(false);
      setShowFarewell(false);
      setFadePopup(false);
      navigate('/');
      window.location.reload();
    }, 2000);
  };

  const cancelLogout = () => {
    setShowLogoutPopup(false);
    setShowFarewell(false);
    setFadePopup(false);
  };

  return (
    <>
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <h2>Online Auction</h2>
        </div>
        <div className="navbar-right">
          
          
          {user ? (
            <>
              <a href="/">Home</a>
              <a href="/explore">Explore</a>
              <a href="/post-item">Post Item</a>
              <a href="/dashboard">Profile</a>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={() => navigate('/register')}>Register</button>
              <button className="btn" onClick={() => navigate('/login')}>Login</button>
            </>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="popup-overlay">
          <div className={`popup-box ${fadePopup ? 'fade-out' : ''}`}>
            {!showFarewell ? (
              <>
                <p>Are you sure you want to logout?</p>
                <div className="popup-actions">
                  <button className="btn confirm" onClick={confirmLogout}>Yes</button>
                  <button className="btn cancel" onClick={cancelLogout}>No</button>
                </div>
              </>
            ) : (
              <p className="farewell-text">We'll miss you! Come back soon ❤️</p>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main>{children}</main>

    </>
      {/* Footer (conditionally rendered) */}
      {!hideFooter && (
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
      )}
    </>
  );
};
}
export default Layout;

// About, Contact, and Help pages in one file
export const About = () => {
  const navigate = useNavigate();
  return (
    <Layout hideFooter>
      <div className="about-card">
        <button onClick={() => navigate(-1)} className="backk-btn">
          <FaArrowLeft />
        </button>
        <div className="about-header">
          <FaInfoCircle size={38} color="#ff9800" style={{ marginBottom: 8 }} />
          <h2>About Online Auction System</h2>
        </div>
        <div className="about-content">
          The Online Auction System is a campus marketplace where students can post, bid, and buy items securely.<br /><br />
          <span style={{ color: '#ff9800', fontWeight: 600 }}>Our mission:</span> Make campus trading easy, safe, and fun for everyone.<br /><br />
          List your unused items, find great deals, and connect with your campus community!
        </div>
      </div>
    </Layout>
  );
};

export const Contact = () => {
  const [form, setForm] = React.useState({ name: '', email: '', message: '' });
  const [sent, setSent] = React.useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };
  const navigate = useNavigate();

  return (
    <Layout hideFooter>
      <div className="contact-card">
        <button onClick={() => navigate(-1)} className="backk-btn">
          <FaArrowLeft />
        </button>
        <div className="contact-header">
          <FaEnvelopeOpenText size={38} color="#ff9800" style={{ marginBottom: 8 }} />
          <h2>Contact Us</h2>
          <div className="contact-subtitle">
            We'd love to hear from you! Fill out the form below and we'll get back to you soon.
          </div>
          <div className="contact-divider" />
        </div>
        <form onSubmit={handleSubmit} className="contact-form">
          <input name="name" type="text" placeholder="Your Name" value={form.name} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Your Email" value={form.email} onChange={handleChange} required />
          <textarea name="message" placeholder="Your Message" value={form.message} onChange={handleChange} required rows={5} />
          <button type="submit">Send Message</button>
          {sent && (
            <div className="contact-success">
              ✅ Your message has been sent!
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
};

export const Help = () => {
  const navigate = useNavigate();
  return (
    <Layout hideFooter>
      <div className="help-card">
        <button onClick={() => navigate(-1)} className="backk-btn">
          <FaArrowLeft />
        </button>
        <div className="help-header">
          <FaQuestionCircle size={38} color="#ff9800" style={{ marginBottom: 8 }} />
          <h2>Help & FAQ</h2>
          <div className="help-divider" />
        </div>
        <ul className="help-list">
          <li><b>How do I post an item?</b> — Go to "Post Item" in the menu and fill out the form with your item details.</li>
          <li><b>How do I place a bid?</b> — Click on any item in "Explore" and use the "Bid for Auction" button.</li>
          <li><b>How do I know if I won?</b> — You'll get a notification and can check your "My Bids" and "My Listings" pages.</li>
          <li><b>Who can use this platform?</b> — Only verified campus students can register and participate.</li>
          <li><b>Need more help?</b> — Contact us via the Contact page!</li>
        </ul>
      </div>
    </Layout>
  );
};
