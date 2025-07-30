import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ReviewedList.css';

const ReviewedList = () => {
  const { type } = useParams(); // 'approved' or 'rejected'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const backend = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchReviewed = async () => {
      try {
        const res = await fetch(`${backend}/api/items`);
        const data = await res.json();

        const filtered = data.items.filter(
          item => (item.status || '').toLowerCase() === type.toLowerCase()
        );
        setItems(filtered);
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewed();
  }, [type]);

  return (
    <div className="admin-dashboard">
      {/* Navbar */}
      <div className="admin-navbar">
        <div className="admin-navbar-left">
          <h2>Online Auction</h2>
        </div>
        <div className="admin-navbar-centre">
          Admin Panel
        </div>
        <div className="admin-navbar-right">
          <div className="dropdown">
            <button className="dropdown-button">Reviewed Items ▾</button>
            <div className="dropdown-content">
              <div onClick={() => navigate('/reviewed/approved')}>✅ Accepted</div>
              <div onClick={() => navigate('/reviewed/rejected')}>❌ Rejected</div>
            </div>
          </div>
          <button
            className="logout-button"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Reviewed Content */}
      <div className="reviewed-container">
        <div className="reviewed-header">
          <h2>{type === 'approved' ? '✅ Accepted Items' : '❌ Rejected Items'}</h2>
          <button className="back-button" onClick={() => navigate('/AdminDashboard')}>
            ← Back
          </button>
        </div>

        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : items.length === 0 ? (
          <p className="empty-msg">No {type} items found.</p>
        ) : (
          <div className="reviewed-grid">
            {items.map((item) => (
              <div className="reviewed-card" key={item._id}>
                <div className="reviewed-image-container">
                  <img
                    src={item.thumbnail || 'https://via.placeholder.com/150'}
                    alt={item.title}
                  />
                </div>
                <div className="reviewed-details">
                  <h3>{item.title}</h3>
                  <p className="price">₹{item.starting_price}</p>
                  <p className="status">
                    Status: <span className={item.status === 'approved' ? 'approved' : 'rejected'}>
                      {item.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewedList;