import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const dummyEvents = [
    {
        title: 'Davis Farmers Market',
        image: '/images/davis_farmers_market.jpg',
        paid: false,
        date: '2025-06-07',
        description: 'Come enjoy fresh produce and local crafts every Saturday at Central Park!'
      },
      {
        title: 'Community Garage Sale',
        image: '',
        paid: false,
        date: '2025-06-10',
        description: 'Clean out your closet and join us for a giant neighborhood garage sale.'
      },
      {
        title: 'Bake Sale for Charity',
        image: '/images/bake_sale.jpg',
        paid: true,
        date: '2025-06-12',
        description: 'Delicious baked goods with all proceeds going to local shelters.'
      },
];


function LandingPage() {
    const [user, setUser] = useState(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
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
                {dummyEvents.map((event, index)=> (
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
