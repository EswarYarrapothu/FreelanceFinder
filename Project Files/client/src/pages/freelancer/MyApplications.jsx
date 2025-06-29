// client/src/pages/freelancer/MyApplications.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To access the user ID

function MyApplicationsFreelancer() {
    const navigate = useNavigate();
    const { isAuthenticated, userRole, user } = useAuth(); // Get the full user object to access user.id
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch applications for the logged-in freelancer
    const fetchMyApplications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            // Ensure user and user.id are available before making API call
            if (!token || !user || !user.id || userRole !== 'freelancer') {
                setError('Authentication token or user ID not found, or not authorized as freelancer. Please log in.');
                setLoading(false);
                return;
            }

            // FIX: Change API endpoint to match backend route: GET /api/applications/my-applications
            const response = await fetch(`http://localhost:5000/api/applications/my-applications`, {
                headers: {
                    'Authorization': `Bearer ${token}`, // Send the token for authentication
                    'Content-Type': 'application/json' // Often not strictly needed for GET, but harmless
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch your applications.');
            }

            const data = await response.json();
            console.log("MyApplicationsFreelancer: Fetched applications:", data); // Debugging: See what data is returned
            setMyApplications(data);

        } catch (err) {
            console.error('Error fetching my applications:', err);
            // More specific error message for "Invalid Project ID" or network errors
            if (err.message.includes('Invalid Project ID')) {
                setError('Failed to load your applications. Some associated projects may no longer exist or have invalid IDs.');
                toast.error(`Error loading applications: ${err.message}. Check console for details.`);
            } else {
                setError(err.message || 'Failed to load your applications.');
                toast.error(`Error loading applications: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated, userRole]); // Depend on 'user' object, isAuthenticated, and userRole

    // Effect to call the fetch function on component mount
    useEffect(() => {
        // Only fetch if authenticated as freelancer and user object is available
        if (isAuthenticated && userRole === 'freelancer' && user && user.id) {
            fetchMyApplications();
        } else if (!isAuthenticated || userRole !== 'freelancer') {
            setLoading(false); // Stop loading if not authorized or user not ready
            setMyApplications([]); // Clear applications if not logged in or not freelancer
        }
    }, [isAuthenticated, userRole, user, fetchMyApplications]); // Re-run if auth state, user, or fetchMyApplications changes


    // FIX: Implement the handleWithdrawApplication function
    const handleWithdrawApplication = async (applicationId) => {
        if (!window.confirm("Are you sure you want to withdraw this application?")) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/applications/${applicationId}`, {
                method: 'DELETE', // Backend has a DELETE route for applications/:id
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to withdraw application.');
            }

            toast.success('Application withdrawn successfully!');
            fetchMyApplications(); // Re-fetch applications to update the list
        } catch (err) {
            console.error('Error withdrawing application:', err);
            toast.error(`Error withdrawing application: ${err.message}`);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading your applications...</div>;
    }

    if (error) {
        // More user-friendly error display
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red', border: '1px solid #dc3545', borderRadius: '8px', backgroundColor: '#f8d7da' }}>
                <h2>Error Loading Applications</h2>
                <p>{error}</p>
                <p>Please check your internet connection, ensure the backend is running, and try again.</p>
                {error.includes('Invalid Project ID') && (
                    <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#721c24' }}>
                        *Hint: This might happen if a project you applied for has since been deleted by the client.*
                    </p>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Applications</h2>
            <p>Here you can view the status of all projects you've applied for.</p>

            {myApplications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '20px', backgroundColor: '#fff' }}>
                    <p style={{ fontSize: '1.1em', color: '#555' }}>You haven't applied for any projects yet.</p>
                    <Link to="/freelancer/all-projects" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>Browse available projects</Link>
                </div>
            ) : (
                <table className="admin-table"> {/* Reusing common table style */}
                    <thead>
                        <tr>
                            <th>Application ID</th>
                            <th>Project Title</th>
                            <th>Bid Amount</th>
                            <th>Status</th>
                            <th>Applied Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myApplications.map(app => (
                            <tr key={app._id}>
                                <td>{app._id.slice(-6)}</td> {/* Display last 6 chars of ID */}
                                {/* Conditional display for Project Title - FIX: Check app.project before accessing properties */}
                                <td>
                                    {app.project ? app.project.title : 'Project Deleted/N/A'}
                                </td>
                                <td>${app.bidAmount}</td>
                                <td>{app.status}</td>
                                <td>{new Date(app.applicationDate).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                                        {/* Conditionally enable/disable "View Project" button */}
                                        {/* FIX: Ensure app.project exists and has _id before linking */}
                                        {app.project && app.project._id ? (
                                            <Link 
                                                to={`/freelancer/project-data/${app.project._id}`} 
                                                className="admin-table button view-btn"
                                            >
                                                View Project
                                            </Link>
                                        ) : (
                                            <button 
                                                className="admin-table button view-btn" 
                                                disabled 
                                                title="Project details unavailable (possibly deleted or not found)"
                                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                                            >
                                                View Project
                                            </button>
                                        )}
                                        {/* Add a withdraw button if status is pending */}
                                        {app.status === 'pending' && (
                                            <button
                                                onClick={() => handleWithdrawApplication(app._id)}
                                                className="admin-table button delete-btn" // Reusing delete-btn style
                                            >
                                                Withdraw
                                            </button>
                                        )}
                                        {/* If application is accepted, provide a link to the working project */}
                                        {/* FIX: Ensure app.project exists and has _id before linking */}
                                        {app.status === 'accepted' && app.project && app.project._id && (
                                            <Link 
                                                to={`/freelancer/working-project/${app.project._id}`} 
                                                className="admin-table button view-btn" 
                                                style={{ backgroundColor: '#007bff' }} // Use a different color for "Go to Work"
                                            >
                                                Go To Work
                                            </Link>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default MyApplicationsFreelancer;
