// client/src/components/Layout.jsx

import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function Layout() {
    const { isAuthenticated, userRole, logout } = useAuth();
    const navigate = useNavigate(); 

    const handleLogout = () => {
        logout(); 
    };

    // Inline styles (retained for consistency with your project's current styling approach)
    const headerStyle = {
        backgroundColor: '#4CAF50', // Green header background
        color: 'white',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };

    const logoStyle = {
        fontSize: '1.8em',
        fontWeight: 'bold',
        textDecoration: 'none',
        color: 'white'
    };

    const navLinksStyle = {
        display: 'flex',
        gap: '25px'
    };

    const linkStyle = {
        color: 'white',
        textDecoration: 'none',
        fontSize: '1.1em',
        padding: '8px 0',
        transition: 'border-bottom 0.2s ease',
        borderBottom: '2px solid transparent'
    };

    const linkHoverStyle = {
        borderBottom: '2px solid white'
    };

    const buttonStyle = {
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        backgroundColor: '#007bff', // Blue button
        color: 'white',
        fontSize: '1em',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease'
    };

    const buttonHoverStyle = {
        backgroundColor: '#0056b3' // Darker blue on hover
    };

    return (
        <div>
            <header style={headerStyle}>
                <Link to="/" style={logoStyle}>SB Works</Link>
                <nav>
                    <div style={navLinksStyle}>
                        <Link 
                            to="/" 
                            style={linkStyle} 
                            onMouseEnter={e => Object.assign(e.currentTarget.style, linkHoverStyle)}
                            onMouseLeave={e => Object.assign(e.currentTarget.style, linkStyle)}
                        >
                            Home
                        </Link>
                        <Link 
                            to="/about-us" 
                            style={linkStyle}
                            onMouseEnter={e => Object.assign(e.currentTarget.style, linkHoverStyle)}
                            onMouseLeave={e => Object.assign(e.currentTarget.style, linkStyle)}
                        >
                            About Us
                        </Link>

                        {/* Conditional rendering based on isAuthenticated from context */}
                        {!isAuthenticated ? (
                            <Link 
                                to="/login" 
                                style={buttonStyle}
                                onMouseEnter={e => Object.assign(e.currentTarget.style, buttonHoverStyle)}
                                onMouseLeave={e => Object.assign(e.currentTarget.style, buttonStyle)}
                            >
                                Login/Register
                            </Link>
                        ) : (
                            <>
                                {/* Render dashboard links based on userRole from context */}
                                {userRole === 'admin' && (
                                    <Link 
                                        to="/admin/dashboard" 
                                        style={linkStyle}
                                        onMouseEnter={e => Object.assign(e.currentTarget.style, linkHoverStyle)}
                                        onMouseLeave={e => Object.assign(e.currentTarget.style, linkStyle)}
                                    >
                                        Admin Dashboard
                                    </Link>
                                )}
                                {userRole === 'client' && (
                                    <Link 
                                        to="/client/dashboard" 
                                        style={linkStyle}
                                        onMouseEnter={e => Object.assign(e.currentTarget.style, linkHoverStyle)}
                                        onMouseLeave={e => Object.assign(e.currentTarget.style, linkStyle)}
                                    >
                                        Client Dashboard
                                    </Link>
                                )}
                                {userRole === 'freelancer' && (
                                    <Link 
                                        to="/freelancer/dashboard" 
                                        style={linkStyle}
                                        onMouseEnter={e => Object.assign(e.currentTarget.style, linkHoverStyle)}
                                        onMouseLeave={e => Object.assign(e.currentTarget.style, linkStyle)}
                                    >
                                        Freelancer Dashboard
                                    </Link>
                                )}
                                {/* Logout button - calls handleLogout which triggers AuthContext's logout */}
                                <button 
                                    onClick={handleLogout} 
                                    style={buttonStyle}
                                    onMouseEnter={e => Object.assign(e.currentTarget.style, buttonHoverStyle)}
                                    onMouseLeave={e => Object.assign(e.currentTarget.style, buttonStyle)}
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </nav>
            </header>
            <main> 
                <Outlet /> {/* Outlet renders the current route's component */}
            </main>
        </div>
    );
}

export default Layout;
