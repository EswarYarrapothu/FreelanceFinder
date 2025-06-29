// server/routes/freelancerRoutes.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Import mongoose to use ObjectId for aggregation
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Project = require('../models/Project');
const Application = require('../models/Application');

// @route   GET /api/freelancer/dashboard-stats
// @desc    Get dashboard statistics for authenticated freelancer
// @access  Private (Freelancer only)
router.get('/dashboard-stats', protect, authorizeRoles('freelancer'), async (req, res) => {
    try {
        const freelancerId = req.user.id; // ID of the authenticated freelancer from authMiddleware
        const freelancerObjectId = new mongoose.Types.ObjectId(freelancerId); // Convert to ObjectId for aggregation

        // --- DEBUG LOGS FOR BACKEND ---
        console.log(`\n--- Freelancer Dashboard Stats Request for User ID: ${freelancerId} ---`);
        console.log(`Auth User Role: ${req.user.role}`);
        // --- END DEBUG LOGS ---

        // 1. Count active projects: Projects assigned to this freelancer, status 'assigned' or 'in progress'
        const activeProjectsCount = await Project.countDocuments({
            assignedTo: freelancerObjectId, // Use ObjectId for filtering
            status: { $in: ['assigned', 'in progress'] }
        });
        console.log(`  Active Projects found: ${activeProjectsCount}`);


        // 2. Count pending applications: Applications submitted BY this freelancer, status 'pending'
        const pendingApplicationsCount = await Application.countDocuments({
            freelancer: freelancerObjectId, // Use ObjectId for filtering
            status: 'pending'
        });
        console.log(`  Pending Applications found: ${pendingApplicationsCount}`);


        // 3. Count completed projects: Projects assigned to this freelancer, status 'completed'
        const completedProjectsCount = await Project.countDocuments({
            assignedTo: freelancerObjectId, // Use ObjectId for filtering
            status: 'completed'
        });
        console.log(`  Completed Projects found: ${completedProjectsCount}`);


        // 4. Calculate total earnings: Sum of bidAmount from applications that were accepted and belong
        //    to projects that are completed AND assigned to THIS freelancer.
        //    This query uses aggregation to get a precise sum.
        const earningsResult = await Application.aggregate([
            {
                $match: {
                    freelancer: freelancerObjectId, // Match applications by freelancer ID (ObjectId)
                    status: 'accepted'              // Only consider accepted applications
                }
            },
            {
                $lookup: {
                    from: 'projects', // The collection name for Project model (lowercase, plural)
                    localField: 'project',
                    foreignField: '_id',
                    as: 'projectDetails'
                }
            },
            {
                $unwind: '$projectDetails' // Deconstructs the projectDetails array
            },
            {
                $match: {
                    'projectDetails.status': 'completed',             // Ensure the linked project is completed
                    'projectDetails.assignedTo': freelancerObjectId   // Ensure the project is assigned to THIS freelancer (ObjectId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: '$bidAmount' } // Sum the bidAmount directly from the Application document
                }
            }
        ]);

        let totalEarnings = 0;
        if (earningsResult.length > 0) {
            totalEarnings = earningsResult[0].totalEarnings;
        }
        console.log(`  Total Earnings found: ${totalEarnings.toFixed(2)}\n`); // Ensure this logs what's returned

        res.json({
            activeProjects: activeProjectsCount,
            pendingApplications: pendingApplicationsCount,
            completedProjects: completedProjectsCount,
            earningsLastMonth: totalEarnings.toFixed(2) // Uses the calculated earnings based on bid amount
        });

    } catch (err) {
        console.error('Error fetching freelancer dashboard stats:', err.message);
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
});

module.exports = router;
