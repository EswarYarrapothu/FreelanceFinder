// client/src/pages/client/ClientDashboardOverview.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To access the user object

function ClientDashboardOverview() {
    const { isAuthenticated, userRole, user } = useAuth(); // ENSURE 'user' IS DESTRUCTURED HERE
    const [stats, setStats] = useState({
        totalPostedProjects: 0,
        activeProjects: 0,
        pendingApplications: 0,
        completedProjects: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Crucial check for user ID before making the API call
        if (!user || !user.id) {
            setError('User data not available. Please log in.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token || userRole !== 'client') {
                setError('Authentication required or not authorized.');
                toast.error('Please log in as a client to view this dashboard.');
                setLoading(false);
                return;
            }

            // CORRECT API CALL: Fetch client specific dashboard stats from the dedicated backend route
            const response = await fetch(`http://localhost:5000/api/client/dashboard-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch client dashboard stats.');
            }

            const data = await response.json();
            setStats({
                totalPostedProjects: data.totalPostedProjects || 0,
                activeProjects: data.activeProjects || 0,
                pendingApplications: data.pendingApplications || 0,
                completedProjects: data.completedProjects || 0,
            });

        } catch (err) {
            console.error('Error fetching client dashboard stats:', err);
            setError(err.message || 'Failed to load client dashboard data. Network error or server issue.');
            toast.error(`Error loading dashboard: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, userRole, user]); // Dependencies include 'user' object

    useEffect(() => {
        // Only fetch if authenticated as client and user object is available
        if (isAuthenticated && userRole === 'client' && user && user.id) {
            fetchDashboardStats();
        } else {
            setLoading(false); // Not authenticated or user data not ready, stop loading
        }
    }, [isAuthenticated, userRole, user, fetchDashboardStats]); // Re-run when auth state or user changes


    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Loading Your Client Dashboard...</h2>
                <p>Fetching your latest overview.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <h2>Error Loading Dashboard</h2>
                <p>{error}</p>
                <p>Please ensure you are logged in as a client and the backend server is running correctly.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Your Client Dashboard</h2>
            <p>Welcome back! Here's a quick overview of your projects and activities.</p>

            <div className="dashboard-cards-grid">
                {/* Stat Card: Total Posted Projects */}
                <div className="dashboard-card card-border-blue">
                    <h3>Total Posted Projects</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>{stats.totalPostedProjects}</p>
                    <p>All projects you've created</p>
                    <Link to="/client/my-posted-projects">
                        View All Projects &rarr;
                    </Link>
                </div>

                {/* Stat Card: Active Projects */}
                <div className="dashboard-card card-border-green">
                    <h3>Active Projects</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>{stats.activeProjects}</p>
                    <p>Projects currently in progress</p>
                    <Link to="/client/my-working-projects"> {/* CORRECTED LINK */}
                        View Active &rarr;
                    </Link>
                </div>

                {/* Stat Card: Pending Applications */}
                <div className="dashboard-card card-border-yellow">
                    <h3>Pending Applications</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#ffc107' }}>{stats.pendingApplications}</p>
                    <p>Applications awaiting your review</p>
                    <Link to="/client/review-applications"> {/* CORRECTED LINK */}
                        Review Applications &rarr;
                    </Link>
                </div>

                {/* Stat Card: Completed Projects */}
                <div className="dashboard-card card-border-purple">
                    <h3>Completed Projects</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#6f42c1' }}>{stats.completedProjects}</p>
                    <p>Projects successfully completed</p>
                    {/* CONFIRM THIS LINK: It passes a query parameter */}
                    <Link to="/client/my-posted-projects?status=completed">
                        View Completed &rarr;
                    </Link>
                </div>
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3>Quick Actions:</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '10px' }}><Link to="/client/new-project" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>Post a New Project</Link></li>
                    <li style={{ marginBottom: '10px' }}><Link to="/client/my-posted-projects" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>Manage All Your Posted Projects</Link></li>
                    <li style={{ marginBottom: '10px' }}><Link to="/client/profile" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>Manage My Profile</Link></li>
                </ul>
            </div>
        </div>
    );
}

export default ClientDashboardOverview;
