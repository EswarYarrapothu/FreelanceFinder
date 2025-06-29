// server/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    // Simple validation
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password,
            role,
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Generate token with user._id
        const token = generateToken(user._id); // Pass user._id to generateToken

        res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Generate token with user._id
        const token = generateToken(user._id); // Pass user._id to generateToken

        res.json({
            message: 'Logged in successfully!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user (private route)
// @access  Private
router.get('/me', protect, async (req, res) => {
    // req.user is populated by the protect middleware
    try {
        if (!req.user) {
            return res.status(404).json({ message: 'User not found or not authenticated.' });
        }
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
                registrationDate: req.user.createdAt // Assuming createdAt is the registration date
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error fetching user data.' });
    }
});

module.exports = router;
