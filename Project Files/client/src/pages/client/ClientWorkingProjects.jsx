// client/src/pages/client/ClientWorkingProjects.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

function ClientWorkingProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const fetchWorkingProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!isAuthenticated || !user || !user.id) {
            setError('User not authenticated or ID not available.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/projects/my-posted-projects?status=assigned,in%20progress`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch your working projects.');
            }

            const data = await response.json();
            setProjects(data);
            
        } catch (err) {
            console.error('Error fetching client working projects:', err);
            setError(err.message || 'Failed to load your working projects.');
            toast.error(`Error loading working projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        fetchWorkingProjects();
    }, [fetchWorkingProjects]);

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading your working projects...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Working Projects</h2>
            <p>Here you can view projects you've posted that are currently assigned or in progress.</p>

            {projects.length === 0 ? (
                <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
                    <p>You don't have any projects currently assigned or in progress.</p>
                    <p style={{ color: '#555', fontSize: '0.9em' }}>Once you accept a freelancer's application, the project will appear here.</p>
                    <Link to="/client/my-posted-projects" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>View All Posted Projects</Link>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Title</th>
                            <th>Budget</th>
                            <th>Status</th> 
                            <th>Assigned To</th>
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
                                <td>{project.assignedTo ? project.assignedTo.username : 'N/A'}</td>
                                {/* Apply flex column for buttons in the Actions column */}
                                <td style={{ verticalAlign: 'top' }}> {/* Align actions to top */}
                                    <div style={styles.actionButtonContainer}> {/* New container for vertical layout */}
                                        <Link to={`/client/working-project/${project._id}`} className="admin-table button view-btn">
                                            View Details & Chat
                                        </Link>
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

// Re-using common styles from other components
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
    },
    viewButton: {
        backgroundColor: '#28a745', // Green
        color: 'white',
        '&:hover': {
            backgroundColor: '#218838',
        },
    },
};

export default ClientWorkingProjects;
