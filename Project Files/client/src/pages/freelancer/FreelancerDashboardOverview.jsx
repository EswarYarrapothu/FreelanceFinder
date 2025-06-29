// client/src/pages/freelancer/FreelancerDashboardOverview.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To access the token and user ID

function FreelancerDashboardOverview() {
    const { isAuthenticated, userRole, user } = useAuth();
    const [stats, setStats] = useState({
        activeProjects: 0,
        pendingApplications: 0,
        completedProjects: 0,
        earningsLastMonth: '$0.00', // Initialize as string for currency display
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardStats = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Ensure user ID is available before fetching
        if (!user || !user.id) {
            setError('User data not available. Please log in.');
            setLoading(false);
            console.error('FreelancerDashboardOverview: User data not available for fetching stats.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token || userRole !== 'freelancer') {
                setError('Authentication required or not authorized.');
                toast.error('Please log in as a freelancer to view this dashboard.');
                setLoading(false);
                console.warn('FreelancerDashboardOverview: No token or not freelancer role.');
                return;
            }

            // Fetch freelancer specific dashboard stats from the backend endpoint
            const response = await fetch(`http://localhost:5000/api/freelancer/dashboard-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch freelancer dashboard stats.');
            }

            const data = await response.json();
            console.log("FreelancerDashboardOverview: Fetched stats:", data); // Debugging log
            setStats({
                activeProjects: data.activeProjects || 0,
                pendingApplications: data.applicationsSubmitted || 0, // Should be applicationsSubmitted from backend
                completedProjects: data.completedProjects || 0,
                earningsLastMonth: `$${parseFloat(data.totalEarnings || 0).toFixed(2)}`, // Use totalEarnings from backend
            });

        } catch (err) {
            console.error('Error fetching freelancer dashboard stats:', err);
            setError(err.message || 'Failed to load freelancer dashboard data. Network error or server issue.');
            toast.error(`Error loading dashboard: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [user, userRole]); // Dependencies for useCallback: user and userRole

    useEffect(() => {
        // Fetch stats only if authenticated as freelancer and user data is loaded
        if (isAuthenticated && userRole === 'freelancer' && user && user.id) {
            fetchDashboardStats();
        } else if (!isAuthenticated || userRole !== 'freelancer') {
            setLoading(false); // Stop loading if not authenticated or not a freelancer
            setError('Please log in as a freelancer to view your dashboard.');
        }
    }, [isAuthenticated, userRole, user, fetchDashboardStats]); // Re-run when auth state, user, or fetchDashboardStats changes

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Loading Your Freelancer Dashboard...</h2>
                <p>Fetching your latest overview.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <h2>Error Loading Dashboard</h2>
                <p>{error}</p>
                <p>Please ensure you are logged in as a freelancer and the backend server is running correctly.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Your Freelancer Dashboard</h2>
            <p>Welcome back! Here's a quick overview of your activities.</p>

            <div className="dashboard-cards-grid"> {/* Uses CSS grid for layout */}
                {/* Stat Card: Active Projects */}
                <div className="dashboard-card card-border-blue">
                    <h3>Active Projects</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>{stats.activeProjects}</p>
                    <p>Projects you are currently working on</p>
                    {/* FIX: Link to MyWorkingProjects with 'active' status filter */}
                    <Link to="/freelancer/my-projects?status=assigned,in%20progress" className="dashboard-card-link">
                        View Active Projects &rarr;
                    </Link>
                </div>

                {/* Stat Card: Pending Applications */}
                <div className="dashboard-card card-border-yellow">
                    <h3>Pending Applications</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#ffc107' }}>{stats.pendingApplications}</p>
                    <p>Applications awaiting client response</p>
                    {/* Link to MyApplications page, which already lists all applications */}
                    <Link to="/freelancer/my-applications" className="dashboard-card-link">
                        View Applications &rarr;
                    </Link>
                </div>

                {/* Stat Card: Completed Projects */}
                <div className="dashboard-card card-border-green">
                    <h3>Completed Projects</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>{stats.completedProjects}</p>
                    <p>Projects successfully finished</p>
                    {/* FIX: Link to MyWorkingProjects with 'completed' status filter */}
                    <Link to="/freelancer/my-projects?status=completed" className="dashboard-card-link">
                        View Completed Projects &rarr;
                    </Link>
                </div>

                {/* Stat Card: Total Earnings */}
                <div className="dashboard-card card-border-purple">
                    <h3>Total Earnings</h3> {/* Changed from 'Last Month' as it sums total completed */}
                    <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#6f42c1' }}>{stats.earningsLastMonth}</p>
                    <p>Total earnings from completed projects</p>
                    {/* Placeholder for future dedicated earnings page link */}
                    <Link to="#" onClick={() => toast.info('Earnings tracking and withdrawal functionality to be implemented.')}>
                        View Details &rarr;
                    </Link>
                </div>
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3>Quick Links:</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '10px' }}><Link to="/freelancer/all-projects" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>Browse New Projects</Link></li>
                    <li style={{ marginBottom: '10px' }}><Link to="/freelancer/my-applications" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>View Your Applications</Link></li>
                    <li style={{ marginBottom: '10px' }}><Link to="/freelancer/my-projects" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>Manage Your Active Projects</Link></li> {/* Corrected Link path */}
                </ul>
            </div>
        </div>
    );
}

export default FreelancerDashboardOverview;
