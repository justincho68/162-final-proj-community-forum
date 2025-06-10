import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingEvents } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      try {
        const events = await getUpcomingEvents(6);
        setUpcomingEvents(events);
      } catch (error) {
        console.error('Error loading upcoming events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingEvents();
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Amazing Events</h1>
          <p>Find and create events that bring people together</p>
          <div className="hero-actions">
            <Link to="/events" className="btn-primary">
              Browse Events
            </Link>
            {currentUser ? (
              <Link to="/events/create" className="btn-secondary">
                Create Event
              </Link>
            ) : (
              <Link to="/signup" className="btn-secondary">
                Join Us
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="upcoming-events">
        <div className="section-header">
          <h2>Upcoming Events</h2>
          <Link to="/events" className="view-all-link">
            View All Events →
          </Link>
        </div>
        
        {loading ? (
          <div className="loading">Loading events...</div>
        ) : upcomingEvents.length > 0 ? (
          <div className="events-grid">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="no-events">
            <p>No upcoming events at the moment.</p>
            {currentUser && (
              <Link to="/events/create" className="btn-primary">
                Create the First Event!
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose EventHub?</h2>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <h3>Easy Discovery</h3>
            <p>Find events that match your interests with powerful search and filtering</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🚀</div>
            <h3>Simple Creation</h3>
            <p>Create and manage events with our intuitive step-by-step form</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🌐</div>
            <h3>Virtual & Physical</h3>
            <p>Support for in-person, virtual, and hybrid events</p>
          </div>
          <div className="feature">
            <div className="feature-icon">👥</div>
            <h3>Community Driven</h3>
            <p>Connect with like-minded people and build your network</p>
          </div>
        </div>
      </section>
    </div>
  );
};

// Simple EventCard component (reuse from EventList)
const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
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
        </div>
        <div className="event-location">
          {event.location.type === 'virtual' ? '🌐 Virtual' : `📍 ${event.location.city}`}
        </div>
      </div>
    </div>
  );
};

export default Home;