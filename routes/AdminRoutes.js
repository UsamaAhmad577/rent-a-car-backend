const express = require('express');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all cars (Admin only)
router.get('/cars', auth, admin, async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cars' });
  }
});

// Add new car (Admin only)
router.post('/cars', auth, admin, async (req, res) => {
  try {
    const { name, price, imageUrl } = req.body;
    
    const car = new Car({
      name,
      price,
      imageUrl: imageUrl || 'https://via.placeholder.com/300x200?text=Car+Image'
    });

    await car.save();
    res.status(201).json({ message: 'Car added successfully', car });
  } catch (error) {
    res.status(500).json({ error: 'Error adding car' });
  }
});

// Get all bookings (Admin only)
router.get('/bookings', auth, admin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('car', 'name price');
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// Get dashboard statistics (Admin only)
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCars = await Car.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      totalUsers,
      totalCars,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

module.exports = router;