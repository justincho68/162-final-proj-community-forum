
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reveal } from 'semantic-ui-react';
import { useAuth } from '../contexts/AuthContext';
import { createEvent, getEventCategories } from '../services/eventService';

const EventForm = ({ editEvent = null }) => {
    const { currentUser } = useAuth(); //other way that firebase is initialized
    const navigate = useNavigate(); // navigation function to change the route ie navigate('/events)
    const isEditing = !!editEvent; //true if editEvent is any truthy value like an object

    //react state for the form - information comes from existing event if editing an event
    //defaults to blank data as a fallback if creating a new event
    const [formData, setFormData] = useState({
        //basic information
        title: editEvent?.title || '',
        description: editEvent?.description || '',
        category: editEvent?.category || '',

        //date and time of event
        startData: editEvent?.startDate || '',
        endDate: editEvent?.endDate || '',
        startTime: editEvent?.startTime || '',
        endTime: editEvent?.endTime || '',

        //Location
        locationType: editEvent?.location?.type || 'physical',
        venue: editEvent?.location?.venue || '',
        address: editEvent?.location?.address || '',
        city: editEvent?.location?.city || '',

        //event details
        capacity: editEvent?.capacity || '',
        tags: editEvent?.tags?.join(', ') || '',
        imageUrl: editEvent?.imageUrl || '',
        website: editEvent?.wensote || '',

        //event registration
        requiresRegistration: editEvent?.requiresRegistration || false,
        registrationDeadline: editEvent?.registrationDeadline || '',

        //oragnizer info
        organizerName: editEvent?.organize?.name || currentUser?.displayName || '',
        organizerEmail: editEvent?.organizer?.email || currentUser?.email || '',
        organizerPhone: editEvent?.organizer?.phone || '',
        organization: editEvent?.organizer?.organization || '',

        //settings
        isPublic: editEvent?.isPublic !== false
    });

    //initalize state
    const [loading, setLoading] = useState(false); //not loading by default
    const [error, setError] = useState(''); //no error by default
    const [currentStep, setCurrentStep] = useState(1); //which part of the form the user is on, default to 1

    const categories = getEventCategories();
    //controlled form input - sync with state
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        //updating form data state
        setFormData(prev => ({
            //previous state object
            ...prev,
            //only change the value that has changed
            [name]: type === 'checkbox' ? checked: value
        }));
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                //first step basic info - ensure that all three fields of title, description, category are truthy
                return formData.title && formData.description && formData.category;
            case 2:
                //second step time - ensure that there is proper start date and time
                return formData.startDate && formData.startTime;
            case 3:
                //third step - validate location based on event being physical,virtual,hybrid
                if (formData.locationType === 'physical') {
                    return formData.venue && formData.city;
                } else if (formData.locationType === 'virtual') {
                    return formData.virtualLink && formData.virtualPlatform;
                } else {
                    return formData.venue && formData.city && formData.virtualLink;
                }
            case 4:
                //fourth step - return the name of organize and their email
                return formData.organizerName && formData.organizerEmail;
            default:
                return true;
        }
    };
    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 5));
        } else {
            setError('Please fill in all required fields before continuing.');
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev-1,1));
        setError('');
    };

    //async function when user submits the form
    const handleSubmit = async (e) => {
        //prevent default behavior of reloading the website when form is submitted
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            //ensure that all of the steps are valid before submit can be done properly
            for (let i = 1; i <= 4; i++) {
                if (!validateStep(i)) {
                    throw new Error(`Please complete step ${i} before submitting.`);
                }
            }
            //clean form data to send to backend
            const eventData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
            };
            //create the event in the database with createEvent
            const newEvent = await createEvent(eventData);
            //send user to the newly created event
            navigate(`/events/${newEvent.id}`, {
                state: {message: 'Event submited successfuly!'}
            });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    const renderStepContent = () => {
        //render the correct form based on which step the user is on
        switch (currentStep) {
            case 1:
                return (
                    <div className='form-step'>
                        <h3>Basic Information</h3>
                        <div className='form-group'>
                            <label htmlFor='title'>Event Title</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter event title"
                                required
                            />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='category'>Category *</label>
                            <select
                                id='category'
                                name='category'
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className='form-group'>
                            <label htmlFor='description'>Description *</label>
                            <textarea
                                id='description'
                                name='description'
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your event"
                                rpows="5"
                                required
                            />
                        </div>
                        <div className='form-group'>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="networking, tech, startup"
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className='form-step'>
                        <h3>Date & Time</h3>
                        <div className='form-row'>
                            <div className='form-group'>
                                <label htmlFor='Start Date'>Start Date *</label>
                                <input
                                    type="date"
                                    id='startDate'
                                    name='startDate'
                                    value={formData.startdate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <label htmlFor='startTime'>Start Time *</label>
                                <input
                                    type="time"
                                    id="startTime"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className='form-row'>
                            <div className='form-group'>
                                <label htmlFor='endDate'>End Date</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name='endDate'
                                    value={formData.endDate}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className='form-group'>
                                <label htmlFor='endTime'>End Time</label>
                                <input
                                    type="time"
                                    id='endTime'
                                    name='endtime'
                                    value={formData.endTime}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                );
                case 3:
                    return (
                        <div className='form-step'>
                            <h3>Location</h3>
                                <div className='form-group'>
                                    <label htmlFor='venue'>Venue Name *</label>
                                    <input
                                        type='text'
                                        id='venue'
                                        name='venue'
                                        value={formData.venue}
                                        onChange={handleChange}
                                        placeholder='Conference Center, Park, etc.'
                                        required
                                    />
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='address'>Address</label>
                                    <input
                                        type="text"
                                        id='address'
                                        name='address'
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder='Street Address'
                                    />
                                </div>
                                <div className='form-row'>
                                    <div className='form-group'>
                                        <label htmlFor='city'>City *</label>
                                        <input
                                            type='text'
                                            id='city'
                                            name='city'
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                        </div>
                    );
                  case 4:
                    return (
                        <div className='form-step'>
                            <h3>Event Details</h3>
                            <div className='form-row'>
                                <div className='form-group'>
                                    <label htmlFor='capacity'>Capacity</label>
                                    <input
                                        type='number'
                                        id='capacity'
                                        name='capacity'
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        placeholder='Maximum attendees'
                                        min="1"
                                    />
                                </div>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='imageUrl'>Event Image URL</label>
                                <input
                                    type="url"
                                    id="imageUrl"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div className='form-group'>
                                <label className='checkbox-label'>
                                    <input
                                        type='checkbox'
                                        name='requiresRegistration'
                                        checked={formData.requiresRegistration}
                                        onChange={handleChange}
                                    />
                                    Requires Registration
                                </label>
                            </div>
                            {formData.requiresRegistration && (
                                <div className="form-group">
                                <label htmlFor="registrationDeadline">Registration Deadline</label>
                                <input
                                  type="date"
                                  id="registrationDeadline"
                                  name="registrationDeadline"
                                  value={formData.registrationDeadline}
                                  onChange={handleChange}
                                />
                              </div>
                            )}
                        </div>

                    );
                case 5:
                    return(
                        <div className='form-step'>
                            <h3>Organizer Information</h3>
                            <div className='form-group'>
                                <label htmlFor='organizerName'>Your Name *</label>
                                <input
                                    type="text"
                                    id="organizerName"
                                    name="organizerName"
                                    value={formData.organizerName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <label htmlFor='organizerEmail'>Contact Email *</label>
                                <input
                                    type='email'
                                    id='organizerEmail'
                                    name='organizerEmail'
                                    value={formData.organizerEmail}
                                    onChange={handleChange}
                                    required    
                                />
                            </div>
                            <div className='form-group'>
                                <label htmlFor='organizerPhone'>Phone Number</label>
                                <input
                                    type='tel'
                                    id='organizerPhone'
                                    name='organizerPhone'
                                    value={formData.organizerPhone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    );
                default:
                    return null;
        }
    };
    return (
        <div className='event-form-container'>
            <div className='form-header'>
                <h2>{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
                <div className='progress-indicator'>
                    {[1,2,3,4,5].map(step=>(
                        <div
                            key={step}
                            className={`progress-step ${step <= currentStep ? 'active' : ''}`}
                        >
                            {step}
                        </div>
                    ))}
                </div>
            </div>
            {error && <div className='error-message'>{error}</div>}
            <form onSubmit={handleSubmit} className='event-form'>
                {renderStepContent()}
                <div className='form-navigation'>
                    {currentStep > 1 && (
                        <button
                            type='button'
                            onClick={prevStep}
                            className='btn-secondary'
                        >
                            Previous
                        </button>
                    )}
                    {currentStep < 5 ? (
                        <button
                            type='button'
                            onClick={nextStep}
                            className='btn-primary'
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type='submit'
                            disabled={loading}
                            className='btn-primary'
                        >
                            {loading ? 'Submitting...' : (isEditing ? 'Update Event' : 'Submit Event')}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default EventForm;