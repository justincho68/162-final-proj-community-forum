// server/app.js - Fixed CORS configuration
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// FIXED CORS CONFIGURATION
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow both localhost variations
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory storage for now (replace with your database later)
let events = [];
let users = [];
let registrations = [];

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Add some sample data for testing
events.push({
  id: 'sample-1',
  title: 'Sample Event',
  description: 'This is a sample event for testing',
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
  imageUrl: 'https://via.placeholder.com/300x200/4a90e2/ffffff?text=Sample+Event',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// ============= EVENT ROUTES =============

// GET /api/events - Get all events (with optional filters)
app.get('/api/events', (req, res) => {
  try {
    console.log('GET /api/events called'); // Debug log
    const { category, search, status = 'approved' } = req.query;
    
    let filteredEvents = events.filter(event => event.status === status);
    
    // Filter by category
    if (category) {
      filteredEvents = filteredEvents.filter(event => 
        event.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Search in title and description
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by start date (newest first)
    filteredEvents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`Returning ${filteredEvents.length} events`); // Debug log
    
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
    console.log('GET /api/events/:id called with ID:', req.params.id); // Debug log
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
    console.log('POST /api/events called with data:', req.body); // Debug log
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
      status: 'approved', // Auto-approve for testing
      attendeeCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    
    console.log('Event created:', newEvent.id); // Debug log
    
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

// ============= UTILITY ROUTES =============

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  console.log('Health check called'); // Debug log
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============= ERROR HANDLING =============

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl); // Debug log
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
  console.log(`✅ CORS enabled for http://localhost:3000`);
  console.log(`📝 Sample event loaded for testing`);
});

module.exports = app;