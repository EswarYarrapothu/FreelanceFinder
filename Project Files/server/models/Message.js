// server/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model (can be client or freelancer)
        required: true
    },
    receiver: { // This field can be used if it's a direct 1-to-1 message without project context
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    project: { // Associate message with a specific project
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: function() {
            // Make 'project' required if 'receiver' is null (i.e., it's a project-based chat)
            // Or you can always make it required for project-centric chat
            return true; 
        }
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
});

// Index for faster querying by project and timestamp
MessageSchema.index({ project: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);