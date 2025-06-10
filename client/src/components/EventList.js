// client/src/components/EventList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEvents, getEventCategories } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';

const EventList = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    status: 'approved'
  });

  const categories = getEventCategories();

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventFilters = {
        status: filters.status,
        isPublic: true
      };
      
      if (filters.category) {
        eventFilters.category = filters.category;
      }
      
      const eventsList = await getEvents(eventFilters);
      
      // Client-side search filter
      let filteredEvents = eventsList;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredEvents = eventsList.filter(event => 
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.organizer.name.toLowerCase().includes(searchTerm)
        );
      }
      
      setEvents(filteredEvents);
    } catch (error) {
      setError('Failed to load events: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="event-list-container">
      <div className="event-list-header">
        <h2>Upcoming Events</h2>
        {currentUser && (
          <Link to="/events/create" className="btn-primary">
            Create Event
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="event-filters">
        <div className="filter-group">
          <input
            type="text"
            name="search"
            placeholder="Search events..."
            value={filters.search}
            onChange={handleFilterChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {events.length === 0 ? (
        <div className="no-events">
          <p>No events found matching your criteria.</p>
          {currentUser && (
            <Link to="/events/create" className="btn-primary">
              Be the first to create an event!
            </Link>
          )}
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

// Event Card Component
const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="event-card">
      {event.imageUrl && (
        <div className="event-image">
          <img src={event.imageUrl} alt={event.title} />
        </div>
      )}
      
      <div className="event-content">
        <div className="event-category">{event.category}</div>
        
        <h3 className="event-title">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        
        <div className="event-date-time">
          <span className="event-date">{formatDate(event.startDate)}</span>
          <span className="event-time">{formatTime(event.startTime)}</span>
        </div>
        
        <div className="event-location">
          {event.location.type === 'virtual' ? (
            <span>🌐 Virtual Event</span>
          ) : event.location.type === 'hybrid' ? (
            <span>🔄 {event.location.city} + Virtual</span>
          ) : (
            <span>📍 {event.location.city}</span>
          )}
        </div>
        
        <p className="event-description">
          {event.description.length > 120 
            ? `${event.description.substring(0, 120)}...` 
            : event.description
          }
        </p>
        
        <div className="event-footer">
          <div className="event-organizer">
            By {event.organizer.name}
          </div>
          
          <div className="event-meta">
            {event.price > 0 ? (
              <span className="event-price">${event.price}</span>
            ) : (
              <span className="event-price free">Free</span>
            )}
            
            {event.capacity && (
              <span className="event-capacity">
                {event.attendeeCount || 0}/{event.capacity}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventList;

// client/src/components/EventDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEvent, registerForEvent, deleteEvent } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';

const EventDetail = () => {
  const { eventId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      setError('Failed to load event: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setRegistering(true);
      await registerForEvent(eventId);
      
      // Reload event to get updated attendee count
      await loadEvent();
      alert('Successfully registered for the event!');
    } catch (error) {
      alert('Failed to register: ' + error.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await deleteEvent(eventId);
      navigate('/events');
    } catch (error) {
      alert('Failed to delete event: ' + error.message);
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return '';
    const dateObj = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      dateObj.setHours(parseInt(hours), parseInt(minutes));
    }
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: time ? 'numeric' : undefined,
      minute: time ? '2-digit' : undefined,
      hour12: time ? true : undefined
    });
  };

  const isEventOwner = currentUser && event && event.organizer.uid === currentUser.uid;
  const isAdmin = userProfile?.role === 'admin';
  const canEdit = isEventOwner || isAdmin;

  if (loading) {
    return <div className="loading">Loading event...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!event) {
    return <div className="error-message">Event not found</div>;
  }

  return (
    <div className="event-detail-container">
      <div className="event-detail-header">
        {event.imageUrl && (
          <div className="event-hero-image">
            <img src={event.imageUrl} alt={event.title} />
          </div>
        )}
        
        <div className="event-header-content">
          <div className="event-category">{event.category}</div>
          <h1>{event.title}</h1>
          
          <div className="event-meta">
            <div className="event-datetime">
              📅 {formatDateTime(event.startDate, event.startTime)}
              {event.endDate && (
                <span> - {formatDateTime(event.endDate, event.endTime)}</span>
              )}
            </div>
            
            <div className="event-location">
              {event.location.type === 'virtual' ? (
                <span>🌐 Virtual Event</span>
              ) : event.location.type === 'hybrid' ? (
                <span>🔄 {event.location.venue}, {event.location.city} + Virtual</span>
              ) : (
                <span>📍 {event.location.venue}, {event.location.city}</span>
              )}
            </div>
            
            <div className="event-organizer">
              👤 Organized by {event.organizer.name}
              {event.organizer.organization && (
                <span> from {event.organizer.organization}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="event-actions">
          {canEdit && (
            <div className="admin-actions">
              <Link to={`/events/${eventId}/edit`} className="btn-secondary">
                Edit Event
              </Link>
              <button onClick={handleDelete} className="btn-danger">
                Delete Event
              </button>
            </div>
          )}
          
          {event.requiresRegistration && currentUser && !isEventOwner && (
            <button 
              onClick={handleRegister}
              disabled={registering}
              className="btn-primary register-btn"
            >
              {registering ? 'Registering...' : 'Register for Event'}
            </button>
          )}
          
          {!currentUser && (
            <Link to="/login" className="btn-primary">
              Login to Register
            </Link>
          )}
        </div>
      </div>
      
      <div className="event-detail-content">
        <div className="event-description">
          <h3>About This Event</h3>
          <p>{event.description}</p>
        </div>
        
        <div className="event-details-grid">
          <div className="detail-section">
            <h4>Event Details</h4>
            <ul>
              {event.price > 0 ? (
                <li>💰 Price: ${event.price}</li>
              ) : (
                <li>💰 Free Event</li>
              )}
              
              {event.capacity && (
                <li>👥 Capacity: {event.attendeeCount || 0}/{event.capacity}</li>
              )}
              
              {event.tags.length > 0 && (
                <li>🏷️ Tags: {event.tags.join(', ')}</li>
              )}
              
              {event.website && (
                <li>
                  🌐 Website: <a href={event.website} target="_blank" rel="noopener noreferrer">
                    {event.website}
                  </a>
                </li>
              )}
            </ul>
          </div>
          
          <div className="detail-section">
            <h4>Location & Access</h4>
            {event.location.type === 'physical' && (
              <div className="location-info">
                <p>{event.location.venue}</p>
                {event.location.address && <p>{event.location.address}</p>}
                <p>{event.location.city}, {event.location.state} {event.location.country}</p>
              </div>
            )}
            
            {(event.location.type === 'virtual' || event.location.type === 'hybrid') && (
              <div className="virtual-info">
                <p>Platform: {event.location.virtualPlatform}</p>
                {event.location.virtualLink && (
                  <p>
                    <a href={event.location.virtualLink} target="_blank" rel="noopener noreferrer">
                      Join Virtual Event
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="detail-section">
            <h4>Contact Information</h4>
            <ul>
              <li>📧 {event.organizer.email}</li>
              {event.organizer.phone && <li>📞 {event.organizer.phone}</li>}
              {event.organizer.organization && <li>🏢 {event.organizer.organization}</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};