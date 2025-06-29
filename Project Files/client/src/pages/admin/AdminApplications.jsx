// client/src/pages/admin/AdminApplications.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To access the token and check role

function AdminApplications() {
    const { isAuthenticated, userRole } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This is a new backend route we'll need to add
    const API_URL = 'http://localhost:5000/api/applications/all'; // Proposed new endpoint for admin to get all applications

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token || userRole !== 'admin') {
                setError('Unauthorized access. Please log in as an Admin.');
                setLoading(false);
                return;
            }

            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch applications.');
            }

            const data = await response.json();
            setApplications(data); // Assuming data is an array of application objects
        } catch (err) {
            console.error('Error fetching admin applications:', err);
            setError(err.message || 'Failed to load applications.');
            toast.error(`Error loading applications: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [userRole]);

    useEffect(() => {
        if (isAuthenticated && userRole === 'admin') {
            fetchApplications();
        } else {
            setLoading(false);
            setApplications([]);
        }
    }, [isAuthenticated, userRole, fetchApplications]);

    const handleAcceptApplication = async (applicationId) => {
        if (!window.confirm('Are you sure you want to accept this application? This will assign the project to the freelancer.')) {
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
                body: JSON.stringify({ status: 'accepted' })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to accept application.');
            }

            toast.success('Application accepted successfully!');
            fetchApplications(); // Re-fetch applications to update the list
            // Potentially trigger a change in project status as well (backend handles this ideally)
        } catch (err) {
            console.error('Error accepting application:', err);
            toast.error(`Error accepting application: ${err.message}`);
        }
    };

    const handleRejectApplication = async (applicationId) => {
        if (!window.confirm('Are you sure you want to reject this application?')) {
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
                body: JSON.stringify({ status: 'rejected' })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to reject application.');
            }

            toast.success('Application rejected successfully!');
            fetchApplications(); // Re-fetch applications to update the list
        } catch (err) {
            console.error('Error rejecting application:', err);
            toast.error(`Error rejecting application: ${err.message}`);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading all applications...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Review Applications</h2>
            <p>Review all applications submitted by freelancers for various projects.</p>

            {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '20px', backgroundColor: '#fff' }}>
                    <p style={{ fontSize: '1.1em', color: '#555' }}>No applications found.</p>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>App ID</th>
                            <th>Project Title</th>
                            <th>Freelancer</th>
                            <th>Bid Amount</th>
                            <th>Cover Letter</th>
                            <th>Status</th>
                            <th>Applied Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map(app => {
                            const appliedDate = new Date(app.applicationDate);
                            const formattedDate = !isNaN(appliedDate.getTime()) ? appliedDate.toLocaleDateString() : 'N/A';

                            return (
                                <tr key={app._id}>
                                    <td>{app._id.slice(-6)}</td>
                                    <td>{app.project ? app.project.title : 'N/A'}</td> {/* Populate project title */}
                                    <td>{app.freelancer ? app.freelancer.username : 'N/A'}</td> {/* Populate freelancer username */}
                                    <td>{app.bidAmount}</td>
                                    <td>{app.coverLetter.substring(0, 50)}...</td> {/* Show snippet */}
                                    <td>{app.status}</td>
                                    <td>{formattedDate}</td>
                                    <td>
                                        <button onClick={() => toast.info(`Viewing application ID: ${app._id} (Details page to be implemented)`)} className="admin-table button view-btn">
                                            View
                                        </button>
                                        {app.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleAcceptApplication(app._id)} className="admin-table button approve-btn">
                                                    Accept
                                                </button>
                                                <button onClick={() => handleRejectApplication(app._id)} className="admin-table button reject-btn">
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {/* If status is accepted/rejected, no action buttons for now */}
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

export default AdminApplications;
