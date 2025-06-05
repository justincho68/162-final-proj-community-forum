import React from 'react';
import './EventPage.css';

const dummyEvent = {
        title: 'Davis Farmers Market',
        image: '/images/davis_farmers_market.jpg',
        paid: false,
        date: '2025-06-07',
        description: 'Come enjoy fresh produce and local crafts every Saturday at Central Park!'
      };

function EventPage(){
    return (
        <div className='event-page'>
            <div className='arrow'>&larr; Go Back</div>
            <div className='event-container'>
                {dummyEvent.image ? (
                                <img src ={dummyEvent.image} alt={dummyEvent.title} />
                            ) : (
                                <div className='image-placeholder'>[Image]</div>
                            )}

                <div className='event-content'>
                    <h1 id='event-title'>{dummyEvent.title}</h1>
                    {dummyEvent.paid ? (
                                        <span id='paid'>Paid</span>
                                    ) : (
                                        <span id='free'>Free</span>
                                    )}
                    
                    <h1 id='event-date'>Date: {dummyEvent.date}</h1>
                    <p>Description:<br></br><br></br>{dummyEvent.description}</p>
                </div>
            </div>
        </div>
    )
}

export default EventPage;