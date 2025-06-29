// server/models/Project.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model (assuming User is the client)
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    budget: {
        type: String, // Changed to String as per frontend input (e.g., "$500 - $1000")
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'assigned', 'in progress', 'completed', 'cancelled'], // Added 'assigned' and 'in progress' statuses
        default: 'open'
    },
    skillsRequired: {
        type: [String], // Array of strings for skills
        default: []
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model (specifically a freelancer)
        default: null // Null if not assigned yet
    },
    // You might want to add an assignedAt date when assignedTo is set
    assignedAt: {
        type: Date,
        default: null
    }
    // deadline: { type: Date }, // Keep this if you want to add a deadline field later
    // applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }] // Not strictly needed here if applications link back to project
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Project', ProjectSchema);
