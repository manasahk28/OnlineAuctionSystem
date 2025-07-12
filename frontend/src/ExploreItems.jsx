import { useState, useEffect } from 'react';
import './ExploreItems.css';
import Layout from './Layout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExploreItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => {
    const cached = localStorage.getItem('explore_items_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('');

  const [filters, setFilters] = useState({
    category: [],
    priceRange: [],
    pickupMethod: [],
    item_condition: [],
    timeFilter: '', // New time filter
  });
  const [pendingFilters, setPendingFilters] = useState({
    category: [],
    priceRange: [],
    pickupMethod: [],
    item_condition: [],
    timeFilter: '', // New time filter
  });
  const [pendingSortOrder, setPendingSortOrder] = useState('');

  const categoryOptions = [
    { label: "📚 Books", value: "Books" },
    { label: "🔌 Electronics", value: "Electronics" },
    { label: "👕 Clothing", value: "Clothing" },
    { label: "✏️ Stationery", value: "Stationery" },
    { label: "⚗️ Lab Equipment", value: "Lab Equipment" },
    { label: "🏏 Sports Gear", value: "Sports Gear" },
    { label: "🛏️ Hostel Essentials", value: "Hostel Essentials" },
    { label: "🚲 Cycle/Bike Accessories", value: "Cycle/Bike Accessories" },
    { label: "🎨 Art Supplies", value: "Art Supplies" },
    { label: "🧩 Other", value: "Other" },
  ];

  const pickupOptions = [
    { label: "🤝 Pickup from Seller", value: "Pickup from Seller" },
    { label: "🎓 Meet on Campus", value: "Meet on Campus" },
    { label: "🏠 Home Delivery", value: "Home Delivery" },
  ];

  const itemConditionOptions = [
    { label: "🆕 Brand New", value: "Brand New" },
    { label: "✨ Like New", value: "Like New" },
    { label: "👍 Used", value: "Used" },
    { label: "⚠️ For Parts", value: "For Parts" },
  ];

  const timeFilterOptions = [
    { label: "🕐 All Items", value: "" },
    { label: "⏰ Upcoming Items", value: "upcoming" },
    { label: "🔥 Live Items", value: "live" },
    { label: "✅ Recently Ended", value: "ended" },
  ];

  const priceOptions = [
    { label: "💸 Under ₹100", min: 0, max: 100 },
    { label: "🪙 ₹100 – ₹300", min: 100, max: 300 },
    { label: "💰 ₹301 – ₹700", min: 301, max: 700 },
    { label: "💎 Above ₹700", min: 701, max: Infinity },
  ];

  const getColorByIndex = (index) => {
    const colors = ['#FCEF91', '#FB9E3A', '#E6521F', '#EA2F14'];
    return colors[index % colors.length];
  };

  useEffect(() => {
    // When filters or sortOrder change, show loading and clear items
    setLoading(true);
    setItems([]);
    fetchItems();
    setPendingFilters(filters);
    setPendingSortOrder(sortOrder);
  }, [filters, sortOrder]);
  
    const fetchItems = async () => {
      try {
        // Build query parameters
        const params = new URLSearchParams();
        
        if (filters.category.length > 0) {
          filters.category.forEach(cat => params.append('category', cat));
        }
        if (filters.pickupMethod.length > 0) {
          filters.pickupMethod.forEach(method => params.append('pickup_method', method));
        }
        if (filters.item_condition.length > 0) {
          filters.item_condition.forEach(condition => params.append('item_condition', condition));
        }
        if (filters.timeFilter) {
          params.append('time_filter', filters.timeFilter);
        }
        
        const response = await axios.get(`http://localhost:5000/api/items?${params.toString()}`);
        if (response.data.status === 'success') {
          setItems(response.data.items);
          localStorage.setItem('explore_items_cache', JSON.stringify(response.data.items));
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const applyFilters = () => {
      let filtered = [...items];
  
      if (searchTerm.trim()) {
        filtered = filtered.filter(item =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
  
      if (filters.category.length > 0) {
        filtered = filtered.filter(item => filters.category.includes(item.category));
      }
  
      if (filters.priceRange.length > 0) {
        filtered = filtered.filter(item => {
          const price = Number(item.starting_price);
          return filters.priceRange.some(label => {
            const option = priceOptions.find(p => p.label === label);
            return option && price >= option.min && price <= option.max;
          });
        });
      }
  
      if (filters.pickupMethod.length > 0) {
        filtered = filtered.filter(item => filters.pickupMethod.includes(item.pickup_method));
      }
  
      if (filters.item_condition.length > 0) {
        filtered = filtered.filter(item => filters.item_condition.includes(item.item_condition));
      }
  
      if (sortOrder === 'low-to-high') {
        filtered.sort((a, b) => Number(a.starting_price) - Number(b.starting_price));
      } else if (sortOrder === 'high-to-low') {
        filtered.sort((a, b) => Number(b.starting_price) - Number(a.starting_price));
      }
  
      return filtered;
    };
  
    const togglePendingFilter = (type, value) => {
      setPendingFilters((prev) => {
        const updated = prev[type].includes(value)
          ? prev[type].filter((item) => item !== value)
          : [...prev[type], value];
        return { ...prev, [type]: updated };
      });
    };
  
    const clearFilters = () => {
      setPendingFilters({ category: [], priceRange: [], pickupMethod: [], item_condition: [] });
      setPendingSortOrder('');
    };
  
    const applyPendingFilters = () => {
      setFilters(pendingFilters);
      setSortOrder(pendingSortOrder);
      setSidebarOpen(false);
    };
  
    const filteredItems = applyFilters();
  

  return (
      <Layout>
        <div className="explore-container">
          <div className="explore-header">
            <h2 className="explore-heading">🧭 Hunt & Win</h2>
            <div className="header-underline"></div>
          </div>

          {/* Quick Time Filters */}
          <div className="quick-time-filters">
            {timeFilterOptions.map((option) => (
              <button
                key={option.value}
                className={`quick-filter-btn ${filters.timeFilter === option.value ? 'active' : ''}`}
                onClick={() => {
                  setFilters(prev => ({ ...prev, timeFilter: option.value }));
                  setPendingFilters(prev => ({ ...prev, timeFilter: option.value }));
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="top-bar">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button>Search</button>
            </div>
            <button className="filter-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰ Filter
            </button>
          </div>
  
          <div className={`filter-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <h3>Filters</h3>

            <div className="filter-group">
              <h4>⏰ Time Status</h4>
              {timeFilterOptions.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="timeFilter"
                    value={option.value}
                    checked={pendingFilters.timeFilter === option.value}
                    onChange={() => setPendingFilters(prev => ({ ...prev, timeFilter: option.value }))}
                  />
                  {option.label}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h4>Category</h4>
              {categoryOptions.map((cat) => (
                <label key={cat.value}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.category.includes(cat.value)}
                    onChange={() => togglePendingFilter('category', cat.value)}
                  />
                  {cat.label}
                </label>
              ))}
            </div>
  
            <div className="filter-group">
              <h4>Price Range</h4>
              {priceOptions.map((price) => (
                <label key={price.label}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.priceRange.includes(price.label)}
                    onChange={() => togglePendingFilter('priceRange', price.label)}
                  />
                  {price.label}
                </label>
              ))}
            </div>
  
            <div className="filter-group">
              <h4>Pickup Method</h4>
              {pickupOptions.map((method) => (
                <label key={method.value}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.pickupMethod.includes(method.value)}
                    onChange={() => togglePendingFilter('pickupMethod', method.value)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
  
            <div className="filter-group">
              <h4>Item Condition</h4>
              {itemConditionOptions.map((cond) => (
                <label key={cond.value}>
                  <input
                    type="checkbox"
                    checked={pendingFilters.item_condition.includes(cond.value)}
                    onChange={() => togglePendingFilter('item_condition', cond.value)}
                  />
                  {cond.label}
                </label>
              ))}
            </div>
  
            <div className="filter-group">
              <h4>Sort by Price</h4>
              <label>
                <input
                  type="radio"
                  name="sortOrder"
                  value="low-to-high"
                  checked={pendingSortOrder === 'low-to-high'}
                  onChange={() => setPendingSortOrder('low-to-high')}
                />
                Low to High
              </label>
              <label>
                <input
                  type="radio"
                  name="sortOrder"
                  value="high-to-low"
                  checked={pendingSortOrder === 'high-to-low'}
                  onChange={() => setPendingSortOrder('high-to-low')}
                />
                High to Low
              </label>
            </div>
  
            <div className="filter-actions">
              <button onClick={clearFilters} className="clear-btn">Clear</button>
              <button onClick={applyPendingFilters} className="apply-btn">Apply</button>
            </div>
          </div>
  
          <div className={`items-grid ${sidebarOpen ? 'shrink' : ''}`}>
            {loading ? (
              <div className="loader-wrapper"><div className="loading-spinner"></div></div>
           ) : filteredItems.length === 0 ? (
              <p className="no-items">No items found. Try different filters.</p>
            ) : (
              filteredItems.map((item, index) => (
                <div
                  key={item._id}
                  className="item-card"
                  style={{ borderTop: `4px solid ${getColorByIndex(index)}` }}
                >
                  <div className="square-image-container">
                    <img
                      src={item.thumbnail || 'https://via.placeholder.com/150'}
                      alt={item.title}
                      className="item-image"
                    />
                    {item.limitedCollection && (
                      <div className="exclusive-badge" title="Exclusive Item">⭐</div>
                    )}
                     {/* Time status badge */}
                    <div className={`time-status-badge ${item.time_status || 'unknown'}`}>
                      {item.time_status_text || 'Unknown'}
                    </div>
                  </div>
  
                  <div className="item-content">
                    <h3 className="item-title">{item.title}</h3>
                    <p className="item-price" style={{ color: getColorByIndex(index) }}>
                      ₹{item.starting_price}
                    </p>
                    {/* Time information */}
                    <div className="item-time-info">
                      {item.start_date_time && (
                        <p className="time-text">
                          <span className="time-label">Start:</span> {new Date(item.start_date_time).toLocaleDateString()}
                        </p>
                      )}
                      {item.end_date_time && (
                        <p className="time-text">
                          <span className="time-label">End:</span> {new Date(item.end_date_time).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/item/${item._id}`)}
                      style={{
                        backgroundColor: getColorByIndex(index),
                        color: index % 2 === 0 ? '#333' : 'white'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Layout>
    );
  };
  
  export default ExploreItems;
  