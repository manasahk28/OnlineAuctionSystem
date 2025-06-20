import React, { useState, useEffect } from 'react';
import './PostItem.css';

const PostItem = () => {
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
    const files = Array.from(e.target.files).slice(0, 3); // limit to 3
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
    } catch (err) {
      alert('Failed to post item');
      console.error(err);
    }
  };

  return (
    <div className="post-item-container">
      <h2>📦 Post a New Auction Item</h2>
      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input type="text" name="title" value={itemData.title} onChange={handleChange} required />

        <label>Description:</label>
        <textarea name="description" value={itemData.description} onChange={handleChange} required />

        <label>Category:</label>
        <select name="category" value={itemData.category} onChange={handleChange} required>
          <option value="">--Select--</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="books">Books</option>
          <option value="home">Home</option>
        </select>

        <label>Starting Price (₹):</label>
        <input type="number" name="startingPrice" value={itemData.startingPrice} onChange={handleChange} required />

        <label>Condition:</label>
        <select name="condition" value={itemData.condition} onChange={handleChange} required>
          <option value="">--Select--</option>
          <option value="new">Brand New</option>
          <option value="like new">Like New</option>
          <option value="used">Used</option>
          <option value="for parts">For Parts</option>
        </select>

        <label>Auction End Date & Time:</label>
        <input type="datetime-local" name="auctionEnd" value={itemData.auctionEnd} onChange={handleChange} required />

        <label>Item Images (Max 3):</label>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} />

        {itemData.images.length > 0 && (
          <div className="preview-images">
            {itemData.images.map((img, index) => (
              <img key={index} src={img} alt={`preview-${index}`} width={100} style={{ marginRight: 10 }} />
            ))}
          </div>
        )}

        <button type="submit">Post Item 🛒</button>
      </form>
    </div>
  );
};

export default PostItem;
