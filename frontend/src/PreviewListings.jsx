import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PreviewListings.css';

function getRandomItems(arr, n) {
  if (arr.length <= n) return arr;
  const shuffled = arr.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

const FEATURED_KEY = 'featured_items_ids_v1';

const PreviewListings = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/items');
        if (response.data.status === 'success') {
          const now = new Date();
          const allItems = response.data.items.filter(item => {
            const endDateStr = item.end_date_time || item.auctionEnd;
            if (!endDateStr) return false;
            const end = new Date(endDateStr);
            console.log('Item:', item.title, '| end_date_time:', item.end_date_time, '| auctionEnd:', item.auctionEnd, '| Parsed end:', end, '| Now:', now);
            return end > now;
          });
          const maxCount = 4;

          let featuredIds = JSON.parse(localStorage.getItem(FEATURED_KEY) || 'null');
          let featured = [];

          if (featuredIds?.length) {
            // Rebuild from saved IDs
            featured = featuredIds
              .map(id => allItems.find(item => item._id === id))
              .filter(Boolean);
          }

          // Fill if needed
          const missingCount = maxCount - featured.length;
          if (missingCount > 0) {
            const remaining = allItems.filter(item => !featured.find(f => f._id === item._id));
            const fill = getRandomItems(remaining, missingCount);
            featured = [...featured, ...fill];
          }

          // Finalize list
          featured = getRandomItems(featured, maxCount); // just in case more than 4 snuck in
          localStorage.setItem(FEATURED_KEY, JSON.stringify(featured.map(i => i._id)));
          setItems(featured);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return <div className="preview-grid"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="preview-grid">
      {items.slice(0, 4).map((item, idx) => (
        <div key={item._id} className="listing-card" style={{ '--card-delay': `${0.2 + idx * 0.15}s` }}>
          <img
            src={item.thumbnail || 'https://via.placeholder.com/200'}
            alt={item.title}
            className="listing-img"
          />
          <div className="listing-details">
            <h4>{item.title}</h4>
            <p className="price">Base price: ₹{item.starting_price}</p>
            <button className="view-button" onClick={() => {
              const user = JSON.parse(localStorage.getItem('user'));
              const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
              if (!user || !isLoggedIn) {
                navigate('/register');
              } else {
                navigate(`/item/${item._id}`);
              }
            }}>
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PreviewListings;
