// client/src/pages/freelancer/ProjectData.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

function ProjectDataFreelancer() {
    const { id } = useParams(); // Get the project ID from the URL
    const navigate = useNavigate();
    const { isAuthenticated, userRole, user } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the application modal/form
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [submittingApplication, setSubmittingApplication] = useState(false);
    
    // To track if the freelancer has already applied to this project
    const [hasApplied, setHasApplied] = useState(false);


    // Fetch project details and check if user has applied
    const fetchProjectAndApplicationStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        setHasApplied(false); // Reset hasApplied state at the start of fetch

        console.log(`Frontend DEBUG: fetchProjectAndApplicationStatus: Starting fetch for Project ID: ${id}`);
        console.log(`Frontend DEBUG: Auth: ${isAuthenticated}, Role: ${userRole}, User ID: ${user?.id}`);

        try {
            if (!id) {
                console.error('Frontend DEBUG: fetchProjectAndApplicationStatus: Project ID is missing from the URL.');
                throw new Error('Project ID is missing from the URL.');
            }

            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('Frontend DEBUG: fetchProjectAndApplicationStatus: Authentication token not found. Redirecting to login.');
                setError('Authentication token not found. Please log in.');
                setLoading(false);
                navigate('/login');
                return;
            }

            // --- 1. Fetch Project Details ---
            const projectResponse = await fetch(`http://localhost:5000/api/projects/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (projectResponse.status === 404) {
                setProject(null);
                console.error(`Frontend DEBUG: Project Not Found for ID: ${id}`);
                throw new Error('Project Not Found.');
            }

            if (!projectResponse.ok) {
                const errorData = await projectResponse.json();
                console.error('Frontend DEBUG: Failed to fetch project details:', errorData.message);
                throw new Error(errorData.message || 'Failed to fetch project details.');
            }

            const projectData = await projectResponse.json();
            setProject(projectData);
            console.log('Frontend DEBUG: Project data fetched:', projectData);

            // --- 2. Check Application Status for this project ---
            if (isAuthenticated && userRole === 'freelancer' && user && user.id) {
                console.log('Frontend DEBUG: Fetching freelancer applications to check status...');
                const applicationsResponse = await fetch(`http://localhost:5000/api/applications/my-applications`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!applicationsResponse.ok) {
                    const errorData = await applicationsResponse.json();
                    console.error('Frontend DEBUG: Failed to fetch freelancer applications:', errorData.message);
                } else {
                    const applicationsData = await applicationsResponse.json();
                    console.log('Frontend DEBUG: Fetched applications for user:', applicationsData);

                    // Check if any fetched application matches the current project ID
                    // Ensure app.project exists and its _id matches the current project ID
                    const foundApplication = applicationsData.find(app => app.project && app.project._id === id);
                    
                    if (foundApplication) {
                        console.log(`Frontend DEBUG: Application found for project ${id}. Setting hasApplied to true.`);
                        setHasApplied(true);
                    } else {
                        console.log(`Frontend DEBUG: No application found for project ${id}. hasApplied remains false.`);
                        setHasApplied(false);
                    }
                }
            } else {
                console.log('Frontend DEBUG: Not authorized as freelancer or user data missing. Skipping application status check.');
            }

        } catch (err) {
            console.error('Frontend DEBUG: Error in fetchProjectAndApplicationStatus:', err);
            setError(err.message || 'Failed to load project details or check application status.');
            toast.error(`Error loading project: ${err.message}`);
        } finally {
            setLoading(false);
            console.log('Frontend DEBUG: fetchProjectAndApplicationStatus: Fetch complete.');
        }
    }, [id, isAuthenticated, userRole, user, navigate]);

    useEffect(() => {
        if (isAuthenticated && userRole === 'freelancer' && id) {
            fetchProjectAndApplicationStatus();
        } else if (!id) {
            setError('No Project ID provided in the URL.');
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [id, isAuthenticated, userRole, fetchProjectAndApplicationStatus]);


    const handleApplyClick = () => {
        // Only show modal if not already applied and project is open
        if (!hasApplied && project?.status === 'open') {
            setShowApplyModal(true);
        } else if (hasApplied) {
            toast.info('You have already applied for this project.');
        } else if (project?.status !== 'open') {
            toast.warn(`This project is ${project?.status}. Applications are not open.`);
        }
    };

    const handleCloseModal = () => {
        setShowApplyModal(false);
        setBidAmount('');
        setCoverLetter('');
    };

    const handleSubmitApplication = async (e) => {
        e.preventDefault();
        setSubmittingApplication(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Authentication token not found. Please log in.');
                setSubmittingApplication(false);
                navigate('/login');
                return;
            }

            if (!bidAmount || Number(bidAmount) <= 0 || !coverLetter) {
                toast.error('Please enter a valid bid amount and cover letter.');
                setSubmittingApplication(false);
                return;
            }

            console.log('Frontend DEBUG: handleSubmitApplication: Attempting to submit application for project ID:', id);
            console.log('Frontend DEBUG: Submitting payload:', { projectId: id, bidAmount: Number(bidAmount), coverLetter });

            const response = await fetch('http://localhost:5000/api/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    projectId: id,
                    bidAmount: Number(bidAmount),
                    coverLetter
                })
            });

            const data = await response.json();
            console.log('Frontend DEBUG: Response from application submission:', data);


            if (response.ok) {
                toast.success(data.message || 'Application submitted successfully!');
                handleCloseModal();
                setHasApplied(true); // Mark as applied on successful submission
                console.log('Frontend DEBUG: Application submitted successfully. hasApplied set to true.');
                // Re-fetch project to ensure status is up to date (though for open it might not change immediately)
                fetchProjectAndApplicationStatus(); 
            } else {
                toast.error(data.message || 'Failed to submit application.');
                console.error('Frontend DEBUG: Failed to submit application. Server response:', data);
            }

        } catch (err) {
            console.error('Frontend DEBUG: Error in handleSubmitApplication:', err);
            setError(err.message || 'Network error. Could not submit application.');
            toast.error(`Error: ${err.message}`);
        } finally {
            setSubmittingApplication(false);
            console.log('Frontend DEBUG: handleSubmitApplication: Submission attempt complete.');
        }
    };


    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading project details...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <h2>Error Loading Project</h2>
                <p>{error}</p>
                {error === 'Project Not Found.' && (
                    <button onClick={() => navigate('/freelancer/all-projects')}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginTop: '20px'
                            }}>
                        Back to All Projects
                    </button>
                )}
            </div>
        );
    }

    if (!project) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Project Details Not Available</h2>
                <p>The project you are looking for could not be found or does not exist.</p>
                <button onClick={() => navigate('/freelancer/all-projects')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginTop: '20px'
                        }}>
                    Back to All Projects
                </button>
            </div>
        );
    }

    // Determine if the "Apply" button should be shown or if an "Applied" status should be shown
    const showApplyButton = project.status === 'open' && !hasApplied;
    const showAppliedStatus = project.status === 'open' && hasApplied;


    return (
        <div style={{ padding: '20px' }}>
            <h2>Project Details: {project.title}</h2>
            <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '20px' }}>ID: {project._id}</p>

            <div style={{
                background: 'white',
                padding: '25px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                marginTop: '20px'
            }}>
                <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>Description</h3>
                <p style={{ lineHeight: '1.6', color: '#555' }}>{project.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '25px', padding: '15px 0', borderTop: '1px solid #eee' }}>
                    <div>
                        <h4 style={{ color: '#555', marginBottom: '5px' }}>Budget</h4>
                        <p><strong>{project.budget}</strong></p>
                    </div>
                    <div>
                        <h4 style={{ color: '#555', marginBottom: '5px' }}>Status</h4>
                        <p><strong>{project.status}</strong></p>
                    </div>
                    <div>
                        <h4 style={{ color: '#555', marginBottom: '5px' }}>Client</h4>
                        <p><strong>{project.client ? project.client.username : 'N/A'}</strong> ({project.client ? project.client.email : 'N/A'})</p>
                    </div>
                    <div>
                        <h4 style={{ color: '#555', marginBottom: '5px' }}>Skills Required</h4>
                        <p><strong>{project.skillsRequired && project.skillsRequired.length > 0 ? project.skillsRequired.join(', ') : 'None specified'}</strong></p>
                    </div>
                    <div>
                        <h4 style={{ color: '#555', marginBottom: '5px' }}>Posted Date</h4>
                        <p><strong>{new Date(project.createdAt).toLocaleDateString()}</strong></p>
                    </div>
                </div>

                <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
                    {/* Conditional Rendering for Apply Button / Applied Status */}
                    {showApplyButton && (
                        <button
                            onClick={handleApplyClick}
                            disabled={submittingApplication}
                            style={{
                                padding: '12px 25px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '1.1em',
                                transition: 'background-color 0.2s ease',
                                opacity: submittingApplication ? 0.7 : 1
                            }}
                        >
                            {submittingApplication ? 'Submitting...' : 'Apply / Place Bid'}
                        </button>
                    )}

                    {showAppliedStatus && (
                        <span style={{
                            padding: '12px 25px',
                            backgroundColor: '#28a745', // Green color for applied
                            color: 'white',
                            borderRadius: '5px',
                            fontSize: '1.1em',
                            fontWeight: 'bold',
                            display: 'inline-block',
                            alignSelf: 'center',
                        }}>
                            Applied!
                        </span>
                    )}

                    {project.status !== 'open' && !showAppliedStatus && ( // If project is not open and hasn't been applied by this user
                        <span style={{
                            padding: '12px 25px',
                            backgroundColor: '#6c757d', // Grey for other statuses
                            color: 'white',
                            borderRadius: '5px',
                            fontSize: '1.1em',
                            fontWeight: 'bold',
                            display: 'inline-block',
                            alignSelf: 'center',
                        }}>
                            Status: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                    )}

                    <button
                        onClick={() => navigate('/freelancer/all-projects')}
                        style={{
                            padding: '12px 25px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '1.1em',
                            transition: 'background-color 0.2s ease'
                        }}
                    >
                        Back to All Projects
                    </button>
                </div>
            </div>

            {/* Application Modal */}
            {showApplyModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                        width: '90%',
                        maxWidth: '500px',
                        position: 'relative'
                    }}>
                        <h3 style={{ marginBottom: '20px', color: '#333' }}>Apply for "{project.title}"</h3>
                        <form onSubmit={handleSubmitApplication}>
                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="bidAmount" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Your Bid Amount ($):</label>
                                <input
                                    type="number"
                                    id="bidAmount"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder="e.g., 500"
                                    required
                                    min="0"
                                    step="0.01"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    disabled={submittingApplication}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label htmlFor="coverLetter" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cover Letter:</label>
                                <textarea
                                    id="coverLetter"
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Tell the client why you're the best fit for this project."
                                    rows="6"
                                    required
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    disabled={submittingApplication}
                                ></textarea>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '1em'
                                    }}
                                    disabled={submittingApplication}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '1em'
                                    }}
                                    disabled={submittingApplication}
                                >
                                    {submittingApplication ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectDataFreelancer;
