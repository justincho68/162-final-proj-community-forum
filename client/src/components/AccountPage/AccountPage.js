import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../../firebase';
import './AccountPage.css';
import { useNavigate } from 'react-router-dom';

function AccountPage() {
    const [user, loading, error] = useAuthState(auth); // get the statuses from firebase 
    // to hold current profile data
    const [profileData, setProfileData] = useState({
        name: '',
        biography: '',
        email: '',
        phoneNumber: '',
        organization:'',
    });

    const [originalData, setOriginalData] = useState({}); // state to hold original data
    const [isChanged, setIsChanged] = useState(false); // state to check if changes have been made
    const [isSaving, setIsSaving] = useState(false); // state to keep track of whether form is saving
    const [isLoading, setIsLoading] = useState(true); // state to keep track of whther form is loading
    const [showSuccess, setShowSuccess] = useState(false); // state for showing successfully updated message

    useEffect(() => {
        if (user) {
            loadProfileData(user.uid); // load user profile in once logged in
        } else if (!loading) {
            setIsLoading(false); // stop loading if no user and is not loading
        }
    }, [user, loading]);

    // for getting profile data from firestore
    const loadProfileData = async (userId) => {
        try {
            setIsLoading(true); // start loading 
            const docRef = doc(db, 'profiles', userId); // reference to collection called profiles in firebase with userid
            const docSnap = await getDoc(docRef); // get document snapshot
            
            if (docSnap.exists()) {
                const data = docSnap.data(); 
                setProfileData(data); // set the data as the data in the form
                setOriginalData({ ...data }); // save original
            } else {
                // create a default data is no profile created yet
                const defaultData = {
                    ...profileData,
                    email: user.email || '',
                    name: user.displayName || '',
                };
                setProfileData(defaultData);
                setOriginalData({ ...defaultData });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            alert('Failed to load profile data');
        } finally {
            setIsLoading(false); // stop loading
        }
    };

    const handleInputChange = (field, value) => { // for changes in the form
        const newData = { ...profileData, [field]: value }; 
        setProfileData(newData); // updates form to reflect changes
        setIsChanged(JSON.stringify(newData) !== JSON.stringify(originalData)); // checks if data was truly changed
    };

    const handleSave = async () => { // for saving changes to firestore
        if (!isChanged || !user) return; //if nothing is changed or no user, no save
        
        try {
            setIsSaving(true); 
            
            const docRef = doc(db, 'profiles', user.uid);
            await setDoc(docRef, { // write updated profile to firestore
                ...profileData,
                updatedAt: new Date(),
            }, { merge: true }); // update only changed data
            
            setOriginalData({ ...profileData });
            setIsChanged(false); // change back to false
            setShowSuccess(true); // true to show success mesasage
            setTimeout(() => setShowSuccess(false), 3000);
            
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile');
        } finally {
            setIsSaving(false); // done saving, change back to false
        }
    };
    const navigate = useNavigate();

    const handleCancel = () => { // if cancel is pressed, take back to home page
        setProfileData({ ...originalData });
        setIsChanged(false);
        navigate('/');
    };

    if (loading || isLoading) { // message to show when loading
        return (
            <div className="container">
                <div className="loadingsect">
                    <div className="spinner"></div>
                    <span className="loadingtext">Loading account</span>
                </div>
            </div>
        );
    }

    if (!user) {
        navigate('/login'); // automatically go to login if user is not logged in
    }

    return (
        <div className="container">
            {/* header for the cancel and done buttons with title*/}
            <div className="header">
                <div className="header-left">
                    <button className="cancel-btn" onClick={handleCancel} disabled={isSaving}>
                        Cancel
                    </button>
                </div>
                <h1 className="edit-title">Edit Account</h1>
                <button 
                    onClick={handleSave}
                    disabled={!isChanged || isSaving}
                    className={`save-btn ${(!isChanged || isSaving) ? 'disabled' : ''}`}
                >
                    {isSaving ? 'Saving...' : 'Done'}
                </button>
            </div>

            {showSuccess && (
                <div className="success-message">
                    <p className="success-text">Profile updated! Press Cancel to go back to Home! </p>
                </div>
            )}

            <div className="main-container">
                {/* for form elemets of name, organization, biography, email, phone number */}
                <div className="form-container">
                    {/* for name */}
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="form-input"
                            placeholder="Enter your name"
                            disabled={isSaving}
                        />
                    </div>
                    {/* for organization */} 
                    <div className="form-group">
                        <label className="form-label">Organization</label>
                        <input
                            type="text"
                            value={profileData.organization}
                            onChange={(e) => handleInputChange('organization', e.target.value)}
                            className="form-input"
                            placeholder="Enter the organization you are a part of (if applicable)"
                            disabled={isSaving}
                        />
                    </div>
                    {/* for biography */}
                    <div className="form-group">
                        <label className="form-label">Biography</label>
                        <textarea
                            value={profileData.biography}
                            onChange={(e) => handleInputChange('biography', e.target.value)}
                            rows={5}
                            maxLength={300}
                            className="form-text"
                            placeholder="Write a bio!"
                            disabled={isSaving}
                        />
                        <p className="form-hint">
                            {profileData.biography.length}/300
                        </p>
                    </div>

                    {/* for email */}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="form-input"
                            placeholder="Email address"
                            disabled={isSaving}
                        />
                    </div>

                    {/* for phone number */}
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            value={profileData.phoneNumber}
                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                            className="form-input"
                            placeholder="Phone number"
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </div>

            {isSaving && ( 
                <div className="loadingoverlay">
                    {/* has overlay while saving */}
                    <div className="loadingsect">
                        <div className="spinner"></div>
                        <span className="loadingtext">Saving changes</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccountPage;
