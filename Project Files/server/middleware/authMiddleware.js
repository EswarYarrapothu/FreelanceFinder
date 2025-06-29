// server/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
    let token;
    console.log('Middleware: Inside protect function.'); // Debugging log

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            console.log('Middleware: Token found:', token ? token.substring(0, 10) + '...' : 'No token'); // Debugging log

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Middleware: Token decoded. User ID:', decoded.id); // Debugging log

            // Attach user to the request object (excluding password)
            req.user = await User.findById(decoded.id).select('-password');
            console.log('Middleware: User attached to request:', req.user ? req.user.username : 'User not found'); // Debugging log

            if (!req.user) {
                console.log('Middleware: User not found from token ID.'); // Debugging log
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Middleware: Error in token verification/user lookup:', error.message); // Debugging log
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log('Middleware: No token found in headers.'); // Debugging log
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Authorize roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log(`Middleware: Inside authorizeRoles. Required roles: ${roles.join(', ')}. User role: ${req.user ? req.user.role : 'N/A'}`); // Debugging log
        if (!req.user || !roles.includes(req.user.role)) {
            console.log('Middleware: Authorization failed. User role does not match required roles.'); // Debugging log
            return res.status(403).json({ message: `User role ${req.user ? req.user.role : 'N/A'} is not authorized to access this route` });
        }
        console.log('Middleware: Authorization successful.'); // Debugging log
        next(); // Proceed to the next middleware/route handler
    };
};

module.exports = { protect, authorizeRoles };
