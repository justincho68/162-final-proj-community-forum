import React from 'react';
import './NavBar.css';

function NavBar () {
    return (
        <div>
            <header className="header">
            <h1 className='title'>The Davis Bulletin</h1>
            <nav className='navigation'>
                <a href="/">Home</a>
                <a href="/Create">Create Event</a>
                <a href="/AccountPage">Account</a>
            </nav>
            </header>
        </div>
    )
}
export default NavBar;