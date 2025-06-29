// client/src/pages/client/MyProjects.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

function ClientMyProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation(); // Get current location object to read query params
    const { isAuthenticated, user } = useAuth();

    // This function now handles fetching projects, applying status filter from URL
    const fetchMyPostedProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!isAuthenticated || !user || !user.id) {
            setError('User not authenticated or ID not available.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/projects/my-posted-projects`;
            
            // Read 'status' query parameter from the URL
            const queryParams = new URLSearchParams(location.search);
            const statusFilter = queryParams.get('status');

            if (statusFilter) {
                url += `?status=${encodeURIComponent(statusFilter)}`;
            }
            console.log(`DEBUG: ClientMyProjects - Fetching from URL: ${url}`); // Debugging URL

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch your posted projects.');
            }

            const data = await response.json();
            console.log("DEBUG: ClientMyProjects - Fetched projects data:", data); // Log the raw fetched data
            setProjects(data); 
            
        } catch (err) {
            console.error('Error fetching my posted projects:', err);
            setError(err.message || 'Failed to load your posted projects.');
            toast.error(`Error loading projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user, location.search]); // Re-run effect if location.search changes

    useEffect(() => {
        fetchMyPostedProjects();
    }, [fetchMyPostedProjects]);

    const handleViewApplications = (projectId, projectTitle) => {
        console.log(`DEBUG: ClientMyProjects - Navigating to applications for Project ID: ${projectId}, Title: ${projectTitle}`); // Debugging navigation
        navigate(`/client/view-applications/${projectId}`);
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete project.');
            }

            toast.success('Project deleted successfully!');
            fetchMyPostedProjects(); // Re-fetch projects to update the list
        } catch (err) {
            console.error('Error deleting project:', err);
            toast.error(`Error deleting project: ${err.message}`);
        }
    };

    const handleCloseProject = async (projectId) => {
        if (!window.confirm("Are you sure you want to close this project? It will be marked as 'completed'.")) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/projects/${projectId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'completed' }) // Set status to 'completed'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to close project.');
            }

            toast.success('Project marked as completed!');
            fetchMyPostedProjects(); // Re-fetch projects to update the list
        } catch (err) {
            console.error('Error closing project:', err);
            toast.error(`Error closing project: ${err.message}`);
        }
    };

    // Determine page title based on current filter
    const queryParams = new URLSearchParams(location.search);
    const statusInUrl = queryParams.get('status');
    const pageTitle = statusInUrl === 'completed' ? "My Completed Projects" : "My Posted Projects";
    const emptyMessage = statusInUrl === 'completed' 
        ? "You don't have any completed projects yet." 
        : "You haven't posted any projects yet.";


    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading your projects...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>{pageTitle}</h2>
            <p>Here you can view and manage all the projects you have posted.</p>

            {projects.length === 0 ? (
                <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9', textAlign: 'center' }}>
                    <p>{emptyMessage}</p>
                    {statusInUrl !== 'completed' && (
                        <Link to="/client/new-project" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>Post a New Project to get started!</Link>
                    )}
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Title</th>
                            <th>Budget</th>
                            <th>Status</th> 
                            <th>Posted Date</th>
                            <th>Assigned To</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => {
                            console.log(`DEBUG: ClientMyProjects - Rendering project: ${project.title}, ID: ${project._id}`); // Log each project being rendered
                            return (
                                <tr key={project._id}>
                                    <td>{project._id.substring(0, 6)}</td>
                                    <td>{project.title}</td>
                                    <td>${project.budget}</td>
                                    <td>{project.status}</td>
                                    <td>{new Date(project.createdAt).toLocaleDateString()}</td> 
                                    <td>{project.assignedTo ? project.assignedTo.username : 'N/A'}</td>
                                    {/* Container for vertical buttons */}
                                    <td style={{ verticalAlign: 'top' }}>
                                        <div style={styles.actionButtonContainer}>
                                            {project.status === 'open' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleViewApplications(project._id, project.title)} // Pass project.title for debug
                                                        className="admin-table button view-btn"
                                                    >
                                                        View Applications
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteProject(project._id)} 
                                                        className="admin-table button delete-btn"
                                                    >
                                                        Delete
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCloseProject(project._id)} 
                                                        className="admin-table button close-btn"
                                                    >
                                                        Close Project
                                                    </button>
                                                </>
                                            )}
                                            {(project.status === 'assigned' || project.status === 'in progress') && (
                                                <>
                                                    <Link to={`/client/working-project/${project._id}`} className="admin-table button view-btn">
                                                        View Work Details
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleCloseProject(project._id)} 
                                                        className="admin-table button close-btn"
                                                    >
                                                        Close Project
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteProject(project._id)} 
                                                        className="admin-table button delete-btn"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                            {project.status === 'completed' && (
                                                <button 
                                                    className="admin-table button info-btn"
                                                    onClick={() => toast.info('View Payment Details functionality to be implemented.')}
                                                >
                                                    View Payment Details
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const styles = {
    actionButtonContainer: {
        display: 'flex',
        flexDirection: 'column', // Arrange items vertically
        gap: '5px', // Space between buttons
        alignItems: 'flex-start', // Align buttons to the start of the column
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
    },
    th: {
        backgroundColor: '#007bff',
        color: 'white',
        padding: '12px 15px',
        textAlign: 'left',
        borderBottom: '1px solid #ddd',
    },
    td: {
        padding: '10px 15px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff',
    },
    button: {
        padding: '8px 12px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
        display: 'block', // Ensure buttons take full width of their flex item
        width: '100%', // Ensure it takes full width for vertical stacking
        textAlign: 'center', // Center text within the block button
    },
    viewButton: {
        backgroundColor: '#28a745', // Green
        color: 'white',
    },
    deleteButton: {
        backgroundColor: '#dc3545', // Red
        color: 'white',
    },
    closeButton: {
        backgroundColor: '#ffc107', // Yellow/Orange
        color: '#212529',
    },
    infoButton: {
        backgroundColor: '#007bff', // Blue
        color: 'white',
    }
};

export default ClientMyProjects;
