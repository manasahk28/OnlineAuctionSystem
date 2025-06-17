import React, { useState } from 'react';
import './PostItem.css';

const PostItem = () => {
  const [itemData, setItemData] = useState({
    title: '',
    description: '',
    category: '',
    startingPrice: '',
    condition: '',
    auctionEnd: ''
  });

  const handleChange = (e) => {
    setItemData({ ...itemData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting item:', itemData);

    // Send to backend API here
    // fetch('/api/post-item', { method: 'POST', body: JSON.stringify(itemData), ... })
    alert("🎉 Item posted successfully!");
    setItemData({
      title: '',
      description: '',
      category: '',
      startingPrice: '',
      condition: '',
      auctionEnd: ''
    });
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

        <button type="submit">Post Item 🛒</button>
      </form>
    </div>
  );
};

export default PostItem;
