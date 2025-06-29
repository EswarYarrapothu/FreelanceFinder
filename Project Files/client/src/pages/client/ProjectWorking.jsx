// client/src/pages/client/ProjectWorking.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import ChatBox from '../../components/ChatBox'; // Import ChatBox component

function ProjectWorkingClient() {
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
            if (!token || !isAuthenticated || userRole !== 'client' || !user || !user.id) {
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
            // Basic check: Ensure the fetched project belongs to the current client
            if (data.client._id !== user.id) {
                setError('Not authorized to view this project.');
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
        return <div style={{ padding: '20px', textAlign: 'center' }}>Project not found or you are not authorized to view it.</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Project: {project.title}</h2>
            <p><strong>Description:</strong> {project.description}</p>
            <p><strong>Budget:</strong> ${project.budget}</p>
            <p><strong>Status:</strong> {project.status}</p>
            <p><strong>Assigned To:</strong> {project.assignedTo ? project.assignedTo.username : 'Not Assigned'}</p>
            {project.skillsRequired && project.skillsRequired.length > 0 && (
                <p><strong>Skills Required:</strong> {project.skillsRequired.join(', ')}</p>
            )}
            
            {/* Conditional rendering for chat: Only show if project is assigned or in progress */}
            {(project.status === 'assigned' || project.status === 'in progress') && project.assignedTo ? (
                <div style={{ marginTop: '30px' }}>
                    <h3>Project Chat</h3>
                    {/* Pass projectId and projectName to ChatBox */}
                    <ChatBox projectId={project._id} projectName={project.title} />
                </div>
            ) : (
                <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fffbe6', borderLeft: '5px solid #ffeb3b', borderRadius: '5px' }}>
                    <p>Chat will be available once the project status is 'assigned' or 'in progress' and a freelancer is assigned.</p>
                </div>
            )}
        </div>
    );
}

export default ProjectWorkingClient;
