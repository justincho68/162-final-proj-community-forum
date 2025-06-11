import React, {useState, useEffect} from 'react';
import './NavBar.css';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

function NavBar () {
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
        <div>
            <header className="header">
            <h1 className='title'>The Davis Bulletin</h1>
            <nav className='navigation'>
                <a href="#">Home</a>
                <a href="#" onClick={handleCreateEventClick}>Create Event</a>
                <a href="#" onClick={handleAccountClick}>Account</a>
            </nav>
            </header>
        </div>
    )
}
export default NavBar;