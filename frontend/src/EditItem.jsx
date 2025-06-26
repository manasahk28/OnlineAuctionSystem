import React, { useEffect, useState } from 'react';
import './EditItem.css';

const EditItem = ({ itemId, setActiveSection }) => {
  const [formData, setFormData] = useState({
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
    warranty_duration: '',
    damage_description: '',
    limitedCollection: false
  });

  const [initialFormData, setInitialFormData] = useState({});

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/items/${itemId}`);
        const data = await res.json();
        if (data.status === 'success') {
          const imageList = Array.isArray(data.item.images) ? data.item.images : [];
          const fullItem = { ...data.item, images: imageList };
          setFormData(fullItem);
          setInitialFormData(fullItem);
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      }
    };

    if (itemId) fetchItem();
  }, [itemId]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      if (name === 'images') {
        const selectedFiles = Array.from(files);
        setFormData(prev => ({ ...prev, images: [...prev.images, ...selectedFiles].slice(0, 3) }));
      } else {
        setFormData(prev => ({ ...prev, [name]: files[0] }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleClear = () => {
    setFormData(initialFormData);
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // 🛑 Require at least 1 image
  if (!formData.images || formData.images.length === 0) {
    alert('📸 Please upload at least one image before saving!');
    return;
  }

  // 🔍 Check for changes
  const isEqual = (a, b) => {
    for (const key in a) {
      if (key === 'images') {
        if (a.images.length !== b.images.length) return false;
        // You can go deeper here if needed, comparing filenames or base64s
        continue;
      }
      if (a[key] !== b[key]) return false;
    }
    return true;
  };

  if (isEqual(formData, initialFormData)) {
    alert('⚠️ No changes detected! Please make some updates before saving.');
    return;
  }

  const form = new FormData();
  for (const key in formData) {
    if (key === 'images') {
      formData.images.forEach(img => form.append('images', img));
    } else {
      form.append(key, formData[key]);
    }
  }

  try {
    const res = await fetch(`http://localhost:5000/api/items/${itemId}`, {
      method: 'PUT',
      body: form
    });
    const result = await res.json();
    if (result.status === 'success') {
      alert('✅ Item updated successfully!');
      setActiveSection('My Listings');
    } else {
      alert('❌ Update failed. Please try again.');
    }
  } catch (error) {
    console.error("Error updating item:", error);
    alert("❌ Something went wrong while saving.");
  }
};



  return (
    <div className="edit-item-wrapper">
      <div className="edit-item-header">
        <h2>📝 Edit Item Details</h2>
        <button className="back-btn" onClick={() => setActiveSection('My Listings')}>⬅️ Back</button>
      </div>
      <form className="edit-item-form" onSubmit={handleSubmit} encType="multipart/form-data">

        {[{ label: 'Title', name: 'title' },
          { label: 'Description', name: 'description', type: 'textarea' },
          { label: 'Tags', name: 'tags' },
          { label: 'Starting Price', name: 'starting_price', type: 'number' },
          { label: 'Minimum Increment', name: 'minimum_increment', type: 'number' },
          { label: 'Buy Now Price', name: 'buy_now_price', type: 'number' },
          { label: 'Start Date Time', name: 'start_date_time', type: 'datetime-local' },
          { label: 'End Date Time', name: 'end_date_time', type: 'datetime-local' },
          { label: 'Duration', name: 'duration' },
          { label: 'Contact Email', name: 'contact_email' },
          { label: 'Location', name: 'location' },
          { label: 'Delivery Charge', name: 'delivery_charge', type: 'number' },
          { label: 'Return Policy', name: 'return_policy', type: 'textarea' },
          { label: 'Highlights', name: 'highlights' },
          { label: 'Damage Description', name: 'damage_description', type: 'textarea' },
          { label: 'Report Reason', name: 'report_reason', type: 'textarea' }
        ].map(({ label, name, type }) => (
          <div className="edit-form-row" key={name}>
            <label>{label}:</label>
            {type === 'textarea' ? (
              <textarea name={name} value={formData[name]} onChange={handleChange} />
            ) : (
              <input name={name} type={type || 'text'} value={formData[name]} onChange={handleChange} />
            )}
          </div>
        ))}

        <div className="edit-form-row">
          <label>Category:</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="">Select Category</option>
            <option value="Books">Books</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Furniture">Furniture</option>
            <option value="Stationery">Stationery</option>
            <option value="Misc">Misc</option>
          </select>
        </div>

        <div className="edit-form-row">
          <label>Pickup Method:</label>
          <select name="pickup_method" value={formData.pickup_method} onChange={handleChange}>
            <option value="">Select</option>
            <option value="Self Pickup">Self Pickup</option>
            <option value="Courier">Courier</option>
          </select>
        </div>

        <div className="edit-form-row">
          <label>Item Condition:</label>
          <select name="item_condition" value={formData.item_condition} onChange={handleChange}>
            <option value="">Select Condition</option>
            <option value="Brand New">Brand New</option>
            <option value="Like New">Like New</option>
            <option value="Used">Used</option>
            <option value="For Parts">For Parts</option>
          </select>
        </div>

        <div className="edit-form-row">
          <label>Warranty:</label>
          <select name="warranty" value={formData.warranty} onChange={handleChange}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {formData.warranty === 'Yes' && (
          <div className="edit-form-row">
            <label>Warranty Duration:</label>
            <input name="warranty_duration" value={formData.warranty_duration} onChange={handleChange} />
          </div>
        )}

                <div className="edit-form-row">
          <label>Upload Images:</label>
          <input name="images" type="file" multiple accept="image/png, image/jpeg" onChange={handleChange} />
        </div>

        <div className="edit-form-row">
          <label>Uploaded Images:</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {formData.images.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img
                  src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                  alt="preview"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(i)}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: 'red',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </div>


        <div className="edit-form-row">
          <label>Upload Video:</label>
          <input type="file" name="video" accept="video/mp4,video/x-m4v,video/*" onChange={handleChange} />
        </div>

        <div className="checkbox-row">
          <label>Limited Collection:</label>
          <input
            type="checkbox"
            name="limitedCollection"
            checked={formData.limitedCollection}
            onChange={handleChange}
          />
        </div>

        <div className="edit-form-actions">
          <button type="submit" className="save-btn">💾 Save</button>
          <button type="button" className="cancel-btn" onClick={handleClear}>Clear</button>
        </div>
      </form>
    </div>
  );
};

export default EditItem;