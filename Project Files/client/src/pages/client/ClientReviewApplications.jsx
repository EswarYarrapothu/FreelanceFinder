// client/src/pages/client/ClientReviewApplications.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

function ClientReviewApplications() {
    const navigate = useNavigate();
    const { isAuthenticated, userRole, user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the "View Full" modal
    const [showModal, setShowModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);

    const fetchApplicationsForClient = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token || !isAuthenticated || userRole !== 'client' || !user || !user.id) {
                setError('Authentication or authorization required.');
                setLoading(false);
                return;
            }

            // Fetch applications for all projects belonging to this client
            const response = await fetch(`http://localhost:5000/api/applications/client-review`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch applications for your projects.');
            }
            const data = await response.json();
            setApplications(data);

        } catch (err) {
            console.error('Error fetching client applications for review:', err);
            setError(err.message || 'Failed to load applications for review.');
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, userRole, user]);

    useEffect(() => {
        fetchApplicationsForClient();
    }, [fetchApplicationsForClient]);

    // Handle Accept/Reject application
    const handleApplicationStatusChange = async (applicationId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus} this application?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/applications/${applicationId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || `Application ${newStatus} successfully!`);
                fetchApplicationsForClient(); // Re-fetch to update list
                if (newStatus === 'accepted' && selectedApplication?.project?._id) {
                    navigate(`/client/working-project/${selectedApplication.project._id}`);
                } else if (newStatus === 'accepted' && data.application?.project?._id) {
                    navigate(`/client/working-project/${data.application.project._id}`);
                }
            } else {
                toast.error(data.message || 'Failed to update application status.');
            }
        } catch (err) {
            console.error('Error updating application status:', err);
            toast.error(`Network error: ${err.message}`);
        }
    };

    // Handler for "View Full" button
    const handleViewFull = (application) => {
        setSelectedApplication(application);
        setShowModal(true);
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading applications for review...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Applications Awaiting Your Review</h2>
            <p>Here you can view and manage all applications submitted for your projects.</p>

            {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '20px', backgroundColor: '#fff' }}>
                    <p style={{ fontSize: '1.1em', color: '#555' }}>No applications awaiting your review at this moment.</p>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>App ID</th>
                            <th>Project Title</th>
                            <th>Freelancer</th>
                            <th>Bid Amount</th>
                            <th>Status</th>
                            <th>Applied Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map(app => (
                            <tr key={app._id}>
                                <td>{app._id.slice(-6)}</td>
                                <td>{app.project ? app.project.title : 'N/A'}</td>
                                <td>{app.freelancer ? app.freelancer.username : 'N/A'}</td>
                                <td>${app.bidAmount}</td>
                                <td>{app.status}</td>
                                <td>{new Date(app.applicationDate).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-start' }}>
                                        <button 
                                            onClick={() => handleViewFull(app)} 
                                            className="admin-table button view-btn"
                                        >
                                            View Full
                                        </button>
                                        {app.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => handleApplicationStatusChange(app._id, 'accepted')} 
                                                    className="admin-table button approve-btn" 
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    onClick={() => handleApplicationStatusChange(app._id, 'rejected')} 
                                                    className="admin-table button reject-btn" 
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Application Details Modal */}
            {showModal && selectedApplication && (
                <div style={modalStyles.overlay}>
                    <div style={modalStyles.modal}>
                        <h3 style={modalStyles.modalHeader}>Application Details</h3>
                        <p><strong>Freelancer:</strong> {selectedApplication.freelancer?.username || 'N/A'}</p>
                        <p><strong>Email:</strong> {selectedApplication.freelancer?.email || 'N/A'}</p>
                        <p><strong>Project:</strong> {selectedApplication.project?.title || 'N/A'}</p>
                        <p><strong>Bid Amount:</strong> ${selectedApplication.bidAmount}</p>
                        <p><strong>Status:</strong> {selectedApplication.status}</p>
                        <p><strong>Applied Date:</strong> {new Date(selectedApplication.applicationDate).toLocaleDateString()}</p>
                        <div style={modalStyles.coverLetterBox}>
                            <strong>Cover Letter:</strong>
                            <p style={modalStyles.coverLetterContent}>{selectedApplication.coverLetter}</p>
                        </div>
                        <button onClick={() => setShowModal(false)} style={modalStyles.closeButton}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Inline styles for the modal
const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'relative',
        fontFamily: 'Inter, sans-serif',
    },
    modalHeader: {
        marginBottom: '20px',
        color: '#333',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
    },
    coverLetterBox: {
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '5px',
        padding: '15px',
        marginTop: '20px',
        marginBottom: '20px',
    },
    coverLetterContent: {
        whiteSpace: 'pre-wrap',
        fontSize: '0.95em',
        lineHeight: '1.5',
        color: '#555',
        margin: '0',
    },
    closeButton: {
        padding: '10px 20px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginTop: '20px',
        transition: 'background-color 0.3s ease',
        '&:hover': {
            backgroundColor: '#5a6268',
        }
    },
};

export default ClientReviewApplications;
