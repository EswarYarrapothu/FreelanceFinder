// client/src/pages/admin/AdminProjects.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

function AdminProjects() {
    const { isAuthenticated, userRole } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token || userRole !== 'admin') {
                setError('Unauthorized access. Please log in as an Admin.');
                setLoading(false);
                return;
            }

            // Admin fetches all projects from the same /api/projects endpoint
            const response = await fetch('http://localhost:5000/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch projects.');
            }

            const data = await response.json();
            setProjects(data);
        } catch (err) {
            console.error('Error fetching admin projects:', err);
            setError(err.message || 'Failed to load projects.');
            toast.error(`Error loading projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        if (isAuthenticated && userRole === 'admin') {
            fetchProjects();
        } else {
            setLoading(false);
            setProjects([]);
        }
    }, [isAuthenticated, userRole, fetchProjects]);

    const handleViewProject = (projectId) => {
        // Reusing freelancer's ProjectData component to view project details for now
        navigate(`/freelancer/project-data/${projectId}`);
    };

    const handleEditProject = (projectId) => {
        toast.info(`Edit project ID: ${projectId} (Functionality to be implemented)`);
        // navigate(`/admin/edit-project/${projectId}`); // Future route
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
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
            fetchProjects(); // Re-fetch projects to update the list
        } catch (err) {
            console.error('Error deleting project:', err);
            toast.error(`Error deleting project: ${err.message}`);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading all projects...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Manage Projects</h2>
            <p>View and manage all projects posted on the platform.</p>

            {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '20px', backgroundColor: '#fff' }}>
                    <p style={{ fontSize: '1.1em', color: '#555' }}>No projects found.</p>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Project ID</th>
                            <th>Title</th>
                            <th>Client</th>
                            <th>Budget</th>
                            <th>Skills Required</th>
                            <th>Status</th>
                            <th>Posted Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => {
                            const postedDate = new Date(project.createdAt);
                            const formattedDate = !isNaN(postedDate.getTime()) ? postedDate.toLocaleDateString() : 'N/A';

                            return (
                                <tr key={project._id}>
                                    <td>{project._id.slice(-6)}</td>
                                    <td>{project.title}</td>
                                    <td>{project.client ? project.client.username : 'N/A'}</td>
                                    <td>{project.budget}</td>
                                    <td>{project.skillsRequired && project.skillsRequired.length > 0 ? project.skillsRequired.join(', ') : 'None specified'}</td>
                                    <td>{project.status}</td>
                                    <td>{formattedDate}</td>
                                    <td>
                                        <button onClick={() => handleViewProject(project._id)} className="admin-table button view-btn">
                                            View
                                        </button>
                                        <button onClick={() => handleEditProject(project._id)} className="admin-table button edit-btn">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteProject(project._id)} className="admin-table button delete-btn">
                                            Delete
                                        </button>
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

export default AdminProjects;
