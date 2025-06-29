import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

function Client() {
  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <h2 className="sidebar-heading">Client Portal</h2>
        <ul className="sidebar-nav-list">
          <li className="sidebar-nav-item">
            {/* NavLink to the base client dashboard */}
            <NavLink to="/client" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard Overview
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            {/* NavLink to post a new project */}
            <NavLink to="/client/new-project" className={({ isActive }) => (isActive ? 'active' : '')}>
              Post New Project
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            {/* NavLink to view client's posted projects */}
            <NavLink to="/client/my-posted-projects" className={({ isActive }) => (isActive ? 'active' : '')}>
              My Posted Projects
            </NavLink>
          </li>
          <li className="sidebar-nav-item">
            <NavLink to="/client/my-working-projects" className={({ isActive }) => (isActive ? 'active' : '')}>
              My Working Project
            </NavLink>          
          </li>
          {/* Add the NavLink for Client Profile */}
          <li className="sidebar-nav-item">
            <NavLink to="/client/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
              Profile
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
        <Outlet /> {/* Renders nested client routes */}
      </main>
    </div>
  );
}

export default Client;
  