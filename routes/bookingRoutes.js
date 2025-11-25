const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const auth = require('../middleware/auth');

const router = express.Router();

//////////////////////temporary file **************///////////
// Add at the top of your POST route
console.log('🔗 MongoDB connection state:', mongoose.connection.readyState);
console.log('🏢 Database name:', mongoose.connection.name);

///////////////////////////till here///////////////

// ✅ CREATE NEW BOOKING (AUTHENTICATED USER)
router.post('/', auth, async (req, res) => {
  try {
    console.log('✅ BOOKING REQUEST RECEIVED');
    console.log('🔐 User ID:', req.user.id);
    console.log('📦 Request body:', req.body);

    const { carId, startDate, endDate } = req.body;

    // Validate required fields
    if (!carId || !startDate || !endDate) {
      console.log('❌ Missing fields:', { carId, startDate, endDate });
      return res.status(400).json({ 
        error: 'carId, startDate, and endDate are required' 
      });
    }

    // ✅ FIX: Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      console.log('❌ Invalid carId format:', carId);
      return res.status(400).json({ error: 'Invalid car ID format' });
    }

    console.log('🔍 Checking if car exists...');
    const car = await Car.findById(carId);
    if (!car) {
      console.log('❌ Car not found with ID:', carId);
      return res.status(404).json({ error: 'Car not found' });
    }

    console.log('🚗 Car found:', car.name);
    
    // Check for existing bookings
    console.log('📅 Checking for existing bookings...');
    const existingBooking = await Booking.findOne({
      car: carId,
      status: 'confirmed',
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });

    if (existingBooking) {
      console.log('❌ Car already booked for these dates');
      return res.status(400).json({ 
        error: 'Car is already booked for the selected dates' 
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Calculate price
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = days * car.price;

    console.log('💰 Price calculation:', { days, dailyPrice: car.price, totalPrice });

    // Create booking
    console.log('📝 Creating booking for user:', req.user.id);

    const booking = new Booking({
      user: req.user.id,
      car: carId,
      startDate: start,
      endDate: end,
      totalPrice: totalPrice,
      bookingType: 'user' // Mark as user booking
    });

    await booking.save();
    await booking.populate('car');

    console.log('✅ Booking created successfully');
    
    res.status(201).json({
      message: 'Booking confirmed!',
      booking: {
        _id: booking._id,
        car: booking.car,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        days: days
      }
    });

  } catch (error) {
    console.error('❌ BOOKING ERROR DETAILS:', error);
    console.error('❌ Full error stack:', error.stack);
    res.status(500).json({ error: 'Server error during booking: ' + error.message });
  }
});

// ✅ GUEST BOOKING (NO AUTHENTICATION REQUIRED)
router.post('/guest', async (req, res) => {
  try {
    console.log('🚗 GUEST BOOKING REQUEST RECEIVED');
    console.log('📦 Guest booking body:', req.body);

    const { 
      carId, 
      startDate, 
      endDate, 
      totalPrice, 
      guestInfo 
    } = req.body;

    // Validate required fields
    if (!carId || !startDate || !endDate || !totalPrice || !guestInfo) {
      console.log('❌ Missing guest booking fields');
      return res.status(400).json({ 
        error: 'carId, startDate, endDate, totalPrice, and guestInfo are required' 
      });
    }

    // Validate guest info
    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      return res.status(400).json({ 
        error: 'Guest name, email, and phone are required' 
      });
    }

    // ✅ Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      console.log('❌ Invalid carId format:', carId);
      return res.status(400).json({ error: 'Invalid car ID format' });
    }

    console.log('🔍 Checking if car exists...');
    const car = await Car.findById(carId);
    if (!car) {
      console.log('❌ Car not found with ID:', carId);
      return res.status(404).json({ error: 'Car not found' });
    }

    console.log('🚗 Car found:', car.name);
    
    // Check for existing bookings
    console.log('📅 Checking for existing bookings...');
    const existingBooking = await Booking.findOne({
      car: carId,
      status: 'confirmed',
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });

    if (existingBooking) {
      console.log('❌ Car already booked for these dates');
      return res.status(400).json({ 
        error: 'Car is already booked for the selected dates' 
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Generate confirmation number
    const confirmationNumber = `GB${Date.now()}`;

    console.log('📝 Creating guest booking...');
    const booking = new Booking({
      car: carId,
      startDate: start,
      endDate: end,
      totalPrice: totalPrice,
      guestInfo: {
        name: guestInfo.name,
        email: guestInfo.email,
        phone: guestInfo.phone
      },
      status: 'confirmed',
      bookingType: 'guest',
      confirmationNumber: confirmationNumber
    });

    await booking.save();
    await booking.populate('car');

    console.log('✅ Guest booking created successfully');
    
    res.status(201).json({
      message: 'Guest booking confirmed!',
      booking: {
        _id: booking._id,
        car: booking.car,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
        guestInfo: booking.guestInfo,
        confirmationNumber: booking.confirmationNumber,
        bookingType: booking.bookingType
      }
    });

  } catch (error) {
    console.error('❌ GUEST BOOKING ERROR DETAILS:', error);
    console.error('❌ Full error stack:', error.stack);
    res.status(500).json({ error: 'Server error during guest booking: ' + error.message });
  }
});

// ✅ GET USER'S BOOKINGS
router.get('/my-bookings', auth, async (req, res) => {
  try {
    console.log('📖 Fetching bookings for user:', req.user.id);
    
    const bookings = await Booking.find({ user: req.user.id })
      .populate('car')
      .sort({ createdAt: -1 });

    console.log(`📚 Found ${bookings.length} bookings`);
    res.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// ✅ GET ALL BOOKINGS (FOR ADMIN - INCLUDES GUEST BOOKINGS)
router.get('/all', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('📖 Admin fetching all bookings');
    
    const bookings = await Booking.find()
      .populate('car')
      .populate('user', 'name email') // Populate user if exists
      .sort({ createdAt: -1 });

    console.log(`📚 Found ${bookings.length} total bookings`);
    res.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching all bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// ✅ CANCEL BOOKING (WORKS FOR BOTH USER AND GUEST BOOKINGS)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    console.log('❌ Cancel booking request for ID:', req.params.id);
    
    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking ID format' });
    }

    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      $or: [
        { user: req.user.id }, // User's own booking
        { 'guestInfo.email': req.user.email } // Guest booking with matching email
      ]
    });

    if (!booking) {
      console.log('❌ Booking not found for user');
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'cancelled';
    await booking.save();
    
    console.log('💾 Booking saved to database');
    console.log('📊 Booking document:', booking);

    console.log('✅ Booking cancelled successfully');
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({ error: 'Error cancelling booking' });
  }
});

// ✅ CANCEL GUEST BOOKING (NO AUTH REQUIRED)
router.put('/:id/cancel-guest', async (req, res) => {
  try {
    console.log('❌ Cancel guest booking request for ID:', req.params.id);
    
    const { email, confirmationNumber } = req.body;

    if (!email || !confirmationNumber) {
      return res.status(400).json({ error: 'Email and confirmation number required' });
    }

    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking ID format' });
    }

    const booking = await Booking.findOne({ 
      _id: req.params.id,
      'guestInfo.email': email,
      confirmationNumber: confirmationNumber
    });

    if (!booking) {
      console.log('❌ Guest booking not found');
      return res.status(404).json({ error: 'Booking not found' });
    }

    booking.status = 'cancelled';
    await booking.save();

    console.log('✅ Guest booking cancelled successfully');
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('❌ Error cancelling guest booking:', error);
    res.status(500).json({ error: 'Error cancelling booking' });
  }
});

module.exports = router;