// server/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser: true, // Deprecated in Mongoose 6.0+, no effect in 4.0+ Node.js driver
            // useUnifiedTopology: true, // Deprecated in Mongoose 6.0+, no effect in 4.0+ Node.js driver
            // useCreateIndex: true, // Deprecated in Mongoose 6.0+, no effect
            // useFindAndModify: false // Deprecated in Mongoose 6.0+, use findOneAndUpdate, findOneAndRemove, etc.
        });
        console.log('MongoDB connected successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;