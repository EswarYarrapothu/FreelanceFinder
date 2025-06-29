import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [backendMessage, setBackendMessage] = useState('');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/test');
        if (response.ok) {
          const data = await response.json();
          setBackendStatus('Connected');
          setBackendMessage(data.message);
        } else {
          setBackendStatus('Error');
          setBackendMessage('Failed to connect to backend. Is the server running?');
        }
      } catch (error) {
        setBackendStatus('Error');
        setBackendMessage(`Error: Failed to connect to backend. Is the server running?`);
        console.error('Error connecting to backend:', error);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page-container">
      <section className="hero-section">
        <h1 className="hero-title">Welcome to the Freelance Platform!</h1>
        <p className="hero-subtitle">
          Connect with talented freelancers for your projects, or find exciting
          opportunities to showcase your skills.
        </p>

        <div className="backend-status-card card">
          <h3 className="status-title" style={{ color: backendStatus === 'Connected' ? '#28a745' : '#dc3545' }}>
            Backend Connection Status: {backendStatus}
          </h3>
          <p className="status-message">
            {backendMessage || 'Attempting to connect to the backend...'}
          </p>
          {backendStatus === 'Connected' && (
            <p className="status-info">
              This message confirms that your frontend (React) is successfully communicating with your backend (Node.js/Express).
            </p>
          )}
        </div>

        <div className="cta-buttons">
          <Link to="/login" className="btn-primary">
            Get Started
          </Link>
          <Link to="/admin-login" className="btn-secondary"> {/* UPDATED: Admin Portal link */}
            Admin Portal
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Landing;