

import React from 'react';
import { Outlet, NavLink } from 'react-router-dom'; 

function Admin() {
  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <h2 className="sidebar-heading">Admin Portal</h2>
        <ul className="sidebar-nav-list">
          <li className="sidebar-nav-item">
            <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard Overview
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'active' : '')}>
              All Users 
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/admin/projects" className={({ isActive }) => (isActive ? 'active' : '')}>
              Manage Projects
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/admin/applications" className={({ isActive }) => (isActive ? 'active' : '')}>
              Review Applications
            </NavLink>
          </li>
          {/* Note: view-applications will likely need a project ID to be useful,
               so this might be a link from a specific project detail page later */}
          {/* <li className="sidebar-nav-item">
            <NavLink to="/client/view-applications" className={({ isActive }) => (isActive ? 'active' : '')}>
              View Applications
            </NavLink>
          </li> */}
          {/* Add more client specific links here */}
        </ul>
      </aside>
      <main className="dashboard-content">
        <Outlet /> {/* Renders nested Admin routes */}
      </main>
    </div>
  );
}

export default Admin;