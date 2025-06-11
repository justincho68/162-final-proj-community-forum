import React, { useState, useEffect } from 'react';
import { auth } from '../firebase.js';
import { createEvent } from '../services/eventService';
import './EventCreationPopup.css';

const EventCreationPopup = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    locationType: 'physical',
    venue: '',
    address: '',
    city: '',
    virtualLink: '',
    capacity: '',
    price: '',
    organizerName: '',
    organizerEmail: '',
    requiresRegistration: false,
    imageUrl: '' // store local url rather than storing image in firestore - costs money
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const categories = [
    'Technology', 'Business', 'Education', 'Arts & Culture', 'Sports & Fitness',
    'Health & Wellness', 'Food & Drink', 'Music', 'Networking', 'Workshop',
    'Conference', 'Meetup', 'Social', 'Other'
  ];

  //check auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          organizerName: currentUser.displayName || '',
          organizerEmail: currentUser.email || ''
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 2MB for local storage)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB for local storage');
        return;
      }
      
      // Convert to base64 data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setImagePreview(dataUrl);
        setFormData(prev => ({
          ...prev,
          imageUrl: dataUrl
        }));
      };
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  //external url
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      imageUrl: url
    }));
    
    // Set preview for external URLs
    if (url && url.startsWith('http')) {
      setImagePreview(url);
    } else if (!url) {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setError('You must be logged in to create events. Please log in and try again.');
      setLoading(false);
      return;
    }

    // Basic validation
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!formData.startDate || !formData.startTime) {
      setError('Please provide event date and time');
      setLoading(false);
      return;
    }

    if (formData.locationType === 'physical' && (!formData.venue || !formData.city)) {
      setError('Please provide venue and city for physical events');
      setLoading(false);
      return;
    }

    if (formData.locationType === 'virtual' && !formData.virtualLink) {
      setError('Please provide virtual meeting link');
      setLoading(false);
      return;
    }

    try {
      // Create event with local image data
      const eventData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: parseFloat(formData.price) || 0
        // imageUrl already contains the base64 data URL or external URL
      };
      
      const newEvent = await createEvent(eventData);

      if (onSubmit) {
        onSubmit(newEvent);
      }
      
      // Reset form
      setFormData({
        title: '', description: '', category: '', startDate: '', startTime: '',
        endDate: '', endTime: '', locationType: 'physical', venue: '', address: '',
        city: '', virtualLink: '', capacity: '', price: '', 
        organizerName: user?.displayName || '', 
        organizerEmail: user?.email || '', 
        requiresRegistration: false,
        imageUrl: ''
      });
      
      setImagePreview(null);
      
      // Clear file input
      const fileInput = document.getElementById('image-upload');
      if (fileInput) fileInput.value = '';
      
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please make sure you are logged in.');
      } else {
        setError(error.message || 'Failed to create event');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="popup-overlay">
        <div className="popup-container">
          <div className="popup-header">
            <h2>Login Required</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p>You must be logged in to create events.</p>
            <p>Please log in and try again.</p>
            <button 
              onClick={onClose}
              className="btn-submit"
              style={{ marginTop: '20px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <div className="popup-header">
          <h2>Create New Event</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          {error && <div className="error-message">{error}</div>}

          <div style={{ 
            background: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>Creating as:</strong> {user.displayName || user.email}
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Event Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="capacity">Capacity</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Max attendees"
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event"
                rows="3"
                required
              />
            </div>

            {/* Image Upload Section */}
            <div className="form-group">
              <label>Event Image</label>
              
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Event preview" />
                  <button 
                    type="button" 
                    onClick={removeImage}
                    className="remove-image-btn"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="image-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <div className="upload-placeholder">
                      <span>📷</span>
                      <p>Click to upload image</p>
                      <small>JPG, PNG up to 2MB</small>
                      <small>(Stored locally)</small>
                    </div>
                  </label>
                </div>
              )}
              
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label htmlFor="imageUrl">Or paste image URL</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="form-section">
            <h3>Date & Time</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3>Location</h3>
            
            <div className="form-group">
              <label>Event Type *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="locationType"
                    value="physical"
                    checked={formData.locationType === 'physical'}
                    onChange={handleChange}
                  />
                  Physical Event
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="locationType"
                    value="virtual"
                    checked={formData.locationType === 'virtual'}
                    onChange={handleChange}
                  />
                  Virtual Event
                </label>
              </div>
            </div>

            {formData.locationType === 'physical' && (
              <>
                <div className="form-group">
                  <label htmlFor="venue">Venue *</label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    placeholder="Venue name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {formData.locationType === 'virtual' && (
              <div className="form-group">
                <label htmlFor="virtualLink">Virtual Meeting Link *</label>
                <input
                  type="url"
                  id="virtualLink"
                  name="virtualLink"
                  value={formData.virtualLink}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/..."
                  required
                />
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <h3>Additional Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price ($)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="requiresRegistration"
                    checked={formData.requiresRegistration}
                    onChange={handleChange}
                  />
                  Requires Registration
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="organizerName">Your Name</label>
                <input
                  type="text"
                  id="organizerName"
                  name="organizerName"
                  value={formData.organizerName}
                  onChange={handleChange}
                  placeholder="Organizer name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="organizerEmail">Contact Email</label>
                <input
                  type="email"
                  id="organizerEmail"
                  name="organizerEmail"
                  value={formData.organizerEmail}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventCreationPopup;