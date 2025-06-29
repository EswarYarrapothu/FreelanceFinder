// client/src/pages/admin/AdminDashboardOverview.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get token and role

function AdminDashboardOverview() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeProjects: 0,
        pendingApplications: 0,
        totalRevenue: 0.00
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { isAuthenticated, userRole } = useAuth(); // Get isAuthenticated and userRole from context

    useEffect(() => {
        const fetchDashboardStats = async () => {
            setLoading(true);
            setError(null);

            console.log('AdminDashboardOverview: Fetching dashboard stats...'); // Debugging
            console.log('AdminDashboardOverview: isAuthenticated:', isAuthenticated); // Debugging
            console.log('AdminDashboardOverview: userRole from context:', userRole); // Debugging

            try {
                const token = localStorage.getItem('token'); // Get token from localStorage
                console.log('AdminDashboardOverview: Token from localStorage:', token ? token.substring(0, 10) + '...' : 'No token'); // Debugging
                
                if (!token || userRole !== 'admin') {
                    const authErrorMsg = !token ? 'No authentication token found.' : 'User is not an administrator.';
                    setError(authErrorMsg + ' Please log in as an administrator.');
                    toast.error(`Authentication required: ${authErrorMsg}`);
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`, // Send the token in the Authorization header
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats({
                        totalUsers: data.totalUsers || 0,
                        activeProjects: data.activeProjects || 0,
                        pendingApplications: data.pendingApplications || 0,
                        totalRevenue: parseFloat(data.totalRevenue || 0).toFixed(2)
                    });
                    console.log('AdminDashboardOverview: Successfully fetched stats:', data); // Debugging
                } else {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || `Server responded with status ${response.status}. Please check permissions.`;
                    setError(errorMessage);
                    toast.error(`Error: ${errorMessage}`);
                    console.error('AdminDashboardOverview: Server error on fetch:', errorMessage, errorData); // Debugging
                }
            } catch (err) {
                console.error('AdminDashboardOverview: Catch block error fetching admin dashboard stats:', err); // Debugging
                setError(err.message || 'Failed to fetch dashboard data. Network error or server issue.');
                toast.error(`Failed to fetch: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if isAuthenticated and userRole is admin, or if an existing token exists on load
        // to ensure we attempt a fetch if the user refreshed the page.
        if (isAuthenticated && userRole === 'admin') {
            fetchDashboardStats();
        } else {
            // Attempt to fetch once even if context hasn't fully updated yet, rely on backend auth check
            // Or if userRole is not admin, stop loading state
            const token = localStorage.getItem('token');
            const storedRole = localStorage.getItem('userRole');
            if (token && storedRole === 'admin') {
                 fetchDashboardStats(); // Try fetching if localStorage looks correct
            } else {
                setLoading(false);
                setError('Authentication error. Please ensure you are logged in as an administrator.');
                toast.error('Not authorized to view admin dashboard.');
            }
        }
    }, [isAuthenticated, userRole]); // Re-run if auth state from context changes

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Loading Admin Dashboard...</h2>
                <p>Fetching the latest data from the server.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <h2>Error Loading Dashboard</h2>
                <p>{error}</p>
                <p>Please ensure you are logged in as an administrator and the backend server is running correctly.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Welcome, Admin!</h2>
            <p>This is your central hub to manage the platform.</p>
            <p>Use the sidebar to navigate through administrative functions.</p>

            {/* Quick links/summary cards - Using CSS classes now */}
            <div className="dashboard-cards-grid">
                {/* Card 1: Total Users */}
                <div className="dashboard-card card-border-blue">
                    <h3 style={{ marginBottom: '10px' }}>Total Users</h3>
                    <p>{stats.totalUsers}</p>
                    <p style={{ color: '#555' }}>All registered users</p>
                    <Link to="/admin/users">
                        View All Users &rarr;
                    </Link>
                </div>

                {/* Card 2: Active Projects */}
                <div className="dashboard-card card-border-green">
                    <h3 style={{ marginBottom: '10px' }}>Active Projects</h3>
                    <p>{stats.activeProjects}</p>
                    <p style={{ color: '#555' }}>Projects currently ongoing</p>
                    <Link to="/admin/projects">
                        View All Projects &rarr;
                    </Link>
                </div>

                {/* Card 3: Pending Applications */}
                <div className="dashboard-card card-border-yellow">
                    <h3 style={{ marginBottom: '10px' }}>Pending Applications</h3>
                    <p>{stats.pendingApplications}</p>
                    <p style={{ color: '#555' }}>Applications awaiting review</p>
                    <Link to="/admin/applications">
                        Review Applications &rarr;
                    </Link>
                </div>

                {/* Card 4: Total Revenue (Est.) */}
                <div className="dashboard-card card-border-purple">
                    <h3 style={{ marginBottom: '10px' }}>Total Revenue (Est.)</h3>
                    <p>${stats.totalRevenue}</p>
                    <p style={{ color: '#555' }}>Estimated earnings from projects</p>
                    <span style={{ fontSize: '1.0em', display: 'block', marginTop: '10px' }}>
                        View Analytics &rarr;
                    </span>
                </div>
            </div>

            {/* Quick Actions section */}
            <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3>Admin Quick Actions:</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: '10px' }}><Link to="/admin/add-user" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>Add New User</Link></li>
                    <li style={{ marginBottom: '10px' }}><Link to="/admin/post-announcement" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>Post a Global Announcement</Link></li>
                    <li style={{ marginBottom: '10px' }}><Link to="/admin/settings" style={{ textDecoration: 'none', color: '#007bff', fontSize: '1.1em' }}>Manage Platform Settings</Link></li>
                </ul>
            </div>
        </div>
    );
}

export default AdminDashboardOverview;
