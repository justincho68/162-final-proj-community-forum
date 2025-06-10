// Example usage in your main component
import React, { useState } from 'react';
import EventCreationPopup from './components/EventCreationPopup';

const App = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleCreateEvent = async (eventData) => {
    try {
      console.log('Event data:', eventData);
      
      // Here you would typically send the data to your backend/database
      // For example:
      // await fetch('/api/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventData)
      // });
      
      // Or save to Firestore:
      // await addDoc(collection(db, 'events'), eventData);
      
      alert('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="app">
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

      <EventCreationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
};

export default App;