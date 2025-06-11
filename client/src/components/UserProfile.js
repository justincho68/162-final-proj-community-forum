import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './UserProfile.css';

function UserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null);
    const [userEvents, setUserEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!userId) {
                setError('No user ID provided');
                setLoading(false);
                return;
            }

            // Check if user is logged in
            if (!currentUser) {
                setError('You must be logged in to view user profiles');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Try the 'profiles' collection first (based on your Firestore rules)
                let userDoc = await getDoc(doc(db, 'profiles', userId));
                
                if (!userDoc.exists()) {
                    // Try 'users' collection as fallback
                    userDoc = await getDoc(doc(db, 'users', userId));
                    
                    if (!userDoc.exists()) {
                        setError('User not found in either profiles or users collection');
                        setLoading(false);
                        return;
                    }
                }
                
                const userData = userDoc.data();
                
                setUserProfile({
                    id: userDoc.id,
                    name: userData.name || 'Anonymous User',
                    email: userData.email || '',
                    biography: userData.biography || '',
                    organization: userData.organization || '',
                    profileImage: userData.profileImage || '/images/default.png'
                });

                const eventsQuery = query(
                    collection(db, 'events'),
                    where('creatorId', '==', userId)
                );
                
                const eventsSnapshot = await getDocs(eventsQuery);
                
                const events = eventsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date()
                    };
                });

                //filter for public events and sort
                const publicEvents = events
                    .filter(event => event.status === 'approved' || event.status === 'pending' || !event.status)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                setUserEvents(publicEvents);

            } catch (error) {
                console.error('Error fetching user profile:', error);
                if (error.code === 'permission-denied') {
                    setError('You don\'t have permission to view this profile. Please make sure you\'re logged in.');
                } else {
                    setError('Failed to load user profile: ' + error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser !== null) { //wait for auth state to be determined
            fetchUserProfile();
        }
    }, [userId, currentUser]);

    const handleBackClick = () => {
        navigate(-1); //go back to previous page
    };

    const handleEventClick = (event) => {
        navigate(`/FullEventInfo/${event.title}`, { state: { event } });
    };

    const formatDate = (date) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return '';
        }
    };

    if (loading) {
        return (
            <div className="user-profile-page">
                <div className="loading">Loading profile...</div>
            </div>
        );
    }

    if (error || !userProfile) {
        return (
            <div className="user-profile-page">
                <div className="error-container">
                    <h2>Profile Not Found</h2>
                    <p>{error || 'The user profile you\'re looking for could not be found.'}</p>
                    <button onClick={handleBackClick} className="btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-profile-page">
            {/* Header with back button */}
            <div className="profile-header">
                <button onClick={handleBackClick} className="back-button">
                    ← Back
                </button>
            </div>

            <div className="profile-container">
                {/* Profile Info Section */}
                <div className="profile-info-section">
                    <div className="profile-details">
                        <h1 className="profile-name">{userProfile.name}</h1>
                        
                        {userProfile.organization && (
                            <p className="profile-organization">{userProfile.organization}</p>
                        )}
                        
                        {userProfile.biography && (
                            <div className="profile-biography">
                                <h3>About</h3>
                                <p>{userProfile.biography}</p>
                            </div>
                        )}
                        
                        <div className="profile-contact">
                            <h3>Contact</h3>
                            <a 
                                href={`mailto:${userProfile.email}`}
                                className="contact-email"
                            >
                                {userProfile.email}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Events Section */}
                <div className="profile-events-section">
                    <h2>Events by {userProfile.name}</h2>
                    
                    {userEvents.length > 0 ? (
                        <div className="events-grid">
                            {userEvents.map((event) => (
                                <div 
                                    key={event.id} 
                                    className="event-card-small"
                                    onClick={() => handleEventClick(event)}
                                >
                                    <div className="event-image-small">
                                        {event.imageUrl ? (
                                            <img 
                                                src={event.imageUrl} 
                                                alt={event.title}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="image-placeholder-small"
                                            style={{ display: event.imageUrl ? 'none' : 'flex' }}
                                        >
                                            📷
                                        </div>
                                    </div>
                                    
                                    <div className="event-info-small">
                                        <h4 className="event-title-small">{event.title}</h4>
                                        <div className="event-meta-small">
                                            <span className="event-date-small">
                                                {formatDate(event.startDate)}
                                            </span>
                                            <span className="event-price-small">
                                                {event.price > 0 ? `$${event.price}` : 'Free'}
                                            </span>
                                        </div>
                                        <p className="event-description-small">
                                            {event.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-events">
                            <p>{userProfile.name} hasn't created any public events yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;