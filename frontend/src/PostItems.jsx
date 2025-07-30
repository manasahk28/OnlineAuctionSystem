import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './PostItem.css';
import { logPostActivity } from './utils/activityLogger';

const PostItems = () => {
  const navigate = useNavigate();
  const [customCategory, setCustomCategory] = useState('');
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // unique key for input refresh
  const [showTerms, setShowTerms] = useState(false);
  const [warranty, setWarranty] = useState('No');
  const [itemCondition, setItemCondition] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const backend = process.env.REACT_APP_BACKEND_URL;

  const [form, setForm] = useState({
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

  const requiredFields = [
    'title',
    'description',
    'category',
    'tags',
    'images',
    'starting_price',
    'minimum_increment',
    'start_date_time',
    'end_date_time',
    'seller_id',
    'contact_email',
    'item_condition',
    'pickup_method',
    'terms_accepted'
  ];


  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === 'warranty') setWarranty(value);
    if (name === 'item_condition') setItemCondition(value);

    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'file' && name === 'images') {
      const selectedFiles = Array.from(files);
      const totalImages = form.images.length + selectedFiles.length;

      if (totalImages > 3) {
        alert(`You can only upload 3 images. You already added ${form.images.length}.`);
        return;
      }

      // Convert images to base64
      selectedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm((prev) => ({
            ...prev,
            images: [...prev.images, reader.result],
          }));
          setImagePreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });

      setFileInputKey(Date.now());
    } else if (type === 'file' && name === 'video') {
      const videoFile = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, video: reader.result }));
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(videoFile);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPosting) return; // Prevent duplicate
    setIsPosting(true);

    const missingFields = requiredFields.filter((field) => {
      const value = form[field];
      if (typeof value === 'boolean') return value !== true;
      if (Array.isArray(value)) return value.length === 0;
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (form.images.length === 0) {
      alert('Please upload at least one image.');
      setIsPosting(false);
      return;
    }

    if (missingFields.length > 0) {
      alert(`🚫 Please fill all required fields:\n${missingFields.join(', ')}`);
      setIsPosting(false);
      return;
    }

    if (!form.terms_accepted) {
      alert('You must accept the terms and conditions.');
      setIsPosting(false);
      return;
    }

    form.warranty = warranty;
    form.item_condition = itemCondition;

    const payload = {
      ...form,
      category: form.category === 'Other' ? 'Other' : form.category, // Always save as 'Other' in DB
      // Optionally, you can send the customCategory as a separate field if backend wants to store/display it
      custom_category: form.category === 'Other' ? customCategory : undefined
    };

    try {
      const response = await fetch(`${backend}/api/post-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.status === 'success') {
        // Log the activity
        await logPostActivity(
          form.title,
          parseFloat(form.starting_price) || 0,
          form.category === 'Other' ? customCategory : form.category
        );

        alert('🎉 Item posted successfully!\n📩 Confirmation email sent to your inbox.');
        navigate('/dashboard');
      } else {
        alert(`❌ Failed to post item: ${result.message}`);
      }
    } catch (err) {
      alert('❌ Failed to post item');
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleEstimatePrice = () => {
    const baseInput = parseFloat(form.starting_price);
    if (isNaN(baseInput) || baseInput <= 0) {
      alert("Please enter a valid Starting Price first.");
      return;
    }

    const damageText = form.damage_description.toLowerCase();
    const issues = ["scratch", "crack", "not working", "broken", "no power", "display issue"];
    let deductionAmount = 0;

    // First: Detect known damage keywords
    let matched = false;
    issues.forEach(issue => {
      if (damageText.includes(issue)) {
        matched = true;
      }
    });

    // Smart deduction based on price slabs
    if (baseInput >= 30 && baseInput <= 60) {
      deductionAmount = matched ? 5 : 2;
    } else if (baseInput > 60 && baseInput <= 150) {
      deductionAmount = matched ? 12 : 10;
    } else if (baseInput > 150 && baseInput <= 500) {
      deductionAmount = matched ? (baseInput * 0.1) : (baseInput * 0.05);
    } else {
      deductionAmount = matched ? (baseInput * 0.15) : (baseInput * 0.1);
    }

    const estimated = Math.max(baseInput - deductionAmount, 10); // ensure it's not too low
    setForm(prev => ({ ...prev, starting_price: estimated.toFixed(2) }));
    alert(`Estimated Price (based on damage): ₹${estimated.toFixed(2)}`);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
      setForm(prev => ({
        ...prev,
        seller_id: user.email,         // ✅ Use email here!
        contact_email: user.email      // Optional: also use email for contact
      }));
    }
  }, []);


  const renderInput = (label, name, type = 'text', placeholder = '', isTextarea = false) => {
    const isRequired = requiredFields.includes(name);
    return (
      <div className="input-row">
        <label htmlFor={name}>
          {isRequired && <span className="required-star">*</span>} {label}
        </label>
        {isTextarea ? (
          <textarea id={name} name={name} placeholder={placeholder} onChange={handleChange} />
        ) : (
          <input id={name} type={type} name={name} placeholder={placeholder} onChange={handleChange} />
        )}
      </div>
    );
  };

  const renderSelect = (label, name, options) => {
    const isRequired = requiredFields.includes(name);
    return (
      <div className="input-row">
        <label htmlFor={name}>
          {isRequired && <span className="required-star">*</span>} {label}
        </label>
        <select id={name} name={name} value={form[name]} onChange={handleChange}>
          <option value="">Select an option</option>
          {options.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  };



  const getBuyNowPlaceholder = () => {
    const base = parseFloat(form.starting_price);
    if (!isNaN(base) && base > 0) {
      return `Should be more than ₹${base}`;
    }
    return "e.g. ₹200";
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => {
      const updatedImages = [...prev.images];
      updatedImages.splice(index, 1);
      return { ...prev, images: updatedImages };
    });

    setImagePreviews((prev) => {
      const updatedPreviews = [...prev];
      updatedPreviews.splice(index, 1);
      return updatedPreviews;
    });

    setFileInputKey(Date.now());
  };

  return (
    <Layout>
      <div className="post-items-form">
        <h2>🎁 Post an Auction Item</h2>
        <form onSubmit={handleSubmit}>

          <div className="form-section">
            <h3>🖼️ Item Basics</h3>
            {renderInput('Title', 'title', 'text', 'Item Title')}
            {renderInput('Description', 'description', 'text', 'Description', true)}
            <div className="input-row">
              <label htmlFor="category"><span id='red-mark'>* </span> Category</label>
              <select
                id="category"
                name="category"
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value === 'Other') {
                    setCustomCategory(''); // Reset previous input if any
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Select a category</option>
                <option value="Books">📚 Books</option>
                <option value="Electronics">🔌 Electronics</option>
                <option value="Clothing">👕 Clothing</option>
                <option value="Stationery">✏️ Stationery</option>
                <option value="Lab Equipment">⚗️ Lab Equipment</option>
                <option value="Sports Gear">🏏 Sports Gear</option>
                <option value="Hostel Essentials">🛏️ Hostel Essentials</option>
                <option value="Cycle/Bike Accessories">🚲 Cycle/Bike Accessories</option>
                <option value="Art Supplies">🎨 Art Supplies</option>
                <option value="Other">🧩 Other</option>
              </select>
            </div>

            {form.category === 'Other' && (
              <div className="input-row">
                <label htmlFor="customCategory">Specify Category</label>
                <input
                  type="text"
                  id="customCategory"
                  name="customCategory"
                  placeholder="Enter your category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              </div>
            )}


            {renderInput('Tags', 'tags', 'text', 'Tags (comma separated)')}
            <div className="input-group">
              <label>
                <input
                  type="checkbox"
                  name="limitedCollection"
                  checked={form.limitedCollection}
                  onChange={handleChange}
                /> Limited Collection Item
              </label>
            </div>
          </div>


          <div className="form-section">
            <h3>📸 Item Media</h3>
            <p className="media-warning">⚠️ Upload only original images and videos. No internet/media content allowed.</p>

            <div className="input-row side-by-side">
              <label htmlFor="images">Images (max 3)</label>
              <input
                type="file"
                name="images"
                id="images"
                key={fileInputKey} // reset input on change
                multiple
                accept="image/*"
                onChange={handleChange}
              />
              {form.images.length > 0 && (
                <p className="image-count">
                  {form.images.length} of 3 images selected
                </p>
              )}



            </div>

            {form.images.length > 0 && (
              <div className="image-pre-container">
                {imagePreviews.map((src, index) => (
                  <div className="image-wrapper" key={index}>
                    <img
                      src={src}
                      alt={`preview-${index}`}
                      className="pre-image"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleRemoveImage(index)}
                    >
                      ❌
                    </button>
                  </div>
                ))}
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

            <div className="input-row">
              <label htmlFor="starting_price">Starting Price</label>
              <input
                type="number"
                id="starting_price"
                name="starting_price"
                className="styled-number"
                placeholder="e.g. ₹50"
                min="10"
                step="1"
                value={form.starting_price}
                onChange={handleChange}
              />
            </div>

            <div className="input-row">
              <label htmlFor="minimum_increment">Minimum Increment</label>
              <input
                type="number"
                id="minimum_increment"
                name="minimum_increment"
                className="styled-number"
                placeholder="e.g. ₹10"
                min="1"
                step="1"
                value={form.minimum_increment}
                onChange={handleChange}
              />
            </div>

            <div className="input-row">
              <label htmlFor="buy_now_price">Buy Now Price (optional)</label>
              <input
                type="number"
                id="buy_now_price"
                name="buy_now_price"
                className="styled-number"
                placeholder={getBuyNowPlaceholder()}
                min={form.starting_price ? parseFloat(form.starting_price) + 1 : 0}
                step="5"
                value={form.buy_now_price}
                onChange={handleChange}
              />
            </div>

          </div>


          <div className="form-section">
            <h3>🔧 Item Condition Details</h3>
            {renderInput('Damage Description', 'damage_description', 'text', 'E.g. Slight scratch on screen', true)}
            <button type="button" onClick={handleEstimatePrice} className="estimate-btn">Estimate Price</button>
          </div>

          <div className="form-section">
            <h3>🕒 Auction Timing</h3>
            {renderInput('Start Date & Time', 'start_date_time', 'datetime-local')}
            {renderInput('End Date & Time', 'end_date_time', 'datetime-local')}
            {renderInput('Duration', 'duration', 'text', 'Duration (optional)')}
          </div>

          <div className="form-section">
            <h3>👤 Seller Info</h3>
            <div className="input-row">
              <label htmlFor="seller_id">Seller Email</label>
              <input
                type="text"
                name="seller_id"
                value={form.seller_id}
                readOnly
                placeholder="Your ID"
                className='readonly-input'
                title='Auto-filled. You cannot edit this..'
              />
            </div>
            {renderInput('Location', 'location', 'text', 'Location (optional)')}
          </div>


          <div className="form-section">
            <h3>🚚 Shipping & Pickup</h3>
            {renderSelect('Pickup Method', 'pickup_method', ['Meet on Campus', 'Home Delivery', 'Pickup from Seller'])}

            <div className="input-row">
              <label htmlFor="delivery_charge">Delivery Charge</label>
              <input
                type="number"
                name="delivery_charge"
                id="delivery_charge"
                className="styled-number"
                placeholder="Delivery Charge (optional)"
                onChange={handleChange}
                value={form.delivery_charge}
                min="0"
                max="999"
              />
            </div>


            {renderInput('Return Policy', 'return_policy', 'text', 'Return Policy (optional)')}
          </div>

          <div className="form-section">
            <h3>🌟 Bonus</h3>

            <div className="input-row">
              <label htmlFor="highlights">Auction Highlights</label>
              <input
                type="text"
                name="highlights"
                placeholder="e.g. Used only once"
                onChange={handleChange}
              />
            </div>

            <div className="input-row">
              <label htmlFor="item_condition">Item Condition</label>
              <select
                name="item_condition"
                value={itemCondition}
                onChange={(e) => {
                  setItemCondition(e.target.value);
                  handleChange(e);
                }}
              >
                <option value="">Select condition</option>
                <option value="Brand New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Used">Used</option>
                <option value="For Parts">For Parts</option>
              </select>
            </div>

            <div className="input-row">
              <label htmlFor="warranty">Warranty</label>
              <select
                name="warranty"
                value={warranty}
                onChange={(e) => {
                  setWarranty(e.target.value);
                  handleChange(e);
                }}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {warranty === 'Yes' && (
              <div className="input-row">
                <label htmlFor="warranty_duration">Warranty Duration</label>
                <input
                  type="text"
                  name="warranty_duration"
                  placeholder="e.g. 6 months"
                  onChange={handleChange}
                />
              </div>
            )}
          </div>


          <div className="form-section">
            <h3>🔒 Rules</h3>
            <div className="input-group">
              <label>
                <input type="checkbox" name="terms_accepted" onChange={handleChange} />
                I accept the <span className="terms-link" onClick={() => setShowTerms(true)}>terms & conditions</span>
              </label>
            </div>
            {showTerms && (
              <div className="terms-overlay">
                <div className="terms-popup">
                  <div className="terms-content">
                    <h3>📜 Terms & Conditions</h3>
                    <ul className="terms-list">
                      <li>✅ You must own the item you're listing. No stolen or borrowed goods.</li>
                      <li>📷 Use only real photos of your item. No fake or stock images.</li>
                      <li>❌ No listing of illegal or restricted items (drugs, weapons, etc.).</li>
                      <li>💬 Describe your item honestly. No misleading info.</li>
                      <li>💸 Start price must be fair. No fake bids allowed.</li>
                      <li>🧑‍🎓 Only students can post, buy, or bid. Campus use only.</li>
                      <li>🤝 Post-auction, deliver the item after online payment.</li>
                      <li>🔍 Admins can review or remove listings anytime.</li>
                      <li>🚨 Violations may lead to listing removal or account action.</li>
                      <li>✅ By posting, you agree to all auction and campus rules.</li>
                    </ul>
                    <button className="close-btn-bottom" onClick={() => setShowTerms(false)}>Close</button>
                  </div>
                </div>
              </div>
            )}

          </div>
          <button type="submit" disabled={isPosting}>{isPosting ? 'Posting...' : 'Post Item'}</button>
        </form>
      </div>

    </Layout>
  );
};

export default PostItems;
