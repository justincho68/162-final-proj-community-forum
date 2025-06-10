// client/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

//EVENT API

export const eventAPI = {
  // Get all events with optional filters
  getEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint);
  },

  // Get single event by ID
  getEvent: async (eventId) => {
    return apiRequest(`/events/${eventId}`);
  },

  // Create new event
  createEvent: async (eventData) => {
    return apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  // Update event
  updateEvent: async (eventId, eventData) => {
    return apiRequest(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  },

  // Delete event
  deleteEvent: async (eventId) => {
    return apiRequest(`/events/${eventId}`, {
      method: 'DELETE',
    });
  },

  // Get event categories
  getCategories: async () => {
    return apiRequest('/events/categories');
  },
};

// ============= USER API =============

export const userAPI = {
  // Get all users
  getUsers: async () => {
    return apiRequest('/users');
  },

  // Get user by ID
  getUser: async (userId) => {
    return apiRequest(`/users/${userId}`);
  },

  // Create new user
  createUser: async (userData) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// ============= REGISTRATION API =============

export const registrationAPI = {
  // Get registrations
  getRegistrations: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.eventId) params.append('eventId', filters.eventId);
    if (filters.userId) params.append('userId', filters.userId);
    
    const queryString = params.toString();
    const endpoint = `/registrations${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint);
  },

  // Register for event
  registerForEvent: async (registrationData) => {
    return apiRequest('/registrations', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  },

  // Cancel registration
  cancelRegistration: async (registrationId) => {
    return apiRequest(`/registrations/${registrationId}`, {
      method: 'DELETE',
    });
  },
};

//utility API

export const utilityAPI = {
  // Health check
  healthCheck: async () => {
    return apiRequest('/health');
  },

  // Get statistics
  getStats: async () => {
    return apiRequest('/stats');
  },
};

//event creation calls put event to the database

export const createEventWithAPI = async (eventData) => {
  try {
    const response = await eventAPI.createEvent(eventData);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to create event');
  }
};
