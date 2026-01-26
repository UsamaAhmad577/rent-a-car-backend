const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

/* ===============================
   🔍 TEMP DEBUG LOGS (SAFE)
================================ */
console.log('🔗 MongoDB connection state:', mongoose.connection.readyState);
console.log('🏢 Database name:', mongoose.connection.name);

/* =====================================================
   ✅ AUTHENTICATED USER BOOKING
   POST /api/bookings
===================================================== */
router.post('/', auth, async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;

    const missingFields = [];
    if (!carId) missingFields.push('carId');
    if (!startDate) missingFields.push('startDate');
    if (!endDate) missingFields.push('endDate');

    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields.join(', '));
      return res.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });
    }

    if (!mongoose.Types.ObjectId.isValid(carId)) return res.status(400).json({ error: 'Invalid car ID' });

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return res.status(400).json({ error: 'Invalid date range' });

    const conflict = await Booking.findOne({
      car: carId,
      status: 'confirmed',
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }]
    });

    if (conflict) return res.status(400).json({ error: 'Car already booked' });

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = days * car.price;

    const booking = await Booking.create({
      user: req.user.id,
      car: carId,
      startDate: start,
      endDate: end,
      totalPrice,
      status: 'confirmed',
      bookingType: 'user',
      confirmationNumber: `UB${Date.now()}`
    });

    await booking.populate('car');

    // 🔔 Email notifications (non-blocking)
    notificationService.sendBookingNotifications(booking, req.user)
      .catch(err => console.log('⚠️ Email error (ignored):', err.message));

    res.status(201).json({
      success: true,
      booking,
      confirmationNumber: booking.confirmationNumber
    });

  } catch (err) {
    console.error('❌ User booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* =====================================================
   ✅ GUEST BOOKING (VERY IMPORTANT)
   POST /api/bookings/guest
===================================================== */
router.post('/guest', async (req, res) => {
  try {
    const { carId, startDate, endDate, guestInfo } = req.body;

    // Extract guest info safely
    const name = guestInfo?.name;
    const email = guestInfo?.email;
    const phone = guestInfo?.phone;

    // Check missing fields
    const missingFields = [];
    if (!carId) missingFields.push('carId');
    if (!startDate) missingFields.push('startDate');
    if (!endDate) missingFields.push('endDate');
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!phone) missingFields.push('phone');

    if (missingFields.length > 0) {
      console.log('❌ Missing fields:', missingFields.join(', '));
      return res.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });
    }

    if (!mongoose.Types.ObjectId.isValid(carId)) return res.status(400).json({ error: 'Invalid car ID' });

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return res.status(400).json({ error: 'Invalid date range' });

    const conflict = await Booking.findOne({
      car: carId,
      status: 'confirmed',
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }]
    });

    if (conflict) return res.status(400).json({ error: 'Car already booked' });

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = days * car.price;

    const booking = await Booking.create({
      car: carId,
      startDate: start,
      endDate: end,
      totalPrice,
      status: 'confirmed',
      bookingType: 'guest',
      guestInfo: { name, email, phone },
      confirmationNumber: `GB${Date.now()}`
    });

    await booking.populate('car');

    // 🔔 Send email to guest + admin
    notificationService.sendBookingNotifications(booking, { name, email, phone })
      .catch(err => console.log('⚠️ Email error:', err.message));

    res.status(201).json({
      success: true,
      booking,
      confirmationNumber: booking.confirmationNumber
    });

  } catch (err) {
    console.error('❌ Guest booking error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* =====================================================
   ✅ GET USER BOOKINGS
===================================================== */
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('car')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/* =====================================================
   ✅ CANCEL BOOKING
===================================================== */
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled' });

  } catch (err) {
    res.status(500).json({ error: 'Cancel failed' });
  }
});

module.exports = router;
