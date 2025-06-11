import React, { useState } from 'react';
import './AccountPage.css';

function AccountPage() {
    const [profileData, setProfileData] = useState({
        profileImage: 'https://picsum.photos/150/150?random=1',
        name: 'Susan Jones',
        username: 'susanjones',
        biography: 'I host events that are beneficial to the community! I enjoy having bake sales, garage sales, and different volunteer events. Come out to my events to meet more people in the community and contribute to the cause!',
        email: 'susan@gmail.com',
        phoneNumber: '+1 (555) 123-4567',
    });

    const [originalData] = useState({ ...profileData });
    const [isChanged, setIsChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleInputChange = (field, value) => {
        const newData = { ...profileData, [field]: value };
        setProfileData(newData);
        setIsChanged(JSON.stringify(newData) !== JSON.stringify(originalData));
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                handleInputChange('profileImage', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!isChanged) return;
        
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        setIsChanged(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleCancel = () => {
        setProfileData({ ...originalData });
        setIsChanged(false);
    };

    return (
        <div className="container">
            <div className="header">
                <div className="header-left">
                    <button className="cancel-btn" onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
                <h1 className="edit-title">Edit profile</h1>
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
                <div className="profile-pic-sect">
                    <div className="profile-pic-container">
                        <img
                            src={profileData.profileImage}
                            alt="Profile"
                            className="profile-pic"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="image-upload-input"
                            id="profile-image-upload"
                        />
                        <label htmlFor="profile-image-upload" className="change-btn">
                            Change Picture
                        </label>
                    </div>
                </div>

                <div className="form-container">
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="form-input"
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            value={profileData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className="form-input"
                            placeholder="Enter username"
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