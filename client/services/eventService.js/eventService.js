import { 
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    increment
  } from 'firebase/firestore';
  import { auth, db } from '../firebase/config';
  
  //creating new event
  export const createEvent = async (eventData) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to create events');
  
    const event = {
      //get basic event info
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      
      //date and time
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      timezone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      //location
      location: {
        type: eventData.locationType, // 'physical', 'virtual', 'hybrid'
        venue: eventData.venue || '',
        address: eventData.address || '',
        city: eventData.city || '',
        state: eventData.state || '',
        country: eventData.country || '',
        virtualLink: eventData.virtualLink || '',
        virtualPlatform: eventData.virtualPlatform || ''
      },
      
      //get event details
      capacity: eventData.capacity || null,
      price: eventData.price || 0,
      currency: eventData.currency || 'USD',
      tags: eventData.tags || [],
      imageUrl: eventData.imageUrl || '',
      website: eventData.website || '',
      
      //add registration
      requiresRegistration: eventData.requiresRegistration || false,
      registrationDeadline: eventData.registrationDeadline || null,
      
      //organizer info
      organizer: {
        uid: user.uid,
        name: eventData.organizerName || user.displayName || '',
        email: eventData.organizerEmail || user.email,
        phone: eventData.organizerPhone || '',
        organization: eventData.organization || ''
      },
      
      //status and pending
      status: 'pending', // 'pending', 'approved', 'rejected', 'cancelled'
      isPublic: eventData.isPublic !== false, // Default to public
      attendeeCount: 0,
      viewCount: 0,
      
      //track when events are posted
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
  
    try {
      const docRef = await addDoc(collection(db, 'events'), event);
      return { id: docRef.id, ...event };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };
  
  //get events by ID
  export const getEvent = async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      
      if (eventDoc.exists()) {
        //increment view count when selected
        await updateDoc(doc(db, 'events', eventId), {
          viewCount: increment(1)
        });
        
        return { id: eventDoc.id, ...eventDoc.data() };
      } else {
        throw new Error('Event not found');
      }
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  };
  
  //get all events with filters
  export const getEvents = async (filters = {}) => {
    try {
      let eventsQuery = collection(db, 'events');
      const constraints = [];
      
      // Add filters
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters.organizerUid) {
        constraints.push(where('organizer.uid', '==', filters.organizerUid));
      }
      
      if (filters.isPublic !== undefined) {
        constraints.push(where('isPublic', '==', filters.isPublic));
      }
      
      //add ordering
      if (filters.orderBy) {
        constraints.push(orderBy(filters.orderBy, filters.orderDirection || 'desc'));
      } else {
        constraints.push(orderBy('createdAt', 'desc'));
      }
      
      //add limit
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }
      
      //add pagination
      if (filters.startAfter) {
        constraints.push(startAfter(filters.startAfter));
      }
      
      eventsQuery = query(eventsQuery, ...constraints);
      const querySnapshot = await getDocs(eventsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  };
  
  //get upcoming events
  export const getUpcomingEvents = async (limitCount = 10) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return getEvents({
      status: 'approved',
      isPublic: true,
      orderBy: 'startDate',
      orderDirection: 'asc',
      limit: limitCount
    });
  };
  
  //get the user's events
  export const getUserEvents = async (uid = null) => {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) throw new Error('No user ID provided');
    
    return getEvents({
      organizerUid: userId,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  };
  
  //update the event
  export const updateEvent = async (eventId, updates) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to update events');
    
    try {
      //check if user owns the event or is admin
      const event = await getEvent(eventId);
      if (event.organizer.uid !== user.uid) {
        //check if user is admin
        throw new Error('Not authorized to update this event');
      }
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(doc(db, 'events', eventId), updateData);
      return { id: eventId, ...event, ...updateData };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };
  
  //delete event
  export const deleteEvent = async (eventId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to delete events');
    
    try {
      //ensure user owns the event or is admin
      const event = await getEvent(eventId);
      if (event.organizer.uid !== user.uid) {
        throw new Error('Not authorized to delete this event');
      }
      
      await deleteDoc(doc(db, 'events', eventId));
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };
  
  //registering for event
  export const registerForEvent = async (eventId) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to register for events');
    
    try {
      //add registraition document
      await addDoc(collection(db, 'registrations'), {
        eventId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || '',
        registeredAt: serverTimestamp(),
        status: 'confirmed'
      });
      
      //increment the attendee count
      await updateDoc(doc(db, 'events', eventId), {
        attendeeCount: increment(1)
      });
      
      return true;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  };
  
  //get the event categories
  export const getEventCategories = () => {
    return [
      'Technology',
      'Business',
      'Education',
      'Arts & Culture',
      'Sports & Fitness',
      'Health & Wellness',
      'Food & Drink',
      'Music',
      'Networking',
      'Workshop',
      'Conference',
      'Meetup',
      'Social',
      'Other'
    ];
  };