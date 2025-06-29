// client/src/pages/client/NewProject.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext'; // To access the token

function NewProject() {
    const navigate = useNavigate();
    const { isAuthenticated, userRole } = useAuth(); // Get auth state for token

    const [projectTitle, setProjectTitle] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectBudget, setProjectBudget] = useState('');
    // Removed projectDeadline for now as your backend Project model doesn't have it,
    // and skillsRequired will be parsed from a string
    const [skillsInput, setSkillsInput] = useState(''); // Input for comma-separated skills
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!isAuthenticated || userRole !== 'client') {
            toast.error('You must be logged in as a client to post a project.');
            setLoading(false);
            return;
        }

        // Parse skills from comma-separated string into an array
        const skillsRequiredArray = skillsInput
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill !== ''); // Remove empty strings

        try {
            const token = localStorage.getItem('token'); // Get the user's token

            const response = await fetch('http://localhost:5000/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Send the token
                },
                body: JSON.stringify({
                    title: projectTitle,
                    description: projectDescription,
                    budget: projectBudget,
                    skillsRequired: skillsRequiredArray // Send as array
                    // Omit projectDeadline if not present in your Project model
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Project posted successfully!');
                // Clear the form
                setProjectTitle('');
                setProjectDescription('');
                setProjectBudget('');
                setSkillsInput('');
                // Redirect to My Posted Projects page
                navigate('/client/my-posted-projects');
            } else {
                toast.error(data.message || 'Failed to post project. Please check your input.');
            }
        } catch (error) {
            console.error('Error posting project:', error);
            toast.error('Network error. Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    // Inline styles (retained for consistency, consider moving to CSS file later)
    const formContainerStyle = { maxWidth: '800px', margin: '0 auto', padding: '20px' };
    const formCardStyle = {
        marginTop: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '25px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };
    const formGroupStyle = { marginBottom: '15px' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
    const inputTextAreaStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' };
    const buttonStyle = {
        padding: '12px 25px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1.1em',
        width: '100%',
        transition: 'background-color 0.3s ease'
    };
    const buttonHoverStyle = {
        backgroundColor: '#218838' // Darker green on hover
    };


    return (
        <div style={formContainerStyle}>
            <h2>Post a New Project</h2>
            <p>Fill in the details below to post your project and find the perfect freelancer.</p>

            <form onSubmit={handleSubmit} style={formCardStyle}>
                <div style={formGroupStyle}>
                    <label htmlFor="projectTitle" style={labelStyle}>Project Title:</label>
                    <input
                        type="text"
                        id="projectTitle"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="e.g., Build a Responsive E-commerce Website"
                        required
                        style={inputTextAreaStyle}
                        disabled={loading}
                    />
                </div>

                <div style={formGroupStyle}>
                    <label htmlFor="projectDescription" style={labelStyle}>Project Description:</label>
                    <textarea
                        id="projectDescription"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Provide a detailed description of your project, including goals, features, and expectations."
                        rows="6"
                        required
                        style={inputTextAreaStyle}
                        disabled={loading}
                    ></textarea>
                </div>

                <div style={formGroupStyle}>
                    <label htmlFor="projectBudget" style={labelStyle}>Budget (e.g., $500 - $1000):</label>
                    <input
                        type="text"
                        id="projectBudget"
                        value={projectBudget}
                        onChange={(e) => setProjectBudget(e.target.value)}
                        placeholder="e.g., $500 - $1000 or Fixed Price"
                        required
                        style={inputTextAreaStyle}
                        disabled={loading}
                    />
                </div>

                {/* Removed projectDeadline as per Project model */}
                
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="skillsInput" style={labelStyle}>Skills Required (comma-separated):</label>
                    <input
                        type="text"
                        id="skillsInput"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        placeholder="e.g., React, Node.js, UI/UX, Copywriting"
                        style={inputTextAreaStyle}
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
                    {loading ? 'Posting Project...' : 'Post Project'}
                </button>
            </form>
        </div>
    );
}

export default NewProject;
