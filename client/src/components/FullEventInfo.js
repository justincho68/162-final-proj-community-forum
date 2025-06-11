// FullEventInfo.js - Enhanced event detail page
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './FullEventInfo.css';

function FullEventInfo() {
    const location = useLocation();
    const navigate = useNavigate();
    const { eventTitle } = useParams();
    const [user, setUser] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Get event data from navigation state or fallback
    const event = location.state?.event;
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    // If no event data, redirect back to home
    if (!event) {
        return (
            <div className="full-event-page">
                <div className="event-not-found">
                    <h2>Event not found</h2>
                    <p>The event you're looking for could not be found.</p>
                    <button onClick={() => navigate('/')} className="btn-primary">
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    // Format date for display
    const formatEventDate = (startDate, startTime, endDate, endTime) => {
        if (!startDate) return '';
        
        try {
            const start = new Date(startDate);
            const startOptions = { 
                weekday: 'long',
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
            };
            
            let formattedDate = start.toLocaleDateString('en-US', startOptions);
            
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
                
                // Add end time if provided
                if (endTime) {
                    const [endHours, endMinutes] = endTime.split(':');
                    const endTimeDate = new Date();
                    endTimeDate.setHours(parseInt(endHours), parseInt(endMinutes));
                    const endTimeStr = endTimeDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                    });
                    formattedDate += ` - ${endTimeStr}`;
                }
            }
            
            return formattedDate;
        } catch (error) {
            console.error('Error formatting date:', error);
            return startDate;
        }
    };

    const handleImageError = (e) => {
        console.error('Image failed to load for event:', event.title);
        e.target.style.display = 'none';
        setImageLoaded(false);
    };

    const handleImageLoad = (e) => {
        console.log('Image loaded successfully for event:', event.title);
        setImageLoaded(true);
    };

    const handleBackClick = () => {
        navigate('/');
    };

    const handleContactOrganizer = () => {
        if (event.organizerEmail) {
            window.location.href = `mailto:${event.organizerEmail}?subject=Question about ${event.title}`;
        } else {
            alert('Organizer contact information not available.');
        }
    };

    // Debug: Log event data to see what fields are available
    console.log('Event data in FullEventInfo:', event);
    console.log('Event creatorId:', event.creatorId);
    console.log('Event organizerName:', event.organizerName);

    return (
        <div className="full-event-page">
            {/* Header with back button */}
            <div className="event-header">
                <button onClick={handleBackClick} className="back-button">
                    ← Back to Events
                </button>
            </div>

            <div className="event-detail-container">
                {/* Event Image Section */}
                <div className="event-image-section">
                    {(event.imageUrl || event.image) ? (
                        <div className="event-image-container">
                            <img 
                                src={event.imageUrl || event.image} 
                                alt={event.title}
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                                className="event-detail-image"
                            />
                            {!imageLoaded && (
                                <div className="image-placeholder-large">
                                    <span className="placeholder-icon">📷</span>
                                    <span className="placeholder-text">Loading image...</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="image-placeholder-large">
                            <span className="placeholder-icon">📷</span>
                            <span className="placeholder-text">No image available</span>
                        </div>
                    )}
                </div>

                {/* Event Details Section */}
                <div className="event-details-section">
                    <div className="event-main-info">
                        <h1 className="event-detail-title">{event.title}</h1>
                        
                        <div className="event-meta">
                            <div className="meta-item">
                                <span className="meta-label">📅 Date & Time:</span>
                                <span className="meta-value">
                                    {formatEventDate(event.startDate, event.startTime, event.endDate, event.endTime)}
                                </span>
                            </div>

                            {(event.venue || event.city) && (
                                <div className="meta-item">
                                    <span className="meta-label">📍 Location:</span>
                                    <span className="meta-value">
                                        {event.venue && event.city ? `${event.venue}, ${event.city}` : 
                                         event.venue || event.city}
                                    </span>
                                </div>
                            )}

                            <div className="meta-item">
                                <span className="meta-label">💰 Price:</span>
                                <span className="meta-value price">
                                    {event.price > 0 ? `$${event.price}` : "Free"}
                                </span>
                            </div>

                            {event.category && (
                                <div className="meta-item">
                                    <span className="meta-label">🏷️ Category:</span>
                                    <span className="meta-value category">{event.category}</span>
                                </div>
                            )}

                            {event.organizerName && (
                                <div className="meta-item">
                                    <span className="meta-label">👤 Organizer:</span>
                                    <span className="meta-value">{event.organizerName}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Event Description */}
                    <div className="event-description-section">
                        <h2>About This Event</h2>
                        <div className="event-description-content">
                            {event.description ? (
                                event.description.split('\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))
                            ) : (
                                <p>No description available.</p>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="contact-info">
                        <div className="contact-line">
                            <strong>Contact Organizer:</strong>
                            <span className="contact-details">
                                {event.organizerName && (event.creatorId || event.userId || event.uid) && (
                                    <button 
                                        className="organizer-name-link"
                                        onClick={() => {
                                            const userId = event.creatorId || event.userId || event.uid;
                                            console.log('Navigating to profile with ID:', userId);
                                            navigate(`/profile/${userId}`);
                                        }}
                                    >
                                        {event.organizerName}
                                    </button>
                                )}
                                {event.organizerName && !(event.creatorId || event.userId || event.uid) && (
                                    <span className="organizer-name">{event.organizerName}</span>
                                )}
                                {event.organizerEmail && (
                                    <a 
                                        href={`mailto:${event.organizerEmail}`}
                                        className="organizer-email"
                                    >
                                        {event.organizerEmail}
                                    </a>
                                )}
                                {!event.organizerEmail && !event.organizerName && (
                                    <span className="no-contact">Contact information not available</span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Additional Event Info */}
                    {(event.tags || event.capacity || event.ageRestriction) && (
                        <div className="additional-info">
                            <h3>Additional Information</h3>
                            
                            {event.capacity && (
                                <div className="info-item">
                                    <strong>Capacity:</strong> {event.capacity} people
                                </div>
                            )}
                            
                            {event.ageRestriction && (
                                <div className="info-item">
                                    <strong>Age Restriction:</strong> {event.ageRestriction}
                                </div>
                            )}
                            
                            {event.tags && event.tags.length > 0 && (
                                <div className="info-item">
                                    <strong>Tags:</strong>
                                    <div className="event-tags">
                                        {event.tags.map((tag, index) => (
                                            <span key={index} className="tag">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FullEventInfo;