import { useEffect, useState } from 'react';
import './MyListings.css';

const MyListings = ({ setEditingItemId, setActiveSection }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  // 📦 Fetch all items listed by the user
  useEffect(() => {
    const fetchListings = async () => {
      if (!user?.email) {
        console.error("No user email found. Cannot fetch listings.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/items/user/${user.email}`);
        const data = await res.json();

        if (data.status === 'success') {
          const formatted = data.items.map(item => ({
            _id: item._id,
            title: item.title || 'No Title',
            description: item.description || 'No description provided.',
            startingPrice: item.starting_price || 'N/A',
            endTime: item.end_date_time || '',
            imageUrl: item.images?.[0] || null,
            status: item.status || 'Draft',
            /*new line below one*/
            customId: item.custom_item_id || 'Not Assigned'
          }));
          setListings(formatted);
        } else {
          console.error("API error:", data.message);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [user]);

  return (
    <div className="my-listings-wrapper">
      <div className="profile-header">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        🧾 My Listings
      </h2>
    </div>
      {loading ? (
        <p className="loading-text">⏳ Loading your listings...</p>
      ) : listings.length === 0 ? (
        <p className="no-listings-text">😢 You haven't posted anything yet.</p>
      ) : (
        <div className="listings-grid">
          {listings.map(item => (
            <div className="listing-card" key={item._id}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="listing-image" />
              ) : (
                <div className="no-image">No Image</div>
              )}

              <div className="listing-content">
                <h3 className="listing-title">{item.title}</h3>
                {/*new line below one*/}
                <p className="item-id"><strong>ID:</strong> {item.customId}</p>

                <div className="listing-meta">
                  <span className="price-tag">₹{item.startingPrice}</span>
                </div>

                <div className="listing-actions">
                  <button
                    className="view-more-btn"
                    onClick={() => {
                      setEditingItemId(item._id);
                      setActiveSection('Edit Item');
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={async () => {
                      const confirmDelete = window.confirm(`Are you sure you want to delete "${item.title}"?`);
                      if (!confirmDelete) return;

                      try {
                        const res = await fetch(`http://localhost:5000/api/items/${item._id}`, {
                          method: 'DELETE',
                        });
                        const data = await res.json();

                        if (data.status === 'success') {
                          // Remove from state
                          setListings(prev => prev.filter(i => i._id !== item._id));
                          alert('🗑️ Item deleted!');
                        } else {
                          alert('❌ Failed to delete item.');
                        }
                      } catch (err) {
                        console.error('Delete failed:', err);
                        alert('⚠️ Something went wrong.');
                      }
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
