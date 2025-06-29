// client/src/pages/Authenticate.jsx

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function Authenticate() {
    const [isLogin, setIsLogin] = useState(true); // true for login, false for register
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('freelancer'); // Default role for registration

    const { login } = useAuth(); // Destructure login function from context
    const navigate = useNavigate(); // Get navigate hook

    const handleAuth = async (e) => {
        e.preventDefault();

        const endpoint = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
        const body = isLogin ? { email, password } : { username, email, password, role };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                if (isLogin) {
                    login(data.token, data.user); 
                } else {
                    toast.info('Registration successful! Logging you in...');
                    login(data.token, data.user);
                }
            } else {
                toast.error(data.message || 'Authentication failed.');
            }
        } catch (err) {
            console.error('Authentication error:', err);
            toast.error('Network error. Please try again.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.authBox}>
                <h2 style={styles.heading}>{isLogin ? 'Login' : 'Register'}</h2>
                <form onSubmit={handleAuth} style={styles.form}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {!isLogin && (
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            style={styles.select}
                        >
                            <option value="freelancer">Freelancer</option>
                            <option value="client">Client</option>
                        </select>
                    )}
                    <button type="submit" style={styles.button}>
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>
                <p style={styles.toggleText}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span onClick={() => setIsLogin(!isLogin)} style={styles.toggleLink}>
                        {isLogin ? 'Register' : 'Login'}
                    </span>
                </p>
            </div>
        </div>
    );
}

// Updated inline styles for a more organized look
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 60px)', // Adjust for header height if applicable
        backgroundColor: '#f0f2f5', // Light background
        padding: '20px',
        fontFamily: 'Inter, sans-serif', // Consistent font
    },
    authBox: {
        backgroundColor: 'white',
        padding: '40px', // Increased padding for more breathing room
        borderRadius: '12px', // More rounded corners
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)', // More prominent shadow
        width: '100%',
        maxWidth: '450px', // Slightly wider for better field appearance
        textAlign: 'center',
        transition: 'transform 0.3s ease', // Smooth transition on hover (optional)
        // '&:hover': { // This would require a CSS-in-JS library like styled-components or Emotion
        //     transform: 'translateY(-5px)',
        // }
    },
    heading: {
        marginBottom: '30px', // More space below heading
        color: '#333',
        fontSize: '1.8em', // Slightly larger heading
        fontWeight: '600', // Bolder heading
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px', // Increased gap between form elements
    },
    input: {
        padding: '14px 18px', // Increased padding inside input
        border: '1px solid #e0e0e0', // Lighter border
        borderRadius: '8px', // Rounded input fields
        fontSize: '1.05em',
        outline: 'none', // Remove default outline on focus
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        '&:focus': {
            borderColor: '#007bff', // Highlight border on focus
            boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.25)', // Subtle glow
        },
    },
    select: {
        padding: '14px 18px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        fontSize: '1.05em',
        backgroundColor: 'white',
        outline: 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        '&:focus': {
            borderColor: '#007bff',
            boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.25)',
        },
    },
    button: {
        padding: '15px 25px', // Larger button
        backgroundColor: '#007bff', // Primary blue color
        color: 'white',
        border: 'none',
        borderRadius: '8px', // Rounded button
        fontSize: '1.15em', // Larger text
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, transform 0.1s ease',
        boxShadow: '0 4px 10px rgba(0, 123, 255, 0.2)', // Button shadow
        '&:hover': {
            backgroundColor: '#0056b3', // Darker blue on hover
            transform: 'translateY(-2px)', // Slight lift effect
        },
        '&:active': {
            transform: 'translateY(0)', // Press effect
        },
    },
    toggleText: {
        marginTop: '25px', // More space above toggle text
        color: '#555',
        fontSize: '0.95em',
    },
    toggleLink: {
        color: '#007bff',
        cursor: 'pointer',
        fontWeight: 'bold',
        textDecoration: 'none',
        transition: 'color 0.3s ease',
        '&:hover': {
            color: '#0056b3', // Darker blue on hover
            textDecoration: 'underline',
        },
    },
};

export default Authenticate;