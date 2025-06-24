import React, { useState } from 'react';
import './PostItem.css';
import Layout from './Layout';

const PostItems = () => {
  const [itemData, setItemData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    images: [],
    video: null,
    starting_price: '',
    minimum_increment: '',
    buy_now_price: '',
    start_date_time: '',
    end_date_time: '',
    duration: '',
    seller_id: '',
    contact_email: '',
    location: '',
    pickup_method: '',
    delivery_charge: '',
    return_policy: '',
    is_approved: false,
    status: 'Draft',
    terms_accepted: false,
    report_reason: '',
    highlights: '',
    item_condition: '',
    warranty: '',
    limitedCollection: false
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      setItemData({ ...itemData, [name]: checked });
    } else if (type === 'file') {
      if (name === 'images') {
        const selectedFiles = Array.from(files).slice(0, 3);
        const readers = [];

        selectedFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            readers.push(reader.result);
            if (readers.length === selectedFiles.length) {
              setItemData((prev) => ({ ...prev, images: readers }));
              setImagePreviews(readers);
            }
          };
          reader.readAsDataURL(file);
        });
      } else if (name === 'video') {
        const videoFile = files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          setItemData({ ...itemData, video: reader.result });
          setVideoPreview(reader.result);
        };
        reader.readAsDataURL(videoFile);
      }
    } else {
      setItemData({ ...itemData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (itemData.images.length === 0) {
      alert('Please upload at least one image.');
      return;
    }

    if (!itemData.terms_accepted) {
      alert('You must accept the terms and conditions.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/post-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      const result = await response.json();
      alert(result.message || 'Item posted successfully!');
    } catch (err) {
      alert('Failed to post item');
      console.error(err);
    }
  };

  const renderInput = (label, name, type = 'text', placeholder = '', isTextarea = false) => (
    <div className="input-row">
      <label htmlFor={name}>{label}</label>
      {isTextarea ? (
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          value={itemData[name]}
          onChange={handleChange}
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          placeholder={placeholder}
          value={itemData[name]}
          onChange={handleChange}
        />
      )}
    </div>
  );

  return (
    <Layout>
      <div className="post-items-form">
        <h2>🎁 Post an Auction Item</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>🖼️ Item Basics</h3>
            {renderInput('Title', 'title')}
            {renderInput('Description', 'description', 'text', 'Description', true)}
            {renderInput('Category', 'category')}
            {renderInput('Tags', 'tags', 'text', 'Tags (comma separated)')}
            <div className="input-group">
              <label>
                <input
                  type="checkbox"
                  name="limitedCollection"
                  checked={itemData.limitedCollection}
                  onChange={handleChange}
                /> Limited Collection Item
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>📸 Item Media</h3>
            <div className="input-group">
              <label>Images (max 3)</label>
              <input type="file" name="images" multiple accept="image/*" onChange={handleChange} />
            </div>
            {imagePreviews.length > 0 && (
              <div className="media-preview">
                <h4>Image Preview:</h4>
                <div className="preview-grid">
                  {imagePreviews.map((img, index) => (
                    <img key={index} src={img} alt={`preview-${index}`} className="preview-image" />
                  ))}
                </div>
              </div>
            )}
            <div className="input-group">
              <label>Video File (optional)</label>
              <input type="file" name="video" accept="video/*" onChange={handleChange} />
            </div>
            {videoPreview && (
              <div className="media-preview">
                <h4>Video Preview:</h4>
                <video src={videoPreview} controls className="preview-video" />
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>💰 Bidding Details</h3>
            {renderInput('Starting Price', 'starting_price')}
            {renderInput('Minimum Increment', 'minimum_increment')}
            {renderInput('Buy Now Price', 'buy_now_price')}
          </div>

          <div className="form-section">
            <h3>🕒 Auction Timing</h3>
            {renderInput('Start Date & Time', 'start_date_time', 'datetime-local')}
            {renderInput('End Date & Time', 'end_date_time', 'datetime-local')}
            {renderInput('Duration', 'duration')}
          </div>

          <div className="form-section">
            <h3>👤 Seller Info</h3>
            {renderInput('Seller ID', 'seller_id')}
            {renderInput('Contact Email', 'contact_email')}
            {renderInput('Location', 'location')}
          </div>

          <div className="form-section">
            <h3>🚚 Shipping & Pickup</h3>
            {renderInput('Pickup Method', 'pickup_method')}
            {renderInput('Delivery Charge', 'delivery_charge')}
            {renderInput('Return Policy', 'return_policy')}
          </div>

          <div className="form-section">
            <h3>⚠️ Approval & Status</h3>
            <div className="input-group">
              <label>Status</label>
              <select name="status" value={itemData.status} onChange={handleChange}>
                <option>Draft</option>
                <option>Pending</option>
                <option>Live</option>
                <option>Ended</option>
                <option>Sold</option>
              </select>
            </div>
            <div className="input-group">
              <label>
                <input type="checkbox" name="is_approved" checked={itemData.is_approved} onChange={handleChange} /> Approved
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>🔒 Rules</h3>
            <div className="input-group">
              <label>
                <input type="checkbox" name="terms_accepted" checked={itemData.terms_accepted} onChange={handleChange} /> I accept the terms & conditions
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>🌟 Bonus</h3>
            {renderInput('Auction Highlights', 'highlights')}
            {renderInput('Item Condition', 'item_condition')}
            {renderInput('Warranty', 'warranty')}
          </div>

          <button type="submit">Post Item</button>
        </form>
      </div>
    </Layout>
  );
};

export default PostItems;
