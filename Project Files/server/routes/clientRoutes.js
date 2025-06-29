// server/routes/clientRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Project = require('../models/Project'); // Assuming you have a Project model
const Application = require('../models/Application'); // Assuming you have an Application model

// @route   GET /api/client/dashboard-stats
// @desc    Get dashboard statistics for authenticated client
// @access  Private (Client only)
router.get('/dashboard-stats', protect, authorizeRoles('client'), async (req, res) => {
    try {
        const clientId = req.user.id; // ID of the authenticated client

        // 1. Total Posted Projects: Projects created by this client
        const totalPostedProjectsCount = await Project.countDocuments({
            client: clientId
        });
        console.log(`Client Stats: Total Posted Projects for ${clientId}: ${totalPostedProjectsCount}`);

        // 2. Active Projects: Projects created by this client, status 'assigned' or 'in progress'
        const activeProjectsCount = await Project.countDocuments({
            client: clientId,
            status: { $in: ['assigned', 'in progress'] }
        });
        console.log(`Client Stats: Active Projects for ${clientId}: ${activeProjectsCount}`);

        // 3. Pending Applications: Applications for projects created by this client, with status 'pending'
        // This needs to count applications for all projects owned by the client
        const clientProjects = await Project.find({ client: clientId }).select('_id'); // Get all project IDs for this client
        const projectIds = clientProjects.map(project => project._id);

        const pendingApplicationsCount = await Application.countDocuments({
            project: { $in: projectIds }, // Filter by projects owned by the client
            status: 'pending'
        });
        console.log(`Client Stats: Pending Applications for client's projects: ${pendingApplicationsCount}`);

        // 4. Completed Projects: Projects created by this client, status 'completed'
        const completedProjectsCount = await Project.countDocuments({
            client: clientId,
            status: 'completed'
        });
        console.log(`Client Stats: Completed Projects for ${clientId}: ${completedProjectsCount}`);
        
        res.json({
            totalPostedProjects: totalPostedProjectsCount,
            activeProjects: activeProjectsCount,
            pendingApplications: pendingApplicationsCount,
            completedProjects: completedProjectsCount,
        });

    } catch (err) {
        console.error('Error fetching client dashboard stats (clientRoutes.js):', err.message);
        res.status(500).json({ message: 'Server error fetching client dashboard data.' });
    }
});

module.exports = router;
