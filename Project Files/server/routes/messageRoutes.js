// server/routes/messageRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Project = require('../models/Project');

// @route   POST /api/messages
// @desc    Send a new message within a project context
// @access  Private (Authenticated users involved in the project)
router.post('/', protect, async (req, res) => {
    const { projectId, content } = req.body;
    const senderId = req.user.id; // Authenticated user is the sender

    try {
        // 1. Basic Validation
        if (!projectId || !content) {
            return res.status(400).json({ message: 'Project ID and message content are required.' });
        }

        // 2. Find the project and verify sender is part of it (either client or assigned freelancer)
        const project = await Project.findById(projectId);

        if (!project) {
            console.log(`Message POST: Project ${projectId} not found.`);
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Check if the sender is the project client OR the assigned freelancer
        const isClient = project.client.toString() === senderId;
        const isAssignedFreelancer = project.assignedTo && project.assignedTo.toString() === senderId;

        if (!isClient && !isAssignedFreelancer) {
            console.log(`Message POST: User ${senderId} not authorized to send messages for project ${projectId}.`);
            return res.status(403).json({ message: 'Not authorized to send messages for this project.' });
        }

        // Determine the receiver based on who the sender is
        let receiverId;
        if (isClient && project.assignedTo) { // If sender is client and project is assigned
            receiverId = project.assignedTo;
        } else if (isAssignedFreelancer) { // If sender is assigned freelancer
            receiverId = project.client;
        } else {
            // Case: Client sending message to an unassigned project.
            // Or freelancer sending to an unassigned project (shouldn't happen via UI)
            console.log(`Message POST: Project ${projectId} is not assigned. Cannot send message via project chat.`);
            return res.status(400).json({ message: 'Project is not assigned yet. Cannot initiate chat.' });
        }


        // 3. Create the new message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId, // Storing the direct receiver for 1-on-1 context
            project: projectId,
            content
        });

        const message = await newMessage.save();

        // 4. Populate sender's username for immediate response (optional, but useful for real-time updates)
        await message.populate('sender', 'username').execPopulate();

        console.log(`Message POST: Message sent by ${senderId} for project ${projectId}.`);
        res.status(201).json({ message: 'Message sent successfully!', message });

    } catch (err) {
        console.error('Error sending message:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID or User ID.' });
        }
        res.status(500).json({ message: 'Server error: Could not send message.' });
    }
});

// @route   GET /api/messages/project/:projectId
// @desc    Get all messages for a specific project
// @access  Private (Authenticated users involved in the project)
router.get('/project/:projectId', protect, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id; // Authenticated user

    try {
        // 1. Find the project and verify user is part of it
        const project = await Project.findById(projectId);

        if (!project) {
            console.log(`Message GET: Project ${projectId} not found.`);
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Check if the user is the project client OR the assigned freelancer
        const isClient = project.client.toString() === userId;
        const isAssignedFreelancer = project.assignedTo && project.assignedTo.toString() === userId;

        if (!isClient && !isAssignedFreelancer) {
            console.log(`Message GET: User ${userId} not authorized to view messages for project ${projectId}.`);
            return res.status(403).json({ message: 'Not authorized to view messages for this project.' });
        }

        // 2. Fetch messages for the project, sorted by timestamp
        const messages = await Message.find({ project: projectId })
            .populate('sender', 'username role') // Populate sender's username and role
            .sort('timestamp'); // Sort by time oldest to newest

        console.log(`Message GET: Found ${messages.length} messages for project ${projectId}.`);
        res.json(messages);

    } catch (err) {
        console.error('Error fetching messages:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID.' });
        }
        res.status(500).json({ message: 'Server error: Could not retrieve messages.' });
    }
});

module.exports = router;
