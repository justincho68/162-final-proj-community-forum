// EventCreationPopup.js
import React, { useState, useEffect } from 'react';
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
    requiresRegistration: false
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  //get the categories from the backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/events/categories`);
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.categories);
        } else {
          // Fallback to hardcoded categories if API fails
          setCategories([
            'Technology', 'Business', 'Education', 'Arts & Culture', 'Sports & Fitness',
            'Health & Wellness', 'Food & Drink', 'Music', 'Networking', 'Workshop',
            'Conference', 'Meetup', 'Social', 'Other'
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback categories
        setCategories([
          'Technology', 'Business', 'Education', 'Arts & Culture', 'Sports & Fitness',
          'Health & Wellness', 'Food & Drink', 'Music', 'Networking', 'Workshop',
          'Conference', 'Meetup', 'Social', 'Other'
        ]);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
      // Call the backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          price: parseFloat(formData.price) || 0
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      // Call the parent's onSubmit callback with the response
      if (onSubmit) {
        onSubmit(data.event);
      }
      
      // Reset form
      setFormData({
        title: '', description: '', category: '', startDate: '', startTime: '',
        endDate: '', endTime: '', locationType: 'physical', venue: '', address: '',
        city: '', virtualLink: '', capacity: '', price: '', organizerName: '',
        organizerEmail: '', requiresRegistration: false
      });
      
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <div className="popup-header">
          <h2>Create New Event</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          {error && <div className="error-message">{error}</div>}

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