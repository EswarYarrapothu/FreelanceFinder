/* check the freelancer page in: http://localhost:3000/freelancer */

import React from 'react';
import { Outlet, NavLink } from 'react-router-dom'; 

function Freelancer() {
  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <h2 className="sidebar-heading">Freelancer Panel</h2>
        <ul className="sidebar-nav-list">
          <li className="sidebar-nav-item">
            <NavLink to="/freelancer" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard Overview
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/freelancer/all-projects" className={({ isActive }) => (isActive ? 'active' : '')}>
              Browse Projects
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/freelancer/my-applications" className={({ isActive }) => (isActive ? 'active' : '')}>
              My Applications
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/freelancer/my-projects" className={({ isActive }) => (isActive ? 'active' : '')}>
              My Working Projects
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/freelancer/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
              My Profile
            </NavLink>
          </li>
          {/* Add more freelancer specific links here */}
        </ul>
      </aside>
      <main className="dashboard-content">
        <Outlet /> {/* Renders nested freelancer routes */}
      </main>
    </div>
  );
}

export default Freelancer;