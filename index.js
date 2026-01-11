require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import models
const Car = require('./models/Car');
const User = require('./models/user'); // Add this import
const path = require('path');


// Import routes
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/AdminRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
console.log('Image path:', path.join(__dirname, 'public', 'images'));



// Routes
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// MongoDB Connection - FIXED THE TYPO
//const MONGODB_URI = 'mongodb+srv://rentacar_user:Usama12345@rentacar.jsmnu0z.mongodb.net/rental?retryWrites=true&w=majority&appName=rentacar';
// MongoDB Connection - TEMPORARY FIX
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://rentacar_user:Usama12345@rentacar.jsmnu0z.mongodb.net/rental?retryWrites=true&w=majority&appName=rentacar';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB - rental database');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// API Routes

// GET /api/cars - Returns the list of all cars FROM DATABASE
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
