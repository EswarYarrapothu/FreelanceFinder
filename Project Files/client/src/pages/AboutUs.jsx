import React from 'react';

function AboutUs() {
  return (
    <div style={{
      padding: '40px 20px',
      maxWidth: '900px',
      margin: '40px auto',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <h1 style={{ fontSize: '2.5em', color: '#28a745', marginBottom: '25px', textAlign: 'center' }}>
        About Our Freelance Platform
      </h1>

      <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555', marginBottom: '20px' }}>
        Welcome to the Freelance Platform! We are dedicated to connecting talented freelancers with clients seeking specialized services. Our mission is to empower individuals to build their careers on their own terms, while providing businesses with access to a global pool of expert talent.
      </p>

      <h2 style={{ fontSize: '1.8em', color: '#007bff', marginBottom: '15px', marginTop: '30px' }}>
        Our Vision
      </h2>
      <p style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555', marginBottom: '20px' }}>
        We envision a world where talent knows no boundaries and opportunities are limitless. By fostering a secure, efficient, and transparent marketplace, we aim to redefine the future of work for both freelancers and clients.
      </p>

      <h2 style={{ fontSize: '1.8em', color: '#ffc107', marginBottom: '15px', marginTop: '30px' }}>
        What We Offer
      </h2>
      <ul style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555', listStyleType: 'disc', paddingLeft: '25px' }}>
        <li style={{ marginBottom: '10px' }}>
          **For Freelancers:** A diverse range of projects, secure payment options, portfolio showcasing tools, and a supportive community.
        </li>
        <li style={{ marginBottom: '10px' }}>
          **For Clients:** Access to a vetted pool of professionals, seamless project management tools, transparent bidding, and quality assurance.
        </li>
        <li style={{ marginBottom: '10px' }}>
          **Robust Support:** Our dedicated support team is always here to assist with any queries or challenges.
        </li>
      </ul>

      <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <p style={{ fontSize: '1.1em', color: '#666' }}>
          Join us today and be a part of the future of freelancing!
        </p>
      </div>
    </div>
  );
}

export default AboutUs;