import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../../firebase';
import './AccountPage.css';
import { useNavigate } from 'react-router-dom';

function AccountPage() {
    const [user, loading, error] = useAuthState(auth);
    const [profileData, setProfileData] = useState({
        name: '',
        biography: '',
        email: '',
        phoneNumber: '',
        organization:'',
    });

    const [originalData, setOriginalData] = useState({});
    const [isChanged, setIsChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            loadProfileData(user.uid);
        } else if (!loading) {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadProfileData = async (userId) => {
        try {
            setIsLoading(true);
            const docRef = doc(db, 'profiles', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfileData(data);
                setOriginalData({ ...data });
            } else {
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
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        const newData = { ...profileData, [field]: value };
        setProfileData(newData);
        setIsChanged(JSON.stringify(newData) !== JSON.stringify(originalData));
    };

    const handleSave = async () => {
        if (!isChanged || !user) return;
        
        try {
            setIsSaving(true);
            
            const docRef = doc(db, 'profiles', user.uid);
            await setDoc(docRef, {
                ...profileData,
                updatedAt: new Date(),
            }, { merge: true });
            
            setOriginalData({ ...profileData });
            setIsChanged(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };
    const navigate = useNavigate();

    const handleCancel = () => {
        setProfileData({ ...originalData });
        setIsChanged(false);
        navigate('/');
    };

    if (loading || isLoading) {
        return (
            <div className="container">
                <div className="loading">
                    <div className="spinner"></div>
                    <span className="loading-text">Loading profile...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        navigate('/login');
    }

    return (
        <div className="container">
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
                    <p className="success-text">Profile updated!</p>
                </div>
            )}

            <div className="main-container">

                <div className="form-container">
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

                    <div className="form-group">
                        <label className="form-label">Biography</label>
                        <textarea
                            value={profileData.biography}
                            onChange={(e) => handleInputChange('biography', e.target.value)}
                            rows={5}
                            maxLength={300}
                            className="form-text"
                            placeholder="Write a bio..."
                            disabled={isSaving}
                        />
                        <p className="form-hint">
                            {profileData.biography.length}/300
                        </p>
                    </div>

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
                <div className="loading-overlay">
                    <div className="loading">
                        <div className="spinner"></div>
                        <span className="loading-text">Saving changes</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccountPage;
