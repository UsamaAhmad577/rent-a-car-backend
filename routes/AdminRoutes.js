const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

// ====================
// PROTECTED ADMIN ROUTES
// ====================

// GET admin dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get all bookings
    const allBookings = await Booking.find().populate('car').populate('user');
    
    // Calculate stats
    const stats = {
      totalBookings: allBookings.length,
      activeBookings: allBookings.filter(b => 
        b.status === 'confirmed' && 
        new Date(b.endDate) >= today
      ).length,
      pendingBookings: allBookings.filter(b => b.status === 'pending').length,
      totalRevenue: allBookings.reduce((sum, b) => sum + b.totalPrice, 0),
      monthlyRevenue: allBookings
        .filter(b => new Date(b.createdAt) >= startOfMonth)
        .reduce((sum, b) => sum + b.totalPrice, 0),
      totalCars: await Car.countDocuments(),
      availableCars: await Car.countDocuments({ isAvailable: true }),
      rentedCars: await Car.countDocuments({ isAvailable: false }),
      totalUsers: await User.countDocuments()
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all bookings with filters
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Get bookings with pagination
    const bookings = await Booking.find(query)
      .populate('car', 'name imageUrl price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(query);
    
    res.json({
      success: true,
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all cars with availability status
router.get('/cars', adminAuth, async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    
    // Add booking info for each car
    const carsWithBookings = await Promise.all(
      cars.map(async (car) => {
        const activeBookings = await Booking.find({
          car: car._id,
          status: 'confirmed',
          endDate: { $gte: new Date() }
        }).populate('user', 'name email phone');
        
        return {
          ...car._doc,
          activeBookings: activeBookings.length,
          nextAvailableDate: activeBookings.length > 0 
            ? new Date(Math.max(...activeBookings.map(b => new Date(b.endDate))))
            : null
        };
      })
    );
    
    res.json({ success: true, cars: carsWithBookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update booking status
router.put('/bookings/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('car').populate('user');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // If confirming booking, mark car as unavailable
    if (status === 'confirmed') {
      await Car.findByIdAndUpdate(booking.car._id, { isAvailable: false });
    }
    
    // If cancelling/completing booking, mark car as available
    if (['cancelled', 'completed'].includes(status)) {
      await Car.findByIdAndUpdate(booking.car._id, { isAvailable: true });
    }
    
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update car availability
router.put('/cars/:id/availability', adminAuth, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    );
    
    res.json({ success: true, car });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST add new car
router.post('/cars', adminAuth, async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();
    res.status(201).json({ success: true, car });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE car
router.delete('/cars/:id', adminAuth, async (req, res) => {
  try {
    // Check if car has active bookings
    const activeBookings = await Booking.findOne({
      car: req.params.id,
      status: 'confirmed',
      endDate: { $gte: new Date() }
    });
    
    if (activeBookings) {
      return res.status(400).json({ 
        error: 'Cannot delete car with active bookings' 
      });
    }
    
    await Car.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;