// client/src/pages/freelancer/AllProjects.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To access the token

function AllProjectsFreelancer() {
    const { isAuthenticated, userRole } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch all projects
    const fetchAllProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token, user is not authenticated. ProtectedRoute should handle this.
                setError('Authentication token not found. Please log in.');
                setLoading(false);
                return;
            }

            // Fetch projects from the backend API
            const response = await fetch('http://localhost:5000/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`, // Send the token for authentication
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch projects.');
            }

            const data = await response.json();
            // Assuming the backend returns an array of projects directly
            setProjects(data);

        } catch (err) {
            console.error('Error fetching all projects:', err);
            setError(err.message || 'Failed to load projects.');
            toast.error(`Error loading projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array means this function is created once

    // Effect to call the fetch function on component mount
    useEffect(() => {
        // Only fetch if authenticated and is a freelancer
        if (isAuthenticated && userRole === 'freelancer') {
            fetchAllProjects();
        } else {
            setLoading(false); // Stop loading if not authorized to fetch
            setProjects([]); // Clear any dummy data
        }
    }, [isAuthenticated, userRole, fetchAllProjects]); // Re-run if auth state changes

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading available projects...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>All Available Projects</h2>
            <p>Browse through projects posted by clients and find opportunities that match your skills.</p>

            {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '20px', backgroundColor: '#fff' }}>
                    <p style={{ fontSize: '1.1em', color: '#555' }}>No projects available at the moment.</p>
                </div>
            ) : (
                <table className="admin-table"> {/* Reusing the common table style */}
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Title</th>
                            <th>Client</th> {/* Will display client's username */}
                            <th>Budget</th>
                            <th>Skills Required</th>
                            <th>Status</th>
                            <th>Posted Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => (
                            <tr key={project._id}>
                                <td>{project._id.slice(-6)}</td> {/* Shortened ID */}
                                <td>{project.title}</td>
                                <td>{project.client ? project.client.username : 'N/A'}</td> {/* Display client username */}
                                <td>{project.budget}</td>
                                <td>{project.skillsRequired && project.skillsRequired.length > 0 ? project.skillsRequired.join(', ') : 'N/A'}</td>
                                <td>{project.status}</td>
                                <td>{new Date(project.createdAt).toLocaleDateString()}</td> {/* Assuming 'createdAt' field */}
                                <td>
                                    <Link to={`/freelancer/project-data/${project._id}`} className="admin-table button view-btn">
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AllProjectsFreelancer;
