import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header style={{
      background: '#333',
      color: 'white',
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'fixed', // Keep it at the top
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000 
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.4em' }}>SB Works</div>
      <nav>
        <Link to="/" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>Home</Link>
        <Link to="/login" style={{ color: 'white', margin: '0 15px', textDecoration: 'none' }}>Login/Register</Link>
        {/* You might add conditional rendering here for Admin/Freelancer/Client links if logged in */}
      </nav>
    </header>
  );
}

export default Navbar;