import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserEvents } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [userEvents, setUserEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadUserEvents();
    }
  }, [currentUser]);

  const loadUserEvents = async () => {
    try {
      setLoading(true);
      const events = await getUserEvents();
      setUserEvents(events);
    } catch (error) {
      setError('Failed to load your events: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEventsByStatus = (status) => {
    return userEvents.filter(event => event.status === status);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {userProfile?.profile?.firstName || currentUser?.displayName || 'User'}!</h1>
        <Link to="/events/create" className="btn-primary">
          Create New Event
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{userEvents.length}</h3>
          <p>Total Events</p>
        </div>
        <div className="stat-card">
          <h3>{getEventsByStatus('approved').length}</h3>
          <p>Published</p>
        </div>
        <div className="stat-card">
          <h3>{getEventsByStatus('pending').length}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card">
          <h3>{userEvents.reduce((sum, event) => sum + (event.attendeeCount || 0), 0)}</h3>
          <p>Total Attendees</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <section className="recent-events">
          <h2>Your Recent Events</h2>
          {userEvents.length === 0 ? (
            <div className="no-events">
              <p>You haven't created any events yet.</p>
              <Link to="/events/create" className="btn-primary">
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="events-list">
              {userEvents.slice(0, 5).map(event => (
                <div key={event.id} className="dashboard-event-item">
                  <div className="event-info">
                    <h4>
                      <Link to={`/events/${event.id}`}>{event.title}</Link>
                    </h4>
                    <p>{event.category} • {new Date(event.startDate).toLocaleDateString()}</p>
                    <span className={`status-badge ${event.status}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="event-actions">
                    <Link to={`/events/${event.id}/edit`} className="btn-secondary btn-sm">
                      Edit
                    </Link>
                    <Link to={`/events/${event.id}`} className="btn-primary btn-sm">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;