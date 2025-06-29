// client/src/pages/freelancer/MyProjects.jsx (This is "My Working Projects" from sidebar)

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To access the user ID

function MyWorkingProjectsFreelancer() {
    const { isAuthenticated, userRole, user } = useAuth(); // Get the full user object
    const [workingProjects, setWorkingProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch projects assigned to the logged-in freelancer
    const fetchWorkingProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token || !user || !user.id) {
                setError('Authentication token or user ID not found. Please log in.');
                setLoading(false);
                console.warn('MyWorkingProjectsFreelancer: Authentication token or user ID not found.');
                return;
            }

            // Fetch projects from the backend API for the specific freelancer, filtered by status
            // Backend route: GET /api/projects/freelancer-working-projects/:freelancerId
            const response = await fetch(`http://localhost:5000/api/projects/freelancer-working-projects/${user.id}`, { // Corrected template literal for URL
                headers: {
                    'Authorization': `Bearer ${token}`, // Corrected template literal for Authorization header
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch your working projects.');
            }

            const data = await response.json();
            console.log("MyWorkingProjectsFreelancer: Fetched working projects:", data); // Debugging
            setWorkingProjects(data);

        } catch (err) {
            console.error('Error fetching my working projects:', err);
            setError(err.message || 'Failed to load your working projects.');
            toast.error(`Error loading working projects: ${err.message}`); // Corrected template literal for toast message
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated]); // Depend on 'user' object and isAuthenticated

    // Effect to call the fetch function on component mount
    useEffect(() => {
        // Only fetch if authenticated as freelancer and user object is available
        if (isAuthenticated && userRole === 'freelancer' && user && user.id) {
            fetchWorkingProjects();
        } else {
            setLoading(false); // Stop loading if not authorized or user not ready
            setWorkingProjects([]); // Clear projects if not logged in or not freelancer
            if (!isAuthenticated) {
                setError('Please log in to view your working projects.');
            } else if (userRole !== 'freelancer') {
                setError('You must be a freelancer to view this page.');
            }
        }
    }, [isAuthenticated, userRole, user, fetchWorkingProjects]); // Re-run if auth state or user changes

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading your working projects...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Working Projects</h2>
            <p>Here you can view projects currently assigned to you or in progress.</p>

            {workingProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '20px', backgroundColor: '#fff' }}>
                    <p style={{ fontSize: '1.1em', color: '#555' }}>You don't have any working projects yet.</p>
                    <Link to="/freelancer/all-projects" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>Browse available projects to get started!</Link>
                </div>
            ) : (
                <table className="admin-table"> {/* Reusing common table style */}
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Title</th>
                            <th>Client</th>
                            <th>Budget</th>
                            <th>Current Status</th>
                            <th>Assigned Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workingProjects.map(project => (
                            <tr key={project._id}>
                                <td>{project._id.slice(-6)}</td> {/* Display last 6 chars of ID */}
                                <td>{project.title}</td>
                                {/* Ensure project.client exists and has a username field */}
                                <td>{project.client && project.client.username ? project.client.username : 'N/A'}</td>
                                {/* Format budget for display. Assuming it's a number or numeric string. */}
                                <td>{project.budget ? `$${parseFloat(project.budget).toFixed(2)}` : 'N/A'}</td>
                                <td>{project.status}</td>
                                {/* Assuming assignedAt is a timestamp or date string, fallback to createdAt */}
                                <td>{new Date(project.assignedAt || project.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <Link to={`/freelancer/working-project/${project._id}`} className="button view-btn"> {/* Corrected template literal for 'to' prop and className */}
                                        View Work Details
                                    </Link>
                                    {/* Add other actions like 'Submit Work', 'Request Payment' here */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default MyWorkingProjectsFreelancer;
