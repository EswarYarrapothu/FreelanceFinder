// server/models/Application.js

const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project', // References the Project model
        required: true // Project ID is required
    },
    freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model (for the freelancer)
        required: true // Freelancer ID is required
    },
    bidAmount: {
        type: Number,
        required: true,
        min: [0, 'Bid amount cannot be negative.'] // Bid amount cannot be negative
    },
    coverLetter: {
        type: String,
        required: true // Cover letter is required (as per current schema)
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending'
    },
    applicationDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// IMPORTANT: Ensure a freelancer can only apply once to a given project
// This unique compound index prevents duplicate (project, freelancer) pairs.
ApplicationSchema.index({ project: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
