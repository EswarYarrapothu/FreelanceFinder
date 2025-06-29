// server/routes/projectRoutes.js

const express = require('express');
const router = express.Router();
const Project = require('../models/Project'); // Import the Project model
const Application = require('../models/Application'); // Import Application model for cascade delete
const { protect, authorizeRoles } = require('../middleware/authMiddleware'); // Import auth middleware
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Clients only)
router.post('/', protect, authorizeRoles('client'), async (req, res) => {
    console.log(`\n--- Backend DEBUG: Starting POST /api/projects ---`);
    console.log(`Backend DEBUG: Incoming Request Body:`, req.body);
    console.log(`Backend DEBUG: Client ID:`, req.user?.id);
    try {
        const { title, description, budget, skillsRequired } = req.body;

        // Basic validation
        if (!title || !description || !budget) {
            console.error('Backend DEBUG: Validation Error: Missing required fields for project creation.');
            return res.status(400).json({ message: 'Please enter all required fields: title, description, and budget.' });
        }

        const newProject = new Project({
            client: req.user.id, // The client's ID is available from the 'protect' middleware
            title,
            description,
            budget,
            skillsRequired: skillsRequired || [] // Ensure skillsRequired is an array, default to empty
        });

        const project = await newProject.save();
        console.log(`Backend DEBUG: Project posted successfully! Project ID: ${project._id}`);
        res.status(201).json({ message: 'Project posted successfully!', project });

    } catch (err) {
        console.error('Backend DEBUG: Error creating project:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error: Could not post project.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished POST /api/projects ---`);
    }
});

// @route   GET /api/projects
// @desc    Get all projects (for freelancers to browse)
// @access  Private (Any authenticated user can view available projects)
router.get('/', protect, authorizeRoles('freelancer', 'client', 'admin'), async (req, res) => {
    console.log(`\n--- Backend DEBUG: Starting GET /api/projects (All Available) ---`);
    try {
        // Find projects and populate client information
        const projects = await Project.find()
            .populate('client', 'username email') // Populate client details
            .populate('assignedTo', 'username email'); // Populate assignedTo freelancer details

        // Filter out projects where client or assignedTo population failed (e.g., due to invalid/deleted IDs)
        const validProjects = projects.filter(project => {
            if (project.client === null) {
                console.warn(`Backend DEBUG: Filtering out project ${project._id} because its client reference is null.`);
                return false;
            }
            if (project.assignedTo === null && project.status === 'assigned') {
                 console.warn(`Backend DEBUG: Filtering out project ${project._id} because it's assigned but assignedTo is null.`);
                 return false;
            }
            return true;
        });

        console.log(`Backend DEBUG: Found ${validProjects.length} valid projects out of ${projects.length} total.`);
        console.log(`Backend DEBUG: Projects fetched (ID, Title, Client, Status):`, validProjects.map(p => ({
            id: p._id.toString(),
            title: p.title,
            client: p.client?.username,
            status: p.status
        })));
        res.json(validProjects);
    } catch (err) {
        console.error('Backend DEBUG: Error fetching all available projects:', err);
        // Handle CastError specifically during population
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            console.error(`Backend DEBUG: CastError during population in GET /api/projects: ${err.message}`);
            return res.status(500).json({ message: 'Server error: Data integrity issue detected (invalid ID in project references). Please contact support.' });
        }
        res.status(500).json({ message: 'Server error: Could not fetch projects.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished GET /api/projects (All Available) ---`);
    }
});

// @route   GET /api/projects/my-posted-projects
// @desc    Get projects posted by the authenticated client, with optional status filter
// @access  Private (Clients only)
router.get('/my-posted-projects', protect, authorizeRoles('client'), async (req, res) => {
    console.log(`\n--- Backend DEBUG: Starting GET /api/projects/my-posted-projects ---`);
    console.log(`Backend DEBUG: Client ID:`, req.user?.id, `Status filter:`, req.query.status);
    try {
        const clientId = req.user.id;
        const { status } = req.query; 

        let query = { client: clientId };

        if (status) {
            const statusArray = status.split(',').map(s => s.trim()); 
            query.status = { $in: statusArray };
        }
        console.log(`Backend DEBUG: Query for my-posted-projects:`, query);

        const projects = await Project.find(query)
            .populate('client', 'username email')
            .populate('assignedTo', 'username email');

        // Filter out projects where client or assignedTo might be null after populate
        const validProjects = projects.filter(p => p.client !== null);
        if (projects.length !== validProjects.length) {
            console.warn(`Backend DEBUG: Filtered out ${projects.length - validProjects.length} projects with missing client for client ${clientId}.`);
        }

        console.log(`Backend DEBUG: Found ${validProjects.length} my-posted-projects.`);
        res.json(validProjects);
    } catch (err) {
        console.error('Backend DEBUG: Error fetching my posted projects:', err);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid ID format in query or database when fetching posted projects.' });
        }
        res.status(500).json({ message: 'Server error: Could not fetch posted projects.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished GET /api/projects/my-posted-projects ---`);
    }
});

// @route   GET /api/projects/freelancer-working-projects/:freelancerId
// @desc    Get projects assigned to a specific freelancer, with optional status filter
// @access  Private (Freelancer who is assigned, or Admin)
router.get('/freelancer-working-projects/:freelancerId', protect, authorizeRoles('freelancer', 'admin'), async (req, res) => {
    console.log(`\n--- Backend DEBUG: Starting GET /api/projects/freelancer-working-projects/${req.params.freelancerId} ---`);
    try {
        const { freelancerId } = req.params;
        const { status } = req.query; 

        console.log('Backend DEBUG: User making request ID:', req.user ? req.user.id : 'N/A', 'Role:', req.user ? req.user.role : 'N/A');
        console.log('Backend DEBUG: Fetching working projects for freelancer ID:', freelancerId);
        console.log('Backend DEBUG: Status filter received:', status); 

        if (req.user.role === 'freelancer' && req.user.id !== freelancerId) {
            console.warn('Backend DEBUG: Authorization failed for working projects. User ID mismatch.');
            return res.status(401).json({ message: 'Not authorized to view these projects.' });
        }
        
        // Validate freelancerId format from URL param
        if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
            console.error(`Backend DEBUG: Invalid Freelancer ID format received in URL: ${freelancerId}`);
            return res.status(400).json({ message: 'Invalid Freelancer ID format.' });
        }

        let query = {
            assignedTo: new mongoose.Types.ObjectId(freelancerId), // Ensure ID is ObjectId type
        };

        if (status) {
            const statusArray = status.split(',').map(s => s.trim());
            query.status = { $in: statusArray };
        } else {
            query.status = { $in: ['assigned', 'in progress'] }; 
        }
        console.log(`Backend DEBUG: Query for freelancer-working-projects:`, query);

        const projects = await Project.find(query)
            .populate('client', 'username email')
            .populate('assignedTo', 'username email');

        // Filter out projects where population might have resulted in null (e.g., client or assignedTo user was deleted)
        const validProjects = projects.filter(p => p.client !== null && p.assignedTo !== null);
        if (projects.length !== validProjects.length) {
            console.warn(`Backend DEBUG: Filtered out ${projects.length - validProjects.length} working projects with missing client/assignedTo for freelancer ${freelancerId}.`);
        }

        console.log(`Backend DEBUG: Found ${validProjects.length} working projects for freelancer ${freelancerId} with query ${JSON.stringify(query)}.`); 
        res.json(validProjects);

    } catch (err) {
        console.error('Backend DEBUG: Error in GET /api/projects/freelancer-working-projects/:freelancerId:', err);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Freelancer ID format or internal data issue.' });
        }
        res.status(500).json({ message: 'Server error: Could not fetch freelancer working projects.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished GET /api/projects/freelancer-working-projects/:freelancerId ---`);
    }
});

// @route   GET /api/projects/:id
// @desc    Get a single project by ID
// @access  Private (Any authenticated user can view a specific project)
router.get('/:id', protect, async (req, res) => {
    console.log(`\n--- Backend DEBUG: Starting GET /api/projects/:id (Single Project) ---`);
    console.log(`Backend DEBUG: Requesting Project ID: ${req.params.id}`);
    try {
        // Validate project ID format from URL param
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.error(`Backend DEBUG: Invalid Project ID format received in URL for single project fetch: ${req.params.id}`);
            return res.status(400).json({ message: 'Invalid Project ID format.' });
        }

        const project = await Project.findById(req.params.id)
            .populate('client', 'username email')
            .populate('assignedTo', 'username email');

        if (!project) {
            console.warn(`Backend DEBUG: Project ${req.params.id} not found.`);
            return res.status(404).json({ message: 'Project not found' });
        }
        // Filter out if client or assignedTo is null after populate
        if (project.client === null) {
            console.warn(`Backend DEBUG: Project ${req.params.id} has null client reference. Returning 404.`);
            return res.status(404).json({ message: 'Project found but client data is missing or invalid.' });
        }
        
        console.log(`Backend DEBUG: Single project ${project._id} fetched successfully. Title: ${project.title}`);
        res.json(project);
    } catch (err) {
        console.error('Backend DEBUG: Error fetching single project:', err);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            console.error(`Backend DEBUG: CastError during population in GET /api/projects/:id: ${err.message}`);
            return res.status(500).json({ message: 'Server error: Data integrity issue detected (invalid ID in project references). Please contact support.' });
        }
        res.status(500).json({ message: 'Server error: Could not fetch project.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished GET /api/projects/:id (Single Project) ---`);
    }
});


// @route   PUT /api/projects/:id
// @desc    Update a project (general update, not for status change)
// @access  Private (Client who posted the project, or Admin)
router.put('/:id', protect, authorizeRoles('client', 'admin'), async (req, res) => {
    console.log(`\n--- Backend DEBUG: Starting PUT /api/projects/:id (Update Project) ---`);
    console.log(`Backend DEBUG: Updating Project ID: ${req.params.id}, Body:`, req.body);
    try {
        const { title, description, budget, skillsRequired, assignedTo } = req.body;

        // Validate project ID format from URL param
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.error(`Backend DEBUG: Invalid Project ID format received in URL for update: ${req.params.id}`);
            return res.status(400).json({ message: 'Invalid Project ID format.' });
        }

        let project = await Project.findById(req.params.id);

        if (!project) {
            console.warn(`Backend DEBUG: Project ${req.params.id} not found for update.`);
            return res.status(404).json({ message: 'Project not found' });
        }
        console.log(`Backend DEBUG: Project found. Current client: ${project.client}, User ID: ${req.user.id}`);


        if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
            console.warn(`Backend DEBUG: Unauthorized attempt to update project ${req.params.id}. User ID mismatch.`);
            return res.status(401).json({ message: 'Not authorized to update this project.' });
        }

        project.title = title || project.title;
        project.description = description || project.description;
        project.budget = budget || project.budget;
        project.skillsRequired = skillsRequired || project.skillsRequired;
        
        if (assignedTo !== undefined) {
            // Ensure assignedTo is a valid ObjectId if provided
            if (assignedTo !== null && !mongoose.Types.ObjectId.isValid(assignedTo)) {
                console.error(`Backend DEBUG: Invalid assignedTo ID format: ${assignedTo}`);
                return res.status(400).json({ message: 'Invalid assignedTo user ID format.' });
            }
            project.assignedTo = assignedTo;
        }

        await project.save();
        console.log(`Backend DEBUG: Project ${project._id} updated successfully!`);
        res.json({ message: 'Project updated successfully!', project });

    } catch (err) {
        console.error('Backend DEBUG: Error updating project:', err);
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid ID format encountered during update processing.' });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation failed: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error: Could not update project.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished PUT /api/projects/:id (Update Project) ---`);
    }
});

// @route   PUT /api/projects/:id/status
// @desc    Update project status (e.g., to 'completed', 'assigned', 'in progress', 'open')
// @access  Private (Client who posted the project, or Admin)
router.put('/:id/status', protect, authorizeRoles('client', 'admin'), async (req, res) => {
    console.log(`\n--- Backend DEBUG: Starting PUT /api/projects/:id/status (Update Status) ---`);
    console.log(`Backend DEBUG: Updating status for Project ID: ${req.params.id} to: ${req.body.status}`);
    try {
        const { status } = req.body;
        const projectId = req.params.id;

        // Validate project ID format
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            console.error(`Backend DEBUG: Invalid Project ID format received in URL for status update: ${projectId}`);
            return res.status(400).json({ message: 'Invalid Project ID format.' });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            console.warn(`Backend DEBUG: Project ${projectId} not found for status update.`);
            return res.status(404).json({ message: 'Project not found.' });
        }

        if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
            console.warn(`Backend DEBUG: Unauthorized attempt to update project status ${projectId}. User ID mismatch.`);
            return res.status(403).json({ message: 'Not authorized to update this project status.' });
        }

        if (status && ['open', 'assigned', 'in progress', 'completed'].includes(status.toLowerCase())) {
            console.log(`Backend DEBUG: Setting project ${projectId} status to ${status.toLowerCase()}.`);
            project.status = status.toLowerCase();
            await project.save();
            return res.json({ message: `Project status updated to ${project.status}.`, project });
        } else {
            console.warn(`Backend DEBUG: Invalid status provided for project ${projectId}: ${status}`);
            return res.status(400).json({ message: 'Invalid status provided. Allowed statuses: open, assigned, in progress, completed.' });
        }

    } catch (err) {
        console.error('Backend DEBUG: Error updating project status:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID.' });
        }
        res.status(500).json({ message: 'Server error: Could not update project status.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished PUT /api/projects/:id/status ---`);
    }
});


// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private (Client who posted the project, or Admin)
router.delete('/:id', protect, authorizeRoles('client', 'admin'), async (req, res) => {
    console.log(`\n--- Backend DEBUG: Starting DELETE /api/projects/:id ---`);
    console.log(`Backend DEBUG: Deleting Project ID: ${req.params.id}`);
    try {
        // Validate project ID format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.error(`Backend DEBUG: Invalid Project ID format received for delete: ${req.params.id}`);
            return res.status(400).json({ message: 'Invalid Project ID format.' });
        }

        let project = await Project.findById(req.params.id);

        if (!project) {
            console.warn(`Backend DEBUG: Project ${req.params.id} not found for deletion.`);
            return res.status(404).json({ message: 'Project not found' });
        }
        console.log(`Backend DEBUG: Project found. Client ID: ${project.client}, User ID: ${req.user.id}`);


        if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
            console.warn(`Backend DEBUG: Unauthorized attempt to delete project ${req.params.id}. User ID mismatch.`);
            return res.status(401).json({ message: 'Not authorized to delete this project.' });
        }

        // Delete associated applications first to maintain referential integrity
        console.log(`Backend DEBUG: Deleting all applications for project ${req.params.id}.`);
        await Application.deleteMany({ project: req.params.id });
        
        // Then delete the project itself
        console.log(`Backend DEBUG: Deleting project ${req.params.id}.`);
        await Project.deleteOne({ _id: req.params.id }); 

        console.log(`Backend DEBUG: Project and associated applications deleted successfully for ID: ${req.params.id}.`);
        res.json({ message: 'Project and associated applications deleted successfully!' });

    } catch (err) {
        console.error('Backend DEBUG: Error deleting project and associated applications:', err);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID.' });
        }
        res.status(500).json({ message: 'Server error: Could not delete project.' });
    } finally {
        console.log(`--- Backend DEBUG: Finished DELETE /api/projects/:id ---`);
    }
});

module.exports = router;
