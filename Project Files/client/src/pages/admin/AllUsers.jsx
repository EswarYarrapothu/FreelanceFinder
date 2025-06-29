// client/src/pages/admin/AllUsers.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To access the token and check role

function AllUsers() {
    const { isAuthenticated, userRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token || userRole !== 'admin') {
                setError('Unauthorized access. Please log in as an Admin.');
                setLoading(false);
                return;
            }

            const response = await fetch('http://localhost:5000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users.');
            }

            const data = await response.json();
            setUsers(data); // Assuming data is an array of user objects
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.message || 'Failed to load users.');
            toast.error(`Error loading users: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [userRole]); // Dependency on userRole

    useEffect(() => {
        if (isAuthenticated && userRole === 'admin') {
            fetchUsers();
        } else {
            setLoading(false); // If not admin, stop loading and clear data
            setUsers([]);
        }
    }, [isAuthenticated, userRole, fetchUsers]);

    // Placeholder for handling user edit/delete
    const handleEditUser = (userId) => {
        toast.info(`Edit user ID: ${userId} (Functionality to be implemented)`);
        // navigate(`/admin/edit-user/${userId}`);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return; // User cancelled
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete user.');
            }

            toast.success('User deleted successfully!');
            fetchUsers(); // Re-fetch users to update the list
        } catch (err) {
            console.error('Error deleting user:', err);
            toast.error(`Error deleting user: ${err.message}`);
        }
    };


    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading all users...</div>;
    }

    if (error) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>All Users</h2>
            <p>Manage all registered users on the platform.</p>

            {users.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #ccc', borderRadius: '8px', marginTop: '20px', backgroundColor: '#fff' }}>
                    <p style={{ fontSize: '1.1em', color: '#555' }}>No users found.</p>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            let formattedDate = 'N/A'; // Default to N/A
                            try {
                                if (user.createdAt) {
                                    const joinedDate = new Date(user.createdAt);
                                    // Check if the date is valid after attempting to parse
                                    if (!isNaN(joinedDate.getTime())) {
                                        formattedDate = joinedDate.toLocaleDateString();
                                    }
                                }
                            } catch (e) {
                                console.error(`Error parsing date for user ${user._id}:`, user.createdAt, e);
                                // formattedDate remains 'N/A'
                            }

                            return (
                                <tr key={user._id}>
                                    <td>{user._id.slice(-6)}</td> {/* Display last 6 chars of ID */}
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>{formattedDate}</td> {/* Use the robustly formatted date */}
                                    <td>
                                        <button onClick={() => handleEditUser(user._id)} className="admin-table button edit-btn">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteUser(user._id)} className="admin-table button delete-btn">
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

export default AllUsers;
