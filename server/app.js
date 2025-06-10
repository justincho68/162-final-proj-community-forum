const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//REPLACE LATER WITH ACTUAL DATABASE! !!!
let events = [];
let users = [];
let registrations = [];

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

//EVENT ROUTES

// GET /api/events - Get all events (with optional filters)
app.get('/api/events', (req, res) => {
  try {
    const { category, search, status = 'approved' } = req.query;
    
    let filteredEvents = events.filter(event => event.status === status);
    
    //filter events by category
    if (category) {
      filteredEvents = filteredEvents.filter(event => 
        event.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    //search using title and description
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by start date (newest first)
    filteredEvents.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    
    res.json({
      success: true,
      events: filteredEvents,
      count: filteredEvents.length
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
app.get('/api/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const event = events.find(e => e.id === id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Increment view count
    event.viewCount = (event.viewCount || 0) + 1;
    
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
app.post('/api/events', (req, res) => {
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
    
    // Create new event
    const newEvent = {
      id: generateId(),
      ...eventData,
      status: 'pending', // Default status, admin can approve later
      attendeeCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
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
app.put('/api/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const eventIndex = events.findIndex(e => e.id === id);
    
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Update event
    events[eventIndex] = {
      ...events[eventIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event: events[eventIndex]
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
app.delete('/api/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const eventIndex = events.findIndex(e => e.id === id);
    
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    events.splice(eventIndex, 1);
    
    // Also remove related registrations
    registrations = registrations.filter(reg => reg.eventId !== id);
    
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

// ============= USER ROUTES =============

// GET /api/users - Get all users (admin only)
app.get('/api/users', (req, res) => {
  try {
    res.json({
      success: true,
      users: users.map(user => ({ ...user, password: undefined })) // Remove passwords
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users' 
    });
  }
});

// POST /api/users - Create new user
app.post('/api/users', (req, res) => {
  try {
    const userData = req.body;
    
    // Basic validation
    if (!userData.email || !userData.name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required'
      });
    }
    
    // Check if user exists
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    const newUser = {
      id: generateId(),
      ...userData,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { ...newUser, password: undefined }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user' 
    });
  }
});

// GET /api/users/:id - Get user by ID
app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: { ...user, password: undefined }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user' 
    });
  }
});

// ============= REGISTRATION ROUTES =============

// GET /api/registrations - Get all registrations
app.get('/api/registrations', (req, res) => {
  try {
    const { eventId, userId } = req.query;
    
    let filteredRegistrations = registrations;
    
    if (eventId) {
      filteredRegistrations = filteredRegistrations.filter(reg => reg.eventId === eventId);
    }
    
    if (userId) {
      filteredRegistrations = filteredRegistrations.filter(reg => reg.userId === userId);
    }
    
    res.json({
      success: true,
      registrations: filteredRegistrations
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
app.post('/api/registrations', (req, res) => {
  try {
    const { eventId, userId, userEmail, userName } = req.body;
    
    if (!eventId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Event ID and User ID are required'
      });
    }
    
    // Check if event exists
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Check if already registered
    const existingRegistration = registrations.find(reg => 
      reg.eventId === eventId && reg.userId === userId
    );
    
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this event'
      });
    }
    
    // Check capacity
    if (event.capacity && event.attendeeCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        error: 'Event is at full capacity'
      });
    }
    
    const newRegistration = {
      id: generateId(),
      eventId,
      userId,
      userEmail,
      userName,
      status: 'confirmed',
      registeredAt: new Date().toISOString()
    };
    
    registrations.push(newRegistration);
    
    // Update event attendee count
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      events[eventIndex].attendeeCount = (events[eventIndex].attendeeCount || 0) + 1;
    }
    
    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      registration: newRegistration
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register for event' 
    });
  }
});

// DELETE /api/registrations/:id - Cancel registration
app.delete('/api/registrations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const regIndex = registrations.findIndex(reg => reg.id === id);
    
    if (regIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }
    
    const registration = registrations[regIndex];
    registrations.splice(regIndex, 1);
    
    // Update event attendee count
    const eventIndex = events.findIndex(e => e.id === registration.eventId);
    if (eventIndex !== -1) {
      events[eventIndex].attendeeCount = Math.max(0, (events[eventIndex].attendeeCount || 1) - 1);
    }
    
    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel registration' 
    });
  }
});

// ============= UTILITY ROUTES =============

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// GET /api/stats - Get basic statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      totalEvents: events.length,
      approvedEvents: events.filter(e => e.status === 'approved').length,
      pendingEvents: events.filter(e => e.status === 'pending').length,
      totalUsers: users.length,
      totalRegistrations: registrations.length,
      upcomingEvents: events.filter(e => 
        e.status === 'approved' && new Date(e.startDate) > new Date()
      ).length
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
  
  // Add some sample data for testing
  if (process.env.NODE_ENV !== 'production') {
    // Sample events
    events.push({
      id: 'sample-1',
      title: 'React Workshop',
      description: 'Learn the basics of React development',
      category: 'Technology',
      startDate: '2024-12-15',
      startTime: '10:00',
      endDate: '2024-12-15',
      endTime: '16:00',
      locationType: 'physical',
      venue: 'Tech Hub',
      city: 'San Francisco',
      capacity: 50,
      price: 0,
      organizerName: 'John Doe',
      organizerEmail: 'john@example.com',
      requiresRegistration: true,
      status: 'approved',
      attendeeCount: 5,
      viewCount: 23,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('📝 Sample data loaded for development');
  }
});

module.exports = app;