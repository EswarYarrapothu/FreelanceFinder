// client/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Import AuthProvider and useAuth hook ---
import { AuthProvider, useAuth } from './context/AuthContext'; 

// --- Import Common Layout and Top-Level Pages ---
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Authenticate from './pages/Authenticate';
import AboutUs from './pages/AboutUs';

// --- Import Freelancer Specific Components ---
import Freelancer from './pages/freelancer/Freelancer';
import FreelancerDashboardOverview from './pages/freelancer/FreelancerDashboardOverview';
import AllProjectsFreelancer from './pages/freelancer/AllProjects';
import MyApplicationsFreelancer from './pages/freelancer/MyApplications';
import MyWorkingProjectsFreelancer from './pages/freelancer/MyProjects'; 
import ProfileFreelancer from './pages/freelancer/Profile';
import ProjectDataFreelancer from './pages/freelancer/ProjectData';
import WorkingProjectFreelancer from './pages/freelancer/WorkingProject';

// --- Import Admin Specific Components ---
import Admin from './pages/admin/Admin';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview';
import AdminApplications from './pages/admin/AdminApplications';
import AdminProjects from './pages/admin/AdminProjects';
import AllUsers from './pages/admin/AllUsers';
import AdminLoginForm from './components/AdminLoginForm';

// --- Import Client Specific Components ---
import Client from './pages/client/Client';
import ClientDashboardOverview from './pages/client/ClientDashboardOverview';
import ClientMyProjects from './pages/client/MyProjects';
import ClientWorkingProjects from './pages/client/ClientWorkingProjects'; 
import NewProject from './pages/client/NewProject'; 
import ProjectApplicationsClient from './pages/client/ProjectApplications';
import ProjectWorkingClient from './pages/client/ProjectWorking';
import ClientProfile from './pages/client/Profile';
import ClientReviewApplications from './pages/client/ClientReviewApplications';

// --- Protected Route Components ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, loading } = useAuth(); // Get loading state

  console.log(`ProtectedRoute: Path check. Loading: ${loading}, Authenticated: ${isAuthenticated}, Role: ${userRole}, Allowed: ${allowedRoles ? allowedRoles.join(',') : 'Any'}`);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontSize: '1.2em' }}>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated after loading. Redirecting to /login.');
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`ProtectedRoute: User role "${userRole}" not allowed (${allowedRoles.join(', ')} required). Redirecting to /.`);
    return <Navigate to="/" replace />; 
  }
  console.log('ProtectedRoute: Access granted.');
  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, userRole, loading } = useAuth(); // Get loading state

  console.log(`AdminProtectedRoute: Path check. Loading: ${loading}, Authenticated: ${isAuthenticated}, Role: ${userRole}`);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center', fontSize: '1.2em' }}>Loading authentication...</div>;
  }

  if (!isAuthenticated || userRole !== 'admin') {
    console.log('AdminProtectedRoute: Not authenticated or not admin after loading. Redirecting to /admin-login.');
    return <Navigate to="/admin-login" replace />;
  }
  console.log('AdminProtectedRoute: Access granted.');
  return children;
};


function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      {/* AuthProvider wraps the entire application to provide authentication context */}
      <AuthProvider>
        <Routes>
          {/* Main layout route */}
          <Route path="/" element={<Layout />}> 

            {/* Public/Common Routes */}
            <Route index element={<Landing />} />
            <Route path="login" element={<Authenticate />} /> 
            <Route path="about-us" element={<AboutUs />} />

            {/* Admin Login Form Route */}
            <Route path="admin-login" element={<AdminLoginForm />} />

            {/* Freelancer Dashboard Routes - Protected */}
            <Route 
              path="freelancer" 
              element={
                <ProtectedRoute allowedRoles={['freelancer']}>
                  <Freelancer />
                </ProtectedRoute>
              }
            >
              <Route index element={<FreelancerDashboardOverview />} />
              <Route path="dashboard" element={<FreelancerDashboardOverview />} /> 
              <Route path="all-projects" element={<AllProjectsFreelancer />} />
              <Route path="my-applications" element={<MyApplicationsFreelancer />} />
              <Route path="my-projects" element={<MyWorkingProjectsFreelancer />} /> 
              <Route path="profile" element={<ProfileFreelancer />} />
              <Route path="project-data/:id" element={<ProjectDataFreelancer />} />
              <Route path="working-project/:id" element={<WorkingProjectFreelancer />} />
            </Route>

            {/* Admin Dashboard Routes - Protected */}
            <Route
              path="admin"
              element={
                <AdminProtectedRoute>
                  <Admin />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardOverview />} /> 
              {/* FIX: Add explicit dashboard path */}
              <Route path="dashboard" element={<AdminDashboardOverview />} /> 
              <Route path="users" element={<AllUsers />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="applications" element={<AdminApplications />} />
            </Route>

            {/* Client Dashboard Routes - Protected */}
            <Route 
              path="client" 
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <Client />
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientDashboardOverview />} />
              <Route path="dashboard" element={<ClientDashboardOverview />} />
              <Route path="new-project" element={<NewProject />} />
              <Route path="my-posted-projects" element={<ClientMyProjects />} />
              <Route path="my-working-projects" element={<ClientWorkingProjects />} /> 
              <Route path="view-applications/:projectId" element={<ProjectApplicationsClient />} /> 
              <Route path="working-project/:id" element={<ProjectWorkingClient />} />
              <Route path="profile" element={<ClientProfile />} /> 
              <Route path="review-applications" element={<ClientReviewApplications />} /> 
            </Route>

            {/* 404 Not Found Page */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', margin: '50px auto', maxWidth: '600px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '3em', marginBottom: '20px' }}>404 - Page Not Found</h1>
                <p style={{ fontSize: '1.2em', marginBottom: '20px' }}>The page you are looking for does not exist.</p>
                <Link to="/" style={{ textDecoration: 'none', backgroundColor: '#007bff', color: 'white', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold' }}>Go to Home</Link>
              </div>
            } />

          </Route> {/* End of the main Route element wrapped by Layout */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
