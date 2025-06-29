// client/src/components/Login.jsx
// NOTE: Your App.js currently routes '/login' to Authenticate.jsx.
// This file is provided for completeness if you decide to use it separately.

import React, { useState } from 'react';
import { toast } from 'react-toastify'; // For notifications
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Get the login function from AuthContext
    const { login } = useAuth(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // API call to your backend login endpoint
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // IMPORTANT: Call the login function from AuthContext
                // It now expects token, role, AND the full user object
                login(data.token, data.user.role, data.user); 
                // AuthContext handles the toast.success and redirection
            } else {
                // Display error message from backend or a generic one
                toast.error(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    // Inline styles (mimicking the styles seen in Authenticate.jsx and AdminLoginForm.jsx)
    const containerStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        background: '#f0f2f5'
    };

    const authCardStyle = {
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
    };

    const inputStyle = {
        width: 'calc(100% - 20px)', // Full width minus padding
        padding: '12px 10px',
        margin: '0 auto 15px auto', // Consistent margin
        borderRadius: '5px',
        border: '1px solid #ddd',
        fontSize: '1em',
        boxSizing: 'border-box' // Ensures padding doesn't increase width
    };

    const buttonStyle = {
        width: '100%',
        padding: '12px',
        borderRadius: '5px',
        border: 'none',
        background: '#007bff',
        color: 'white',
        fontSize: '1.1em',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease'
    };

    const buttonHoverStyle = {
        backgroundColor: '#0056b3' // Darker blue on hover
    };

    return (
        <div style={containerStyle}>
            <div style={authCardStyle}>
                <h2 style={{ marginBottom: '25px', color: '#333' }}>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={inputStyle}
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={loading ? { ...buttonStyle, opacity: 0.7, cursor: 'not-allowed' } : buttonStyle}
                        onMouseEnter={e => !loading && Object.assign(e.currentTarget.style, { ...buttonStyle, ...buttonHoverStyle })}
                        onMouseLeave={e => !loading && Object.assign(e.currentTarget.style, buttonStyle)}
                    >
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
