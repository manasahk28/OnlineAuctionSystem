import React, { useState, useEffect } from 'react';
import './PostItem.css';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaUpload, FaRupeeSign, FaCalendarAlt } from 'react-icons/fa';

const PostItem = () => {
  const navigate = useNavigate();
  const [itemData, setItemData] = useState({
    title: '',
    description: '',
    category: '',
    startingPrice: '',
    condition: '',
    auctionEnd: '',
    images: [],
    userEmail: '',
    userName: ''
  });

  const [activeField, setActiveField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setItemData(prev => ({
        ...prev,
        userEmail: user.email,
        userName: user.UserName || ''
      }));
    }
  }, []);

  const handleChange = (e) => {
    setItemData({ ...itemData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    const readers = [];
    let imagesLoaded = 0;

    files.forEach((file) => {
      if (file.size > 300 * 1024) {
        alert(`${file.name} is too large. Upload under 300KB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        readers.push(reader.result);
        imagesLoaded++;
        if (imagesLoaded === files.length) {
          setItemData((prev) => ({ ...prev, images: readers }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (itemData.images.length === 0) {
      alert('Please upload at least one image.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/post-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      const result = await response.json();
      alert(result.message || 'Item posted successfully!');

      setItemData({
        title: '',
        description: '',
        category: '',
        startingPrice: '',
        condition: '',
        auctionEnd: '',
        images: [],
        userEmail: itemData.userEmail,
        userName: itemData.userName
      });
      
      navigate('/my-listings');
    } catch (err) {
      alert('Failed to post item');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorByIndex = (index) => {
    const colors = ['#FCEF91', '#FB9E3A', '#E6521F'];
    return colors[index % colors.length];
  };

  return (
    <div className="post-item-container">
      <div className="post-item-header">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <h2>
          <span className="icon-emoji">📦</span>
          <span>Post New Auction Item</span>
          <span className="icon-emoji">💰</span>
        </h2>
        <p className="subtitle">Fill in the details to start your auction</p>
        <div className="header-underline"></div>
      </div>
      
      <form onSubmit={handleSubmit} className="post-item-form">
        <div className="form-section" style={{ borderLeft: '4px solid #FCEF91' }}>
          <h3 className="section-title">
            <span className="section-icon">ℹ️</span>
            Item Information
          </h3>
          
          <div className="form-group" onFocus={() => setActiveField('title')} onBlur={() => setActiveField(null)}>
            <label className={activeField === 'title' ? 'active' : ''}>Title</label>
            <input 
              type="text" 
              name="title" 
              value={itemData.title} 
              onChange={handleChange} 
              required 
              className={activeField === 'title' ? 'active' : ''}
              placeholder="Enter item title"
            />
            <div className="input-decoration"></div>
          </div>

          <div className="form-group" onFocus={() => setActiveField('description')} onBlur={() => setActiveField(null)}>
            <label className={activeField === 'description' ? 'active' : ''}>Description</label>
            <textarea 
              name="description" 
              value={itemData.description} 
              onChange={handleChange} 
              required 
              className={activeField === 'description' ? 'active' : ''}
              placeholder="Describe your item in detail"
            />
            <div className="input-decoration"></div>
          </div>
        </div>

        <div className="form-section" style={{ borderLeft: '4px solid #FB9E3A' }}>
          <h3 className="section-title">
            <span className="section-icon">📊</span>
            Auction Details
          </h3>
          
          <div className="form-row">
            <div className="form-group" onFocus={() => setActiveField('category')} onBlur={() => setActiveField(null)}>
              <label className={activeField === 'category' ? 'active' : ''}>Category</label>
              <div className="select-wrapper">
                <select 
                  name="category" 
                  value={itemData.category} 
                  onChange={handleChange} 
                  required
                  className={activeField === 'category' ? 'active' : ''}
                >
                  <option value="">--Select Category--</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion</option>
                  <option value="books">Books</option>
                  <option value="home">Home</option>
                </select>
              </div>
              <div className="input-decoration"></div>
            </div>

            <div className="form-group" onFocus={() => setActiveField('condition')} onBlur={() => setActiveField(null)}>
              <label className={activeField === 'condition' ? 'active' : ''}>Condition</label>
              <div className="select-wrapper">
                <select 
                  name="condition" 
                  value={itemData.condition} 
                  onChange={handleChange} 
                  required
                  className={activeField === 'condition' ? 'active' : ''}
                >
                  <option value="">--Select Condition--</option>
                  <option value="new">Brand New</option>
                  <option value="like new">Like New</option>
                  <option value="used">Used</option>
                  <option value="for parts">For Parts</option>
                </select>
              </div>
              <div className="input-decoration"></div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" onFocus={() => setActiveField('startingPrice')} onBlur={() => setActiveField(null)}>
              <label className={activeField === 'startingPrice' ? 'active' : ''}>
                <FaRupeeSign className="input-icon" />
                Starting Price
              </label>
              <input 
                type="number" 
                name="startingPrice" 
                value={itemData.startingPrice} 
                onChange={handleChange} 
                required 
                className={activeField === 'startingPrice' ? 'active' : ''}
                placeholder="Enter starting bid amount"
              />
              <div className="input-decoration"></div>
            </div>

            <div className="form-group" onFocus={() => setActiveField('auctionEnd')} onBlur={() => setActiveField(null)}>
              <label className={activeField === 'auctionEnd' ? 'active' : ''}>
                <FaCalendarAlt className="input-icon" />
                Auction End
              </label>
              <input 
                type="datetime-local" 
                name="auctionEnd" 
                value={itemData.auctionEnd} 
                onChange={handleChange} 
                required 
                className={activeField === 'auctionEnd' ? 'active' : ''}
              />
              <div className="input-decoration"></div>
            </div>
          </div>
        </div>

        <div className="form-section" style={{ borderLeft: '4px solid #E6521F' }}>
          <h3 className="section-title">
            <span className="section-icon">📷</span>
            Item Images
          </h3>
          
          <div className="form-group">
            <div className="file-upload-container">
              <label className="file-upload-label">
                <FaUpload className="upload-icon" />
                <span>Choose Images (Max 3)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
              <div className="file-upload-text">
                {itemData.images.length > 0 
                  ? `${itemData.images.length} image(s) selected` 
                  : 'No images selected yet'}
              </div>
            </div>
            
            {itemData.images.length > 0 && (
              <div className="preview-images">
                {itemData.images.map((img, index) => (
                  <div 
                    key={index} 
                    className="image-preview"
                    style={{ borderColor: getColorByIndex(index) }}
                  >
                    <img src={img} alt={`preview-${index}`} />
                    <button 
                      type="button" 
                      className="remove-image"
                      style={{ backgroundColor: getColorByIndex(index) }}
                      onClick={() => {
                        const newImages = [...itemData.images];
                        newImages.splice(index, 1);
                        setItemData({...itemData, images: newImages});
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-button" 
          disabled={isSubmitting}
          style={{ backgroundColor: '#FB9E3A' }}
        >
          {isSubmitting ? (
            <span className="button-loading">Posting...</span>
          ) : (
            <>
              <span className="button-text">Post Item Now</span>
              <span className="button-icon">🚀</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PostItem;
