const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make optional for guest bookings
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed'
  },
  // Add guest information
  guestInfo: {
    name: {
      type: String,
      required: function() { return this.bookingType === 'guest'; }
    },
    email: {
      type: String,
      required: function() { return this.bookingType === 'guest'; }
    },
    phone: {
      type: String,
      required: function() { return this.bookingType === 'guest'; }
    }
  },
  // Add booking type
  bookingType: {
    type: String,
    enum: ['user', 'guest'],
    default: 'user'
  },
  confirmationNumber: {
    type: String,
    unique: true,
    sparse: true // Allows null for user bookings
  }
}, {
  timestamps: true
});

// Auto-generate confirmation number for guest bookings
bookingSchema.pre('save', function(next) {
  if (this.bookingType === 'guest' && !this.confirmationNumber) {
    this.confirmationNumber = `GB${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);