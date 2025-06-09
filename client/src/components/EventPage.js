import React from 'react';
import './EventPage.css';
import { Link, useLocation, useParams } from 'react-router-dom';


function EventPage(){
    const eventInfo = useLocation();
    const event = eventInfo.state?.event;
    
    return (
        <div className='event-page'>
            <Link to= "/">
                 <div className='arrow'>&larr; Go Back</div>
           </Link>
            <div className='event-container'>
                {event.image ? (
                                <img src ={event.image} alt={event.title} />
                            ) : (
                                <div className='image-placeholder'>[Image]</div>
                            )}

                <div className='event-content'>
                    <h1 id='event-title'>{event.title}</h1>
                    {event.paid ? (
                                        <span id='paid'>Paid</span>
                                    ) : (
                                        <span id='free'>Free</span>
                                    )}
                    
                    <h1 id='event-date'>Date: {event.date}</h1>
                    <p>Description:<br></br><br></br>{event.description}</p>
                </div>
            </div>
        </div>
    )
}

export default EventPage;