// services/eventService.js - Updated with debugging
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase.js';

// Create event (requires authentication)
export const createEvent = async (eventData) => {
  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be logged in to create events');
  }

  console.log('Creating event with data:', eventData); // Debug log
  console.log('Image URL being saved:', eventData.imageUrl); // Debug log

  try {
    const event = {
      ...eventData,
      // Add creator information
      creatorId: currentUser.uid,
      creatorEmail: currentUser.email,
      creatorName: currentUser.displayName || currentUser.email,
      // Set default values
      status: 'approved', // Change to 'approved' for testing (was 'pending')
      attendeeCount: 0,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('Final event object before saving:', event); // Debug log
    
    const docRef = await addDoc(collection(db, 'events'), event);
    
    console.log('Event saved with ID:', docRef.id); // Debug log
    
    // Return the event with current timestamp for immediate display
    const returnEvent = { 
      id: docRef.id, 
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Returning event:', returnEvent); // Debug log
    
    return returnEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Get events (public can read approved events)
export const getEvents = async (filters = {}) => {
  try {
    let q = collection(db, 'events');
    const constraints = [];
    
    // Default to approved events for public viewing
    constraints.push(where('status', '==', filters.status || 'approved'));
    
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    
    // If user wants their own events (any status)
    if (filters.myEvents && auth.currentUser) {
      constraints.length = 0; // Clear previous constraints
      constraints.push(where('creatorId', '==', auth.currentUser.uid));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    q = query(q, ...constraints);
    const querySnapshot = await getDocs(q);
    const events = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      console.log('Fetched event:', doc.id, data); // Debug log
      console.log('Event imageUrl:', data.imageUrl); // Debug log
      
      events.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      });
    });
    
    console.log('All fetched events:', events); // Debug log
    
    // Client-side search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return events.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm)
      );
    }
    
    return events;
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
};

// Get user's own events
export const getMyEvents = async () => {
  if (!auth.currentUser) {
    throw new Error('You must be logged in to view your events');
  }
  
  return getEvents({ myEvents: true });
};

// Update event (only creator can update)
export const updateEvent = async (eventId, updates) => {
  if (!auth.currentUser) {
    throw new Error('You must be logged in to update events');
  }

  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return getEvent(eventId);
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You can only update your own events');
    }
    throw error;
  }
};

// Delete event (only creator can delete)
export const deleteEvent = async (eventId) => {
  if (!auth.currentUser) {
    throw new Error('You must be logged in to delete events');
  }

  try {
    await deleteDoc(doc(db, 'events', eventId));
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You can only delete your own events');
    }
    throw error;
  }
};

// Check if user can edit event
export const canEditEvent = (event) => {
  return auth.currentUser && auth.currentUser.uid === event.creatorId;
};

// Get single event
export const getEvent = async (eventId) => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    
    if (eventDoc.exists()) {
      const data = eventDoc.data();
      return {
        id: eventDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
    } else {
      throw new Error('Event not found');
    }
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
};