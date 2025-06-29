// client/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify'; // For displaying notifications
import { useNavigate } from 'react-router-dom'; // For programmatic navigation

// Define the API base URL from environment variables
// You need to create a .env file in your client directory (or project root, depending on setup)
// Example: REACT_APP_API_URL=http://localhost:5000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create the AuthContext with a default null value
const AuthContext = createContext(null);

// AuthProvider component wraps your application to provide authentication state
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false); // True if user is authenticated
    const [user, setUser] = useState(null); // Stores user object { id, username, email, role }
    const [userRole, setUserRole] = useState(null); // Stores the user's role for easy access
    const [loading, setLoading] = useState(true); // Loading state for initial authentication check
    const navigate = useNavigate(); // Hook for navigation

    // Logout function: Clears authentication state and token from local storage
    // shouldNavigate: true by default for explicit logouts, false for silent logouts (e.g., from token expiry)
    const logout = useCallback((shouldNavigate = true) => {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('token'); // Clear JWT from local storage
        // console.log('AuthContext: User logged out.'); // Debugging log
        toast.info('You have been logged out.'); // User notification
        if (shouldNavigate) {
            navigate('/'); // Redirect to landing page on explicit logout
        }
        setLoading(false); // Authentication state update complete
    }, [navigate]); // navigate is a dependency of useCallback

    // Function to validate token and set authentication state from backend
    const setAuthFromToken = useCallback(async (token) => {
        // console.log('AuthContext: setAuthFromToken called. Token present:', !!token); // Debugging log
        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            setUserRole(null);
            setLoading(false);
            // console.log('AuthContext: No token found. Setting isAuthenticated to false.'); // Debugging log
            return; // Exit if no token
        }

        try {
            // Make API call to backend to verify token and fetch user details
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Send token in Authorization header
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsAuthenticated(true);
                setUser(data.user);
                setUserRole(data.user.role);
                localStorage.setItem('token', token); // Ensure token is in local storage (important if it was from query param or initial login)
                // console.log('AuthContext: Token validated. User authenticated:', data.user.username, 'Role:', data.user.role); // Debugging log
            } else {
                // If token is invalid, expired, or backend returns an error
                const errorData = await response.json();
                // console.error('AuthContext: Token validation failed:', errorData.message); // Debugging error
                logout(false); // Call logout but prevent immediate navigation to avoid flicker/loop
                // toast.error(errorData.message || 'Session expired. Please log in again.'); // Optional: Show error toast
            }
        } catch (err) {
            // Handle network errors or other unexpected issues
            // console.error('AuthContext: Network or server error during token validation:', err); // Debugging error
            logout(false); // Call logout to clear state, but don't redirect
            // toast.error('Failed to connect to authentication server. Please try again later.'); // Optional: Show network error toast
        } finally {
            setLoading(false); // Authentication check completed, regardless of success or failure
            // Note: isAuthenticated in a log here might still reflect the previous state due to async updates.
        }
    }, [logout]); // logout is a dependency of useCallback

    // Login function: Sets authentication state and redirects user based on role
    const login = useCallback(async (token, userData) => {
        setIsAuthenticated(true);
        setUser(userData);
        setUserRole(userData.role);
        localStorage.setItem('token', token); // Store new token in local storage
        // console.log('AuthContext: Login successful for user:', userData.username, 'Role:', userData.role); // Debugging log

        // Navigate user to their respective dashboard based on role
        if (userData.role === 'admin') {
            navigate('/admin/dashboard');
        } else if (userData.role === 'client') {
            navigate('/client/dashboard');
        } else if (userData.role === 'freelancer') {
            navigate('/freelancer/dashboard');
        } else {
            navigate('/'); // Default fallback for unknown roles or if role is not provided
        }
        setLoading(false); // Loading state should be false once login is handled
    }, [navigate]); // navigate is a dependency of useCallback

    // useEffect hook for initial authentication check on component mount
    useEffect(() => {
        // console.log('AuthContext: Initial authentication check started in useEffect...'); // Debugging log
        const token = localStorage.getItem('token'); // Retrieve token from local storage
        if (token) {
            // console.log('AuthContext: Token found in localStorage. Calling setAuthFromToken.'); // Debugging log
            setAuthFromToken(token); // Validate token and set auth state
        } else {
            // console.log('AuthContext: No token found in localStorage. Setting loading to false directly.'); // Debugging log
            setLoading(false); // No token, so no authentication, set loading to false directly
        }
    }, [setAuthFromToken]); // setAuthFromToken is a stable function due to useCallback, so it's a safe dependency

    // The context value provided to consuming components
    const authContextValue = {
        isAuthenticated,
        user,
        userRole,
        loading, // Expose loading state so components can wait for auth check
        login,
        logout,
        setAuthFromToken // Expose if you need to manually trigger auth check from outside AuthProvider
    };

    return (
        // Provide the authentication context value to all children components
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to consume the authentication context
export const useAuth = () => {
    const context = useContext(AuthContext);
    // Throw an error if useAuth is used outside of an AuthProvider, helping developers
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context; // Return the context value
};
