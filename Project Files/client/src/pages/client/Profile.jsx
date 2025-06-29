// client/src/pages/client/Profile.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To get current user details

function ClientProfile() {
    const { userRole } = useAuth(); // Just to demonstrate access to auth context
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                // In a real app, you'd likely have a /api/users/profile or /api/clients/profile endpoint
                // For now, assuming you can fetch user data from a generic /api/users/me or similar
                const response = await fetch('http://localhost:5000/api/auth/me', { // Example: Fetch current user's data
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                setUserData(data.user); // Assuming the response has a 'user' object
            } catch (err) {
                console.error('Error fetching client profile:', err);
                setError(err.message || 'Failed to load client profile.');
                toast.error(`Error loading profile: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Client Profile...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    if (!userData) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>No client profile data available.</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '25px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>Client Profile</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #eee' }}>
                    <strong style={{ minWidth: '120px', color: '#555' }}>Username:</strong>
                    <span>{userData.username}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #eee' }}>
                    <strong style={{ minWidth: '120px', color: '#555' }}>Email:</strong>
                    <span>{userData.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #eee' }}>
                    <strong style={{ minWidth: '120px', color: '#555' }}>Role:</strong>
                    <span>{userData.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #eee' }}>
                    <strong style={{ minWidth: '120px', color: '#555' }}>Member Since:</strong>
                    <span>{new Date(userData.registrationDate).toLocaleDateString()}</span>
                </div>
                {/* Add more client-specific profile fields here as needed */}
                {/* Example: Contact Info, Company Name etc. */}
            </div>
            <button 
                onClick={() => toast.info("Edit Profile functionality coming soon!")}
                style={{ 
                    marginTop: '30px', 
                    padding: '10px 20px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                }}
            >
                Edit Profile
            </button>
        </div>
    );
}

export default ClientProfile;
