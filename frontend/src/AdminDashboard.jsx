import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [commentText, setCommentText] = useState('');
  const navigate = useNavigate();

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/items');
      const pendingItems = res.data.items.filter(item => !item.is_approved);
      setItems(pendingItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/items/approve/${id}`, null, {
        params: {
          is_approved: status === 'Approved',
          status: status
        }
      });
      setItems(prev => prev.filter(item => item._id !== id));
      alert(`Item ${status.toLowerCase()} successfully.`);
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update item.');
    }
  };

  const handleSendComment = async () => {
    try {
      await axios.post('http://localhost:5000/api/admin/comment', {
        itemId: selectedItem._id,
        sellerId: selectedItem.contact_email,
        comment: commentText
      });
      alert('Comment sent to seller.');
      setShowCommentBox(false);
    } catch (err) {
      console.error(err);
      alert('Failed to send comment.');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="admin-dashboard">
      {/* Navbar */}
      <div className="admin-navbar">
        <div className="admin-navbar-left">
          <h2>Online Auction</h2>
        </div>
        <div className="admin-navbar-centre">Admin Panel</div>
        <div className="admin-navbar-right">
          <div className="dropdown">
            <button className="dropdown-button">Reviewed Items ▾</button>
            <div className="dropdown-content">
              <div onClick={() => navigate('/reviewed/approved')}>✅ Accepted</div>
              <div onClick={() => navigate('/reviewed/rejected')}>❌ Rejected</div>
            </div>
          </div>
          <button
            className="logt-button"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Item List */}
      <div className="item-list">
        {loading ? (
          <div className="loader-wrapper"><div className="loading-spinner"></div></div>
        ) : items.length === 0 ? (
          <p className="empty-msg">No pending items to review.</p>
        ) : (
          items.map((item) => (
            <div className="custom-item-card" key={item._id}>
              <div className="custom-left">
                <img
                  src={item.thumbnail || 'https://via.placeholder.com/150'}
                  alt={item.title}
                />
              </div>

              <div className="custom-middle">
                <div className="custom-title">{item.title}</div>
                <div className="custom-price">
                  ₹{item.starting_price}
                  <span
                    className="custom-details-link"
                    onClick={() => navigate(`/item/${item._id}`)}
                  >
                    [View for details]
                  </span>
                </div>
              </div>

              <div className="middle-right">
                <button className="approve" onClick={() => handleApproval(item._id, 'Approved')}>
                  Approve
                </button>
                <button className="reject" onClick={() => handleApproval(item._id, 'Rejected')}>
                  Reject
                </button>
              </div>

              <div className="custom-right">
                <button
                  className="comment-button"
                  onClick={() => {
                    setSelectedItem(item);
                    setShowCommentBox(true);
                    setCommentText('');
                  }}
                >
                  Comment
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Popup */}
      {showCommentBox && selectedItem && (
        <div className="comment-popup-overlay">
          <div className="comment-popup">
            <div className="popup-content">
              <h3>Send Comment to Seller</h3>
              <p><strong>Seller Email:</strong> {selectedItem.seller_id}</p>
              <textarea
                placeholder="Write your comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />

              <div className="popup-actions">
                <button onClick={handleSendComment}>Send</button>
                <button onClick={() => setShowCommentBox(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
