import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function LandingPage() {
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            const querySnapshot = await getDocs(collection(db, 'events'));
            const eventsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
            }));
            setEvents(eventsData);
        };
        fetchEvents();
    }, []);

    const handleAccountClick = (e) => {
        e.preventDefault();
        if (!user) {
            window.location.href = '/login.html';
        }
    };

    const handleCreateEventClick = (e) => {
        e.preventDefault();
        if (!user) {
            window.location.href = '/login.html';
        }
    };
    
    return (
        <div className="landing-page">
            <header className="header">
            <h1 className='title'>The Davis Bulletin</h1>
            <nav className='navigation'>
                <a href="#">Home</a>
                <a href="#" onClick={handleCreateEventClick}>Create Event</a>
                <a href="#" onClick={handleAccountClick}>Account</a>
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
                {events.map((event, index)=> (
                    <Link to ={`/FullEventInfo/${event.title}`} className='event-link'
                        state={{event}} key = {index}>
                        <div className='event-card'>
                            <h3 className='event-title>'>{event.title}</h3>

                            <div className='event-image'>
                                {event.image ? (
                                    <img src ={event.image} alt={event.title} />
                                ) : (
                                    <div className='image-placeholder'>[Image]</div>
                                )}
                            </div>

                            <div className='event-info'>
                                <span className='event-cost'>{event.paid ? "Paid" : "Free"}</span>
                                <span className='event-date'>{event.date}</span>
                            </div>

                            <p className='event-description'>{event.description}</p>
                        </div>
                    </Link>
                  ))}
            </div>

        </div>
    )
}

export default LandingPage;
