// client/src/pages/freelancer/WorkingProject.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import ChatBox from '../../components/ChatBox'; // Import ChatBox component

function WorkingProjectFreelancer() {
    const { id } = useParams(); // Project ID from URL
    const { isAuthenticated, userRole, user } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProjectDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token || !isAuthenticated || userRole !== 'freelancer' || !user || !user.id) {
                setError('Authentication or authorization required.');
                setLoading(false);
                return;
            }

            const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch project details.');
            }

            const data = await response.json();
            // Basic check: Ensure the fetched project is assigned to the current freelancer
            if (!data.assignedTo || data.assignedTo._id !== user.id) {
                setError('Not authorized to view this project or project not assigned to you.');
                setLoading(false);
                return;
            }
            setProject(data);
        } catch (err) {
            console.error('Error fetching project details:', err);
            setError(err.message || 'Failed to load project details.');
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [id, isAuthenticated, userRole, user]);

    useEffect(() => {
        fetchProjectDetails();
    }, [fetchProjectDetails]);

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading project details...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    if (!project) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Project not found or not assigned to you.</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Working on: {project.title}</h2>
            <p><strong>Description:</strong> {project.description}</p>
            <p><strong>Budget:</strong> ${project.budget}</p>
            <p><strong>Status:</strong> {project.status}</p>
            <p><strong>Client:</strong> {project.client ? project.client.username : 'N/A'}</p>
            {project.skillsRequired && project.skillsRequired.length > 0 && (
                <p><strong>Skills Required:</strong> {project.skillsRequired.join(', ')}</p>
            )}

            {/* Conditional rendering for chat: Only show if project is assigned */}
            {project.status === 'assigned' || project.status === 'in progress' ? (
                <div style={{ marginTop: '30px' }}>
                    <h3>Project Chat</h3>
                    {/* Pass projectId and projectName to ChatBox */}
                    <ChatBox projectId={project._id} projectName={project.title} />
                </div>
            ) : (
                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fffbe6', borderLeft: '5px solid #ffeb3b', borderRadius: '5px' }}>
                    <p>Chat will be available once the project is officially 'assigned' or 'in progress'.</p>
                </div>
            )}
        </div>
    );
}

export default WorkingProjectFreelancer;
