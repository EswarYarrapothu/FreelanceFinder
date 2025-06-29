// client/src/pages/freelancer/MyWorkingProjects.jsx (NEW FILE)

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation to read query parameters
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

function MyWorkingProjectsFreelancer() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation(); // Hook to access URL's query parameters
    const { isAuthenticated, user } = useAuth();

    // Fetch projects based on freelancer ID and status query parameter
    const fetchFreelancerProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!isAuthenticated || !user || !user.id) {
            setError('User not authenticated or ID not available.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const freelancerId = user.id; // Get the current freelancer's ID

            // Base URL for fetching freelancer's working projects
            let url = `http://localhost:5000/api/projects/freelancer-working-projects/${freelancerId}`;

            // Check for 'status' query parameter
            const queryParams = new URLSearchParams(location.search);
            const statusFilter = queryParams.get('status');

            if (statusFilter) {
                // If status filter is present, append it to the URL
                url += `?status=${encodeURIComponent(statusFilter)}`;
            }
            console.log("Fetching freelancer projects from URL:", url); // Debugging log

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch your projects.');
            }

            const data = await response.json();
            setProjects(data);

        } catch (err) {
            console.error('Error fetching freelancer projects:', err);
            setError(err.message || 'Failed to load your projects.');
            toast.error(`Error loading projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user, location.search]); // Depend on location.search to re-fetch when filter changes

    useEffect(() => {
        fetchFreelancerProjects();
    }, [fetchFreelancerProjects]);

    // Determine page title and empty message based on current filter
    const queryParams = new URLSearchParams(location.search);
    const statusInUrl = queryParams.get('status');

    let pageTitle = "My Working Projects";
    let emptyMessage = "You currently have no projects assigned or in progress.";
    let suggestionLink = "/freelancer/all-projects";
    let suggestionText = "Browse Available Projects to find new opportunities!";

    if (statusInUrl && statusInUrl.includes('completed')) {
        pageTitle = "My Completed Projects";
        emptyMessage = "You haven't completed any projects yet.";
        suggestionLink = "/freelancer/my-applications"; // Suggest checking applications
        suggestionText = "Check your applications for accepted projects.";
    } else if (statusInUrl && (statusInUrl.includes('assigned') || statusInUrl.includes('in%20progress'))) {
        pageTitle = "My Active Projects";
        emptyMessage = "You don't have any active projects currently.";
        suggestionLink = "/freelancer/all-projects";
        suggestionText = "Browse Available Projects to start working!";
    }

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading your projects...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>{pageTitle}</h2>
            <p>Here you can view and manage your projects.</p>

            {projects.length === 0 ? (
                <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center', marginTop: '20px' }}>
                    <p>{emptyMessage}</p>
                    <Link to={suggestionLink} style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
                        {suggestionText}
                    </Link>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Title</th>
                            <th>Budget</th>
                            <th>Status</th>
                            <th>Client</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr key={project._id}>
                                <td>{project._id.substring(0, 6)}</td>
                                <td>{project.title}</td>
                                <td>${project.budget}</td>
                                <td>{project.status}</td>
                                <td>{project.client ? project.client.username : 'N/A'}</td>
                                <td style={{ verticalAlign: 'top' }}>
                                    <div style={styles.actionButtonContainer}>
                                        {(project.status === 'assigned' || project.status === 'in progress') && (
                                            <Link to={`/freelancer/working-project/${project._id}`} className="admin-table button view-btn">
                                                View Work Details & Chat
                                            </Link>
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
                        ))}
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
    // The following table styles might be redundant if admin-table class is fully styled in App.css/index.css
    // Keeping them here for now for clarity, but they should ideally be handled by global CSS
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
    infoButton: {
        backgroundColor: '#007bff', // Blue
        color: 'white',
    }
};

export default MyWorkingProjectsFreelancer;
