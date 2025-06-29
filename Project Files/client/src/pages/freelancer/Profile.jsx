// client/src/pages/freelancer/Profile.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To get current user details and token

function FreelancerProfile() {
    const { isAuthenticated, userRole, user } = useAuth(); // Get auth state and user object
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                // Ensure there's a token and the user is a freelancer
                if (!token || !isAuthenticated || userRole !== 'freelancer') {
                    setError('Authentication required or not authorized to view this profile.');
                    setLoading(false);
                    return;
                }

                // Fetch current user's data from the backend
                // The /api/auth/me endpoint provides basic user details
                const response = await fetch('http://localhost:5000/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Corrected template literal
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch profile: ${response.status} - ${errorText}`); // Corrected template literal
                }

                const data = await response.json();
                // Assuming the response from /api/auth/me has a 'user' object
                setUserData(data.user);
            } catch (err) {
                console.error('Error fetching freelancer profile:', err);
                setError(err.message || 'Failed to load freelancer profile.');
                toast.error(`Error loading profile: ${err.message}`); // Corrected template literal
            } finally {
                setLoading(false);
            }
        };

        // Fetch data only if authenticated as a freelancer
        if (isAuthenticated && userRole === 'freelancer') {
            fetchUserProfile();
        } else {
            setLoading(false); // Stop loading if not authenticated or not a freelancer
            setUserData(null); // Clear any old data
        }
    }, [isAuthenticated, userRole]); // Re-run when authentication status or role changes

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Freelancer Profile...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    if (!userData) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>No freelancer profile data available. Please ensure you are logged in as a freelancer.</div>;
    }

    // Dummy data for additional freelancer-specific fields not in current User model
    // In a real app, you would extend your User model on the backend to include these,
    // and then fetch them from a dedicated freelancer profile endpoint (e.g., /api/freelancers/me)
    const dummyProfessionalDetails = {
        headline: 'Experienced Full Stack Developer',
        bio: 'Dedicated developer with a passion for creating robust and scalable web applications. Proficient in MERN stack, Python, and various cloud services. Committed to delivering high-quality code and effective solutions.',
        skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Python', 'Django', 'REST APIs', 'Git', 'AWS Basics'],
        hourlyRate: '$45/hr',
        portfolioLink: 'https://johndoeportfolio.com', // Replace with a real link if available in backend
        availability: 'Full-time'
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '20px auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Your Freelancer Profile</h2>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#007bff', marginBottom: '10px' }}>Basic Information</h3>
                <p><strong>Username:</strong> {userData.username}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Role:</strong> {userData.role}</p>
                {/* Add other basic user data fields as available from /api/auth/me */}
                {userData.createdAt && <p><strong>Member Since:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#007bff', marginBottom: '10px' }}>Professional Details</h3>
                <p><strong>Headline:</strong> {dummyProfessionalDetails.headline}</p>
                <p><strong>Bio:</strong> {dummyProfessionalDetails.bio}</p>
                <p>
                    <strong>Skills:</strong>{' '}
                    {dummyProfessionalDetails.skills && dummyProfessionalDetails.skills.length > 0
                        ? dummyProfessionalDetails.skills.join(', ')
                        : 'No skills listed.'}
                </p>
                <p><strong>Hourly Rate:</strong> {dummyProfessionalDetails.hourlyRate}</p>
                <p>
                    <strong>Portfolio:</strong>{' '}
                    {dummyProfessionalDetails.portfolioLink ? (
                        <a href={dummyProfessionalDetails.portfolioLink} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
                            {dummyProfessionalDetails.portfolioLink}
                        </a>
                    ) : (
                        'Not provided.'
                    )}
                </p>
                <p><strong>Availability:</strong> {dummyProfessionalDetails.availability}</p>
            </div>

            {/* You can add an "Edit Profile" button here that navigates to an edit form */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                    onClick={() => toast.info('Edit profile functionality coming soon!')} // Placeholder for actual edit logic
                    style={{
                        padding: '10px 20px',
                        fontSize: '1em',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                >
                    Edit Profile
                </button>
            </div>
        </div>
    );
}

export default FreelancerProfile;