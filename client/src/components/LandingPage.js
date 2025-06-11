import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './LandingPage.css';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import EventCreationPopup from './EventCreationPopup';
import { deleteEvent } from '../services/eventService';

function LandingPage() {
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deletingEventId, setDeletingEventId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceFilter, setPriceFilter] = useState(''); // 'free', 'paid', ''
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    
    const categories = [
        'Technology', 'Business', 'Education', 'Arts & Culture', 'Sports & Fitness',
        'Health & Wellness', 'Food & Drink', 'Music', 'Networking', 'Workshop',
        'Conference', 'Meetup', 'Social', 'Other'
    ];
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (location.pathname === '/create-event' && user) {
            setShowCreatePopup(true);
            window.history.replaceState(null, '', '/');
        }
    }, [location.pathname, user]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, 'events'));
                const eventsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
                        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt) || new Date()
                    };
                });
                
                // flter for approved events and sort by creation date (client-side)
                const approvedEvents = eventsData
                    .filter(event => event.status === 'approved' || event.status === 'pending' || !event.status)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                setEvents(approvedEvents);
                setFilteredEvents(approvedEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchEvents();
    }, []);

    //apply filters for any change
    useEffect(() => {
        let filtered = [...events];
        
        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(event =>
                event.title?.toLowerCase().includes(search) ||
                event.description?.toLowerCase().includes(search) ||
                (event.organizerName && event.organizerName.toLowerCase().includes(search)) ||
                (event.venue && event.venue.toLowerCase().includes(search)) ||
                (event.city && event.city.toLowerCase().includes(search))
            );
        }
        
        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter(event => event.category === selectedCategory);
        }
        
        // Apply price filter
        if (priceFilter === 'free') {
            filtered = filtered.filter(event => !event.price || event.price === 0);
        } else if (priceFilter === 'paid') {
            filtered = filtered.filter(event => event.price && event.price > 0);
        }
        
        setFilteredEvents(filtered);
    }, [events, searchTerm, selectedCategory, priceFilter]);

    // Format date for display
    const formatEventDate = (startDate, startTime) => {
        if (!startDate) return '';
        
        try {
            const date = new Date(startDate);
            const options = { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            };
            
            let formattedDate = date.toLocaleDateString('en-US', options);
            
            if (startTime) {
                const [hours, minutes] = startTime.split(':');
                const timeDate = new Date();
                timeDate.setHours(parseInt(hours), parseInt(minutes));
                const timeStr = timeDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });
                formattedDate += ` at ${timeStr}`;
            }
            
            return formattedDate;
        } catch (error) {
            console.error('Error formatting date:', error);
            return startDate;
        }
    };

    const handleDeleteEvent = async (eventId, eventTitle) => {
        setDeletingEventId(eventId);
        try {
          await deleteEvent(eventId);
          
          // Remove from state
          const updatedEvents = events.filter(e => e.id !== eventId);
          setEvents(updatedEvents);
          
          const updatedFiltered = filteredEvents.filter(e => e.id !== eventId);
          setFilteredEvents(updatedFiltered);
          
          alert(`Event "${eventTitle}" deleted successfully!`);
        } catch (error) {
          alert(`Failed to delete event: ${error.message}`);
        } finally {
          setDeletingEventId(null);
          setShowDeleteConfirm(null);
        }
      };

    const handleAccountClick = (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
        } else {
            navigate('/account');
        }
    };

    const handleCreateEventClick = (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login', { state: { redirectTo: '/' } });
        } else {
            setShowCreatePopup(true);
        }
    };

    const handleEventCreated = (newEvent) => {
        
        const updatedEvents = [newEvent, ...events];
        setEvents(updatedEvents);
        setShowCreatePopup(false);
        alert(`Event "${newEvent.title}" created successfully!`);
    };

    const handleClosePopup = () => {
        setShowCreatePopup(false);
        if (location.pathname === '/create-event') {
            navigate('/');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setPriceFilter('');
        setShowFilterDropdown(false);
    };

    // Check if any filters are active
    const hasActiveFilters = searchTerm || selectedCategory || priceFilter;

    // Image error handler
    const handleImageError = (e, event) => {
        console.error('Image failed to load for event:', event.title);
        console.error('Image URL was:', event.imageUrl);
        e.target.style.display = 'none';
        const placeholder = e.target.nextElementSibling;
        if (placeholder && placeholder.classList.contains('image-placeholder')) {
            placeholder.style.display = 'flex';
        }
    };

    // Image load success handler
    const handleImageLoad = (e, event) => {
        e.target.style.display = 'block';
        const placeholder = e.target.nextElementSibling;
        if (placeholder && placeholder.classList.contains('image-placeholder')) {
            placeholder.style.display = 'none';
        }
    };
    
    return (
        <div className="landing-page">
            <header className="header">
                <h1 className='title'>The Davis Bulletin</h1>
                <nav className='navigation'>
                    <Link to="/">Home</Link>
                    <a href="#" onClick={handleCreateEventClick}>Create Event</a>
                    <a href="/account">Edit Account</a>
                    {user ? (
                        <div className="user-menu">
                            <span>Welcome, {user.displayName || user.email}</span>
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <a href="#" onClick={handleAccountClick}>Login</a>
                    )}
                </nav>
            </header>

            {/* Enhanced Search and Filter Bar */}
            <div className='search-filter'>
                <div className='search-container'>
                    <input
                        type='text'
                        placeholder='Search events...'
                        className='search-bar'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            className='clear-search'
                            onClick={() => setSearchTerm('')}
                            title='Clear search'
                        >
                            ×
                        </button>
                    )}
                </div>
                
                <div className='filter-container'>
                    <button 
                        className={`filter-button ${showFilterDropdown || hasActiveFilters ? 'active' : ''}`}
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                        Filter {hasActiveFilters && `(${[selectedCategory, priceFilter].filter(Boolean).length})`}
                        <span className={`filter-arrow ${showFilterDropdown ? 'up' : 'down'}`}>▼</span>
                    </button>
                    
                    {showFilterDropdown && (
                        <div className='filter-dropdown'>
                            <div className='filter-section'>
                                <label>Category:</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className='filter-section'>
                                <label>Price:</label>
                                <select
                                    value={priceFilter}
                                    onChange={(e) => setPriceFilter(e.target.value)}
                                >
                                    <option value="">All Events</option>
                                    <option value="free">Free Events</option>
                                    <option value="paid">Paid Events</option>
                                </select>
                            </div>
                            
                            <div className='filter-actions'>
                                <button 
                                    className='clear-filters'
                                    onClick={clearFilters}
                                    disabled={!hasActiveFilters}
                                >
                                    Clear All
                                </button>
                                <button 
                                    className='apply-filters'
                                    onClick={() => setShowFilterDropdown(false)}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Summary */}
            {!loading && (
                <div className='results-summary'>
                    <span>
                        Showing {filteredEvents.length} of {events.length} events
                        {hasActiveFilters && (
                            <button className='clear-all-link' onClick={clearFilters}>
                                - Clear filters
                            </button>
                        )}
                    </span>
                </div>
            )}

            {/* Events Grid */}
            {loading ? (
                <div className='loading'>Loading events...</div>
            ) : (
                <div className='event-grid'>
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event, index) => {
                            const canDelete = user && user.uid === event.creatorId;
                            const isDeleting = deletingEventId === event.id;
                            
                            return (
                                <div key={event.id || index} className='event-card-wrapper'>
                                    {/* Delete confirmation modal */}
                                    {showDeleteConfirm === event.id && (
                                        <div className='delete-modal-overlay' onClick={() => setShowDeleteConfirm(null)}>
                                            <div className='delete-modal' onClick={(e) => e.stopPropagation()}>
                                                <h3>Delete Event?</h3>
                                                <p>Are you sure you want to delete "{event.title}"?</p>
                                                <p className='delete-warning'>This action cannot be undone.</p>
                                                
                                                <div className='delete-modal-actions'>
                                                    <button 
                                                        onClick={() => setShowDeleteConfirm(null)}
                                                        className='cancel-delete-btn'
                                                        disabled={isDeleting}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteEvent(event.id, event.title)}
                                                        className='confirm-delete-btn'
                                                        disabled={isDeleting}
                                                    >
                                                        {isDeleting ? 'Deleting...' : 'Delete Event'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <Link 
                                        to={`/FullEventInfo/${event.title}`} 
                                        className='event-link'
                                        state={{ event }}
                                    >
                                        <div className='event-card'>
                                            {/* Delete button - only show for event owner */}
                                            {canDelete && (
                                                <button 
                                                    className='delete-btn'
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setShowDeleteConfirm(event.id);
                                                    }}
                                                    disabled={isDeleting}
                                                    title='Delete event'
                                                >
                                                    🗑️
                                                </button>
                                            )}

                                            <h3 className='event-title'>{event.title}</h3>

                                            <div className='event-image'>
                                                {(event.imageUrl || event.image) ? (
                                                    <>
                                                        <img 
                                                            src={event.imageUrl || event.image} 
                                                            alt={event.title}
                                                            onError={(e) => handleImageError(e, event)}
                                                            onLoad={(e) => handleImageLoad(e, event)}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <div 
                                                            className='image-placeholder'
                                                            style={{ display: 'flex' }}
                                                        >
                                                            📷
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className='image-placeholder'>
                                                        📷
                                                    </div>
                                                )}
                                            </div>

                                            <div className='event-info'>
                                                <div className='event-cost-date'>
                                                    <span className='event-cost'>
                                                        {event.price > 0 ? `$${event.price}` : "Free"}
                                                    </span>
                                                    <span className='event-date'>
                                                        {formatEventDate(event.startDate, event.startTime)}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className='event-description'>{event.description}</p>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })
                    ) : (
                        <div className='no-events'>
                            {hasActiveFilters ? (
                                <>
                                    <p>No events match your current filters.</p>
                                    <button onClick={clearFilters} className='btn-primary'>
                                        Clear Filters
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p>No events yet. Create the first one!</p>
                                    {user && (
                                        <button onClick={handleCreateEventClick} className='btn-primary'>
                                            Create First Event
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            <EventCreationPopup
                isOpen={showCreatePopup}
                onClose={handleClosePopup}
                onSubmit={handleEventCreated}
            />
        </div>
    )
}

export default LandingPage;