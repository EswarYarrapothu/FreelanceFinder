// server/routes/applicationRoutes.js

const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Project = require('../models/Project');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const mongoose = require('mongoose'); // For ObjectId validation

// @route   POST /api/applications
// @desc    Submit a new application
// @access  Private (Freelancers only)
router.post('/', protect, authorizeRoles('freelancer'), async (req, res) => {
    const { projectId, bidAmount, coverLetter } = req.body;
    const freelancerId = req.user?.id; // Safely get freelancerId from authenticated user

    console.log(`\n--- Backend DEBUG: Starting POST /api/applications ---`);
    console.log(`Backend DEBUG: Incoming Request Body:`, req.body);
    console.log(`Backend DEBUG: Authenticated Freelancer ID (req.user.id):`, freelancerId);

    try {
        // --- 1. Basic Input Validation ---
        if (!projectId || bidAmount === undefined || coverLetter === undefined) { 
            const msg = 'Please provide project ID, bid amount, and cover letter.';
            console.error(`Backend DEBUG: Validation Error: Missing required fields. ${msg}`);
            return res.status(400).json({ message: msg });
        }

        // --- 2. Validate Freelancer ID Presence ---
        if (!freelancerId) {
            const msg = 'Freelancer ID is missing. User must be logged in.';
            console.error(`Backend DEBUG: Authorization Error: ${msg}`);
            return res.status(401).json({ message: msg });
        }

        // --- 3. Validate Project ID Format ---
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            const msg = 'Invalid Project ID format provided.';
            console.error(`Backend DEBUG: Validation Error: Invalid projectId format: ${projectId}. ${msg}`);
            return res.status(400).json({ message: msg });
        }

        // --- 4. Validate Bid Amount ---
        const parsedBidAmount = parseFloat(bidAmount);
        if (isNaN(parsedBidAmount) || parsedBidAmount <= 0) {
            const msg = 'Bid amount must be a positive number.';
            console.error(`Backend DEBUG: Validation Error: Invalid bid amount. ${msg}`);
            return res.status(400).json({ message: msg });
        }

        // --- 5. Check if freelancer already applied to this project (using the unique index) ---
        console.log(`Backend DEBUG: Checking for existing application for Project ID: ${projectId}, Freelancer ID: ${freelancerId}`);
        const existingApplication = await Application.findOne({ project: projectId, freelancer: freelancerId });
        if (existingApplication) {
            const msg = 'You have already applied for this project.';
            console.warn(`Backend DEBUG: Attempt to re-apply: Freelancer ${freelancerId} already applied to project ${projectId}.`);
            console.log(`Backend DEBUG: Existing application found:`, existingApplication);
            return res.status(400).json({ message: msg });
        }
        console.log(`Backend DEBUG: No existing application found.`);

        // --- 6. Verify project exists and is 'open' ---
        console.log(`Backend DEBUG: Verifying project status for Project ID: ${projectId}`);
        const project = await Project.findById(projectId);
        if (!project) {
            const msg = 'Project not found or may have been deleted.';
            console.error(`Backend DEBUG: Application Error: Project ${projectId} not found in database. ${msg}`);
            return res.status(404).json({ message: msg });
        }
        if (project.status !== 'open') {
            const msg = `This project is not currently open for applications. Current status: ${project.status}`;
            console.warn(`Backend DEBUG: Application Error: Project ${projectId} is not open for applications. ${msg}`);
            return res.status(400).json({ message: msg });
        }
        console.log(`Backend DEBUG: Project found and is open. Project title: ${project.title}, Status: ${project.status}`);

        // --- 7. Create new application instance ---
        console.log(`Backend DEBUG: Creating new application instance.`);
        const newApplication = new Application({
            project: projectId,
            freelancer: freelancerId,
            bidAmount: parsedBidAmount,
            coverLetter
        });

        // --- 8. Save the application to the database ---
        console.log(`Backend DEBUG: Attempting to save new application:`, newApplication);
        const application = await newApplication.save();
        console.log(`Backend DEBUG: Application saved successfully! Application ID: ${application._id}`);
        res.status(201).json({ message: 'Application submitted successfully!', application });

    } catch (err) {
        console.error('Backend DEBUG: Error in POST /api/applications catch block:', err); // Log full error object
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            console.error(`Backend DEBUG: Mongoose Validation Failed: ${messages.join(', ')}`);
            return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
        }
        if (err.code === 11000) { // MongoDB duplicate key error
            console.error(`Backend DEBUG: MongoDB Duplicate Key Error (11000): ${err.message}`);
            // Check if it's the expected project/freelancer unique index violation
            if (err.keyPattern && err.keyPattern.project === 1 && err.keyPattern.freelancer === 1) {
                return res.status(409).json({ message: 'You have already applied for this project.' }); // 409 Conflict
            }
        }
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            console.error(`Backend DEBUG: Mongoose ObjectId Cast Error: ${err.message}`);
            return res.status(400).json({ message: 'Invalid ID format encountered during processing.' });
        }
        console.error(`Backend DEBUG: Generic Server Error: ${err.message}`);
        res.status(500).json({ message: 'Server error: Could not submit application.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished POST /api/applications ---`);
    }
});

// @route   GET /api/applications/project/:projectId
// @desc    Get all applications for a specific project (FOR CLIENT VIEW)
// @access  Private (Client who posted the project, or Admin)
router.get('/project/:projectId', protect, async (req, res) => {
    console.log(`\nBackend DEBUG: Received request for applications for projectId: ${req.params.projectId} (Client View)`);
    try {
        // Validate projectId format from URL param
        if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
            console.error(`Backend DEBUG: Invalid Project ID format received in URL: ${req.params.projectId}`);
            return res.status(400).json({ message: 'Invalid Project ID format.' });
        }

        const project = await Project.findById(req.params.projectId);
        if (!project) {
            console.warn(`Backend DEBUG: Project ${req.params.projectId} not found when fetching applications.`);
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Authorization check: Ensure the requesting user is the client who owns the project or an admin
        if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
            console.warn(`Backend DEBUG: Unauthorized attempt to view applications for project ${req.params.projectId} by user ${req.user.id} (${req.user.role}).`);
            return res.status(403).json({ message: 'Not authorized to view applications for this project.' });
        }

        // --- FIX: Ensure the query strictly matches the provided projectId ---
        // Explicitly cast req.params.projectId to ObjectId for strict comparison.
        const targetProjectId = new mongoose.Types.ObjectId(req.params.projectId); 
        const queryFilter = { 
            project: targetProjectId // Filter applications by the specific project ID
        };
        console.log(`Backend DEBUG: Using query filter for Application.find() (Client View):`, queryFilter);

        const applications = await Application.find(queryFilter)
            .populate('freelancer', 'username email') // Populate freelancer details
            .populate('project', 'title status client assignedTo') // Populate relevant project details
            .sort({ applicationDate: -1 }); // Sort by newest first

        console.log(`Backend DEBUG: Found ${applications.length} applications matching query for project ${req.params.projectId} (Client View).`);
        console.log(`Backend DEBUG: Applications fetched (App ID, Project ID from App, Freelancer, Status) (Client View):`, applications.map(app => ({
            appId: app._id.toString(), // Convert to string for consistent logging
            projectIdInApp: app.project?._id ? app.project._id.toString() : 'NULL/MISSING', // Log the project ID from the application itself
            freelancer: app.freelancer?.username,
            status: app.status
        })));
        res.json(applications);
    } catch (err) {
        console.error('Backend DEBUG: Error fetching applications for project (Client View):', err); // Log full error
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid Project ID format in URL or database causing a cast error.' });
        }
        res.status(500).json({ message: 'Server error: Could not fetch applications for project.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished GET /api/applications/project/:projectId ---`);
    }
});

// @route   GET /api/applications/my-applications
// @desc    Get all applications submitted by the authenticated freelancer (FOR FREELANCER VIEW)
// @access  Private (Freelancer only)
router.get('/my-applications', protect, authorizeRoles('freelancer'), async (req, res) => {
    console.log(`\nBackend DEBUG: Received request for my-applications for freelancerId: ${req.user.id} (Freelancer View)`);
    try {
        const freelancerId = req.user.id;

        // Ensure that 'project' field exists and is not null/invalid when fetching applications
        const applications = await Application.find({ 
            freelancer: freelancerId,
            project: { $exists: true, $ne: null } // Ensures project field is present and not null
        })
        .populate({
            path: 'project',
            select: 'title description budget status client',
        })
        .sort({ applicationDate: -1 });

        // Filter out applications where project population might have resulted in null (e.g., project was deleted)
        const validApplications = applications.filter(app => app.project !== null);

        if (applications.length !== validApplications.length) {
            console.warn(`Backend DEBUG: Filtered out ${applications.length - validApplications.length} applications with missing/deleted projects for freelancer ${freelancerId} during 'my-applications' fetch.`);
        }
        
        console.log(`Backend DEBUG: Found ${validApplications.length} valid applications for freelancer ${freelancerId}.`);
        res.json(validApplications);

    } catch (err) {
        console.error('Backend DEBUG: Error fetching freelancer applications:', err.message);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Database contains an application with an invalid Project ID format. Please contact support.' });
        }
        res.status(500).json({ message: 'Server error: Could not fetch applications.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished GET /api/applications/my-applications ---`);
    }
});

// @route   GET /api/applications/client-review
// @desc    Get all applications for projects posted by the authenticated client
// @access  Private (Client only)
router.get('/client-review', protect, authorizeRoles('client'), async (req, res) => {
    console.log(`\nBackend DEBUG: Received request for client-review applications for clientId: ${req.user.id}`);
    try {
        const clientId = req.user.id; // Authenticated client ID

        // Find all projects posted by this client
        const clientProjects = await Project.find({ client: clientId }).select('_id');
        const projectIds = clientProjects.map(project => project._id);
        console.log(`Backend DEBUG: Client ${clientId} has posted project IDs:`, projectIds);

        if (projectIds.length === 0) {
            console.log(`Backend DEBUG: No projects found for client ${clientId}. Returning empty array.`);
            return res.json([]);
        }

        const applications = await Application.find({ project: { $in: projectIds } })
                                            .populate('freelancer', 'username email')
                                            .populate('project', 'title status')
                                            .sort({ applicationDate: -1 });

        console.log(`Backend DEBUG: Found ${applications.length} applications for client review.`);
        res.json(applications);

    } catch (err) {
        console.error('Error fetching applications for client review:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID format for population.' });
        }
        res.status(500).json({ message: 'Server error: Could not fetch applications for review.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished GET /api/applications/client-review ---`);
    }
});


// @route   PUT /api/applications/:id/status
// @desc    Update application status (e.g., accepted, rejected)
// @access  Private (Client who posted the project, or Admin)
router.put('/:id/status', protect, authorizeRoles('client', 'admin'), async (req, res) => {
    console.log(`\nBackend DEBUG: Received request to update application status for ID: ${req.params.id} to status: ${req.body.status}`);
    try {
        const { status } = req.body;
        const applicationId = req.params.id;

        const application = await Application.findById(applicationId).populate('project', 'client assignedTo status');

        if (!application) {
            console.warn(`Backend DEBUG: Application ${applicationId} not found for status update.`);
            return res.status(404).json({ message: 'Application not found.' });
        }
        console.log(`Backend DEBUG: Application found. Current status: ${application.status}, Project ID: ${application.project?._id}`);


        if (!application.project || (application.project.client.toString() !== req.user.id && req.user.role !== 'admin')) {
             console.warn(`Backend DEBUG: Unauthorized attempt to update application ${applicationId}. User ID mismatch or project missing.`);
            return res.status(403).json({ message: 'Not authorized to update this application.' });
        }

        if (application.project.status === 'completed') {
            console.warn(`Backend DEBUG: Cannot change application status for completed project ${application.project._id}.`);
            return res.status(400).json({ message: 'Cannot change application status for a completed project.' });
        }

        if (status === 'accepted') {
            console.log(`Backend DEBUG: Handling 'accepted' status for application ${applicationId}.`);
            if (application.project.assignedTo) {
                console.warn(`Backend DEBUG: Project ${application.project._id} is already assigned. Cannot accept application.`);
                return res.status(400).json({ message: 'Project is already assigned to a freelancer.' });
            }
            console.log(`Backend DEBUG: Marking other pending applications for project ${application.project._id} as rejected.`);
            await Application.updateMany(
                { project: application.project._id, _id: { $ne: applicationId }, status: 'pending' },
                { status: 'rejected' }
            );
            application.project.assignedTo = application.freelancer;
            application.project.status = 'assigned';
            console.log(`Backend DEBUG: Assigning project ${application.project._id} to freelancer ${application.freelancer}, setting status to 'assigned'.`);
            await application.project.save();
        }

        application.status = status;
        console.log(`Backend DEBUG: Updating application ${applicationId} status to ${status}.`);
        await application.save();

        const updatedApplication = await Application.findById(applicationId)
                                                    .populate('freelancer', 'username email')
                                                    .populate('project', 'title status client assignedTo');

        console.log(`Backend DEBUG: Application status updated successfully to ${status}.`);
        res.json({ message: `Application status updated to ${status}.`, application: updatedApplication });

    } catch (err) {
        console.error('Backend DEBUG: Error updating application status:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Application ID.' });
        }
        res.status(500).json({ message: 'Server error: Could not update application status.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished PUT /api/applications/:id/status ---`);
    }
});

// @route   DELETE /api/applications/:id
// @desc    Delete an application (e.g., withdraw)
// @access  Private (Freelancer who submitted it, or Admin)
router.delete('/:id', protect, authorizeRoles('freelancer', 'admin'), async (req, res) => {
    console.log(`\nBackend DEBUG: Received request to delete application ID: ${req.params.id}`);
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            console.warn(`Backend DEBUG: Application ${req.params.id} not found for deletion.`);
            return res.status(404).json({ message: 'Application not found.' });
        }
        console.log(`Backend DEBUG: Application found. Freelancer ID: ${application.freelancer}`);

        if (application.freelancer.toString() !== req.user.id && req.user.role !== 'admin') {
            console.warn(`Backend DEBUG: Unauthorized attempt to delete application ${req.params.id}. User ID mismatch.`);
            return res.status(403).json({ message: 'Not authorized to delete this application.' });
        }
        
        console.log(`Backend DEBUG: Deleting application ${req.params.id}.`);
        await Application.deleteOne({ _id: req.params.id });
        console.log(`Backend DEBUG: Application ${req.params.id} deleted successfully.`);
        res.json({ message: 'Application deleted successfully!' });

    } catch (err) {
        console.error('Backend DEBUG: Error deleting application:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid application ID.' });
        }
        res.status(500).json({ message: 'Server error: Could not delete application.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished DELETE /api/applications/:id ---`);
    }
});

module.exports = router;
