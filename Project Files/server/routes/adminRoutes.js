// server/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const User = require('../models/User'); // Import the User model
const Project = require('../models/Project'); // Import Project model for project stats
const Application = require('../models/Application'); // Import Application model for application stats

// @route   GET /api/admin/dashboard-stats
// @desc    Get dashboard statistics for admin
// @access  Private (Admin only)
router.get('/dashboard-stats', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        // Fetch total users
        const totalUsers = await User.countDocuments();

        // Fetch active projects (e.g., status is 'open' or 'assigned' or 'in progress')
        const activeProjects = await Project.countDocuments({ status: { $in: ['open', 'assigned', 'in progress'] } });

        // Fetch pending applications (e.g., status is 'pending')
        const pendingApplications = await Application.countDocuments({ status: 'pending' });

        // Calculate total revenue (sum 'budget' from completed projects)
        let totalRevenue = 0;
        const completedProjects = await Project.find({ status: 'completed' });

        totalRevenue = completedProjects.reduce((sum, project) => {
            // Attempt to parse budget from string. 
            // This assumes budget strings are simple numbers like "500" or "$1200".
            // If they are ranges (e.g., "$500 - $1000"), you'll need more complex parsing logic.
            const budgetValue = parseFloat(project.budget.replace(/[^0-9.]/g, '')) || 0; // Removes non-numeric chars except decimal point
            return sum + budgetValue;
        }, 0);

        res.json({
            totalUsers,
            activeProjects,
            pendingApplications,
            totalRevenue: totalRevenue.toFixed(2) // Format to 2 decimal places
        });

    } catch (err) {
        console.error('Error fetching admin dashboard stats:', err.message);
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users (for Admin All Users page)
// @access  Private (Admin only)
router.get('/users', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        // Fetch all users, excluding password
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error('Error fetching all users for admin:', err.message);
        res.status(500).json({ message: 'Server error fetching user data.' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user by ID (for Admin)
// @access  Private (Admin only)
router.delete('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Prevent admin from deleting themselves or other admins accidentally in simple setups
        // if (user.role === 'admin' && req.user.id !== userId) {
        //      return res.status(403).json({ message: 'Cannot delete another admin account.' });
        // }
        // For production, consider adding checks to ensure at least one admin remains or implement
        // a more sophisticated admin deletion policy.

        // --- NEW LOGIC: Cascade delete associated projects and applications if user is deleted ---
        // If the user being deleted is a client, delete their projects and associated applications
        if (user.role === 'client') {
            const clientProjects = await Project.find({ client: userId });
            for (const project of clientProjects) {
                await Application.deleteMany({ project: project._id });
                await Project.deleteOne({ _id: project._id });
                console.log(`Admin: Deleted project ${project._id} and its applications for client ${userId}`);
            }
        } 
        // If the user being deleted is a freelancer, set assignedTo to null for projects they were working on
        // and delete their applications.
        else if (user.role === 'freelancer') {
            await Project.updateMany({ assignedTo: userId }, { $set: { assignedTo: null, status: 'open' } }); // Reset status to open
            await Application.deleteMany({ freelancer: userId });
            console.log(`Admin: Detached freelancer ${userId} from projects and deleted their applications.`);
        }
        // --- END NEW LOGIC ---

        await User.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully.' });

    } catch (err) {
        console.error('Error deleting user:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid User ID.' });
        }
        res.status(500).json({ message: 'Server error deleting user.' });
    }
});

module.exports = router;
