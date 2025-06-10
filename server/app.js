const express = require('express');
const cors = require('cors');
const { db } = require('./firebase-admin');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// ============= EVENT ROUTES WITH FIRESTORE =============

// GET /api/events - Get all events (with optional filters)
app.get('/api/events', async (req, res) => {
  try {
    const { category, search, status = 'approved' } = req.query;
    
    let query = db.collection('events');
    
    // Filter by status
    query = query.where('status', '==', status);
    
    // Filter by category if provided
    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Order by creation date (newest first)
    query = query.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    let events = [];
    
    snapshot.forEach(doc => {
      const eventData = doc.data();
      // Convert Firestore timestamps to ISO strings
      events.push({
        id: doc.id,
        ...eventData,
        createdAt: eventData.createdAt?.toDate?.()?.toISOString() || eventData.createdAt,
        updatedAt: eventData.updatedAt?.toDate?.()?.toISOString() || eventData.updatedAt
      });
    });
    
    // Client-side search filter (since Firestore doesn't support full-text search easily)
    if (search) {
      const searchTerm = search.toLowerCase();
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch events' 
    });
  }
});

// GET /api/events/:id - Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventDoc = await db.collection('events').doc(id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    const eventData = eventDoc.data();
    
    // Increment view count
    await db.collection('events').doc(id).update({
      viewCount: (eventData.viewCount || 0) + 1
    });
    
    const event = {
      id: eventDoc.id,
      ...eventData,
      viewCount: (eventData.viewCount || 0) + 1,
      createdAt: eventData.createdAt?.toDate?.()?.toISOString() || eventData.createdAt,
      updatedAt: eventData.updatedAt?.toDate?.()?.toISOString() || eventData.updatedAt
    };
    
    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch event' 
    });
  }
});

// POST /api/events - Create new event
app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    
    // Basic validation
    if (!eventData.title || !eventData.description || !eventData.category) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and category are required'
      });
    }
    
    if (!eventData.startDate || !eventData.startTime) {
      return res.status(400).json({
        success: false,
        error: 'Start date and time are required'
      });
    }
    
    // Create new event with Firestore server timestamps
    const newEvent = {
      ...eventData,
      status: 'pending', // Default status
      attendeeCount: 0,
      viewCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to Firestore
    const docRef = await db.collection('events').add(newEvent);
    
    // Get the created document to return it
    const createdDoc = await docRef.get();
    const createdEvent = {
      id: docRef.id,
      ...createdDoc.data(),
      createdAt: new Date().toISOString(), // Convert for response
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: createdEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create event' 
    });
  }
});

// PUT /api/events/:id - Update event
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if event exists
    const eventDoc = await db.collection('events').doc(id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Update event
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('events').doc(id).update(updateData);
    
    // Get updated document
    const updatedDoc = await db.collection('events').doc(id).get();
    const updatedEvent = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update event' 
    });
  }
});

// DELETE /api/events/:id - Delete event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if event exists
    const eventDoc = await db.collection('events').doc(id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Delete event
    await db.collection('events').doc(id).delete();
    
    // Also delete related registrations
    const registrationsSnapshot = await db.collection('registrations')
      .where('eventId', '==', id)
      .get();
    
    const batch = db.batch();
    registrationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete event' 
    });
  }
});

// GET /api/events/categories - Get available categories
app.get('/api/events/categories', (req, res) => {
  const categories = [
    'Technology', 'Business', 'Education', 'Arts & Culture', 'Sports & Fitness',
    'Health & Wellness', 'Food & Drink', 'Music', 'Networking', 'Workshop',
    'Conference', 'Meetup', 'Social', 'Other'
  ];
  
  res.json({
    success: true,
    categories
  });
});

// ============= REGISTRATION ROUTES WITH FIRESTORE =============

// GET /api/registrations - Get registrations
app.get('/api/registrations', async (req, res) => {
  try {
    const { eventId, userId } = req.query;
    
    let query = db.collection('registrations');
    
    if (eventId) {
      query = query.where('eventId', '==', eventId);
    }
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    const snapshot = await query.get();
    const registrations = [];
    
    snapshot.forEach(doc => {
      const regData = doc.data();
      registrations.push({
        id: doc.id,
        ...regData,
        registeredAt: regData.registeredAt?.toDate?.()?.toISOString() || regData.registeredAt
      });
    });
    
    res.json({
      success: true,
      registrations
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch registrations' 
    });
  }
});

// POST /api/registrations - Register for event
app.post('/api/registrations', async (req, res) => {
  try {
    const { eventId, userId, userEmail, userName } = req.body;
    
    if (!eventId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID and User ID are required'
      });
    }
    
    // Check if event exists
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    const eventData = eventDoc.data();
    
    // Check if already registered
    const existingRegSnapshot = await db.collection('registrations')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get();
    
    if (!existingRegSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this event'
      });
    }
    
    // Check capacity
    if (eventData.capacity && eventData.attendeeCount >= eventData.capacity) {
      return res.status(400).json({
        success: false,
        error: 'Event is at full capacity'
      });
    }
    
    // Create registration
    const newRegistration = {
      eventId,
      userId,
      userEmail,
      userName,
      status: 'confirmed',
      registeredAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Use a transaction to ensure consistency
    await db.runTransaction(async (transaction) => {
      // Add registration
      const regRef = db.collection('registrations').doc();
      transaction.set(regRef, newRegistration);
      
      // Update event attendee count
      const eventRef = db.collection('events').doc(eventId);
      transaction.update(eventRef, {
        attendeeCount: admin.firestore.FieldValue.increment(1)
      });
    });
    
    res.status(201).json({
      success: true,
      message: 'Successfully registered for event'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register for event' 
    });
  }
});

// ============= UTILITY ROUTES =============

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running with Firestore',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// GET /api/stats - Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    // Get event counts
    const eventsSnapshot = await db.collection('events').get();
    const approvedEventsSnapshot = await db.collection('events').where('status', '==', 'approved').get();
    const pendingEventsSnapshot = await db.collection('events').where('status', '==', 'pending').get();
    
    // Get registration count
    const registrationsSnapshot = await db.collection('registrations').get();
    
    // Get upcoming events
    const upcomingEventsSnapshot = await db.collection('events')
      .where('status', '==', 'approved')
      .where('startDate', '>', new Date().toISOString().split('T')[0])
      .get();
    
    const stats = {
      totalEvents: eventsSnapshot.size,
      approvedEvents: approvedEventsSnapshot.size,
      pendingEvents: pendingEventsSnapshot.size,
      totalRegistrations: registrationsSnapshot.size,
      upcomingEvents: upcomingEventsSnapshot.size
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics' 
    });
  }
});

// ============= ERROR HANDLING =============

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🔥 Connected to Firestore: davis-bulletin`);
});

module.exports = app;