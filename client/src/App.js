import LandingPage from './components/LandingPage';
import EventPage from './components/EventPage';
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './App.css';

function App() {
  return (
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path = '/' element = {<LandingPage />}/>
            <Route path = '/FullEventInfo/:eventInfo' element = {<EventPage />}/>
          </Routes>
        </BrowserRouter>
      </div>
    );
  }

export default App;


/*
// App.js - Updated example usage
import React, { useState } from 'react';
import EventCreationPopup from './components/EventCreationPopup';

const App = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle successful event creation
  const handleEventCreated = (newEvent) => {
    console.log('Event created successfully:', newEvent);
    
    // Add to local events list (if you're displaying them)
    setEvents(prevEvents => [newEvent, ...prevEvents]);
    
    // Show success message
    alert(`Event "${newEvent.title}" created successfully!`);
    
    // You could also redirect or update other parts of your app here
  };

  // Fetch existing events (optional - for displaying events)
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/events`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events when component mounts (optional)
  React.useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="app">
      <header style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
        <h1>My Event App</h1>
        <button 
          onClick={() => setIsPopupOpen(true)}
          style={{
            padding: '12px 24px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Create Event
        </button>
      </header>

      <main style={{ padding: '20px' }}>
        <div>
          <h2>Events ({events.length})</h2>
          {loading ? (
            <p>Loading events...</p>
          ) : events.length === 0 ? (
            <p>No events yet. Create the first one!</p>
          ) : (
            <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
              {events.map(event => (
                <div 
                  key={event.id} 
                  style={{ 
                    border: '1px solid #ddd', 
                    padding: '16px', 
                    borderRadius: '8px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <h3>{event.title}</h3>
                  <p><strong>Category:</strong> {event.category}</p>
                  <p><strong>Date:</strong> {event.startDate} at {event.startTime}</p>
                  <p><strong>Location:</strong> {
                    event.locationType === 'virtual' 
                      ? 'Virtual Event' 
                      : `${event.venue}, ${event.city}`
                  }</p>
                  <p><strong>Status:</strong> 
                    <span style={{ 
                      color: event.status === 'approved' ? 'green' : 'orange',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {event.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      //event creation
      <EventCreationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handleEventCreated}
      />
    </div>
  );
};

export default App;
*/