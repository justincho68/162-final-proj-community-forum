// LandingPage.js - Updated with image debugging
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './LandingPage.css';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import EventCreationPopup from './EventCreationPopup';

function LandingPage() {
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    
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
                const querySnapshot = await getDocs(collection(db, 'events'));
                const eventsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log('Event data:', data); // Debug log
                    return {
                        id: doc.id,
                        ...data
                    };
                });
                console.log('All events:', eventsData); // Debug log
                setEvents(eventsData);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };
        fetchEvents();
    }, []);

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
            navigate('/login', { state: { redirectTo: '/create-event' } });
        } else {
            setShowCreatePopup(true);
        }
    };

    const handleEventCreated = (newEvent) => {
        console.log('Event created:', newEvent); // Debug log
        console.log('New event imageUrl:', newEvent.imageUrl); // Debug log
        
        // Add the new event to the beginning of the list
        setEvents(prevEvents => [newEvent, ...prevEvents]);
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
            console.log('User logged out');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Function to handle image load errors
    const handleImageError = (e, event) => {
        console.error('Image failed to load for event:', event.title, 'URL:', event.imageUrl);
        e.target.style.display = 'none';
        const placeholder = e.target.nextElementSibling;
        if (placeholder && placeholder.classList.contains('image-placeholder')) {
            placeholder.style.display = 'flex';
        }
    };

    const handleImageLoad = (e, event) => {
        console.log('Image loaded successfully for event:', event.title);
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

            <div className='search-filter'>
                <input
                    type='text'
                    placeholder='Search...'
                    className='search-bar'
                />
                <button className='filter-button'>Filter</button>
            </div>

            <div className='event-grid'>
                {events.map((event, index) => {
                    // Debug log for each event
                    console.log(`Event ${index}:`, event.title, 'has image:', !!event.imageUrl);
                    
                    return (
                        <Link 
                            to={`/FullEventInfo/${event.title}`} 
                            className='event-link'
                            state={{ event }} 
                            key={event.id || index}
                        >
                            <div className='event-card'>
                                <h3 className='event-title'>{event.title}</h3>

                                <div className='event-image'>
                                    {event.imageUrl ? (
                                        <>
                                            <img 
                                                src={event.imageUrl} 
                                                alt={event.title}
                                                onError={(e) => handleImageError(e, event)}
                                                onLoad={(e) => handleImageLoad(e, event)}
                                                style={{ display: 'none' }} // Start hidden, show on successful load
                                            />
                                            <div 
                                                className='image-placeholder'
                                                style={{ display: 'flex' }} // Start visible, hide on successful image load
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
                    );
                })}
            </div>

            {events.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No events yet. Create the first one!</p>
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