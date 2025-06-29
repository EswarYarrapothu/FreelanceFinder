// server/server.js

const express = require('express');
const connectDB = require('./db'); // Assuming this connects to your MongoDB
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './env' }); // Adjust path if your .env file is elsewhere

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false })); // Allows us to get data in req.body
app.use(cors()); // Enable CORS for all routes

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/projects', require('./routes/projectRoutes')); 
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/client', require('./routes/ClientRoutes'));  
app.use('/api/freelancer', require('./routes/freelancerRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Simple test route to check backend connection status
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is connected and healthy!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));