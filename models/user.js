const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  // 👇 JUST ADD THIS ONE LINE
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

//module.exports = mongoose.model('User', userSchema);


// ✅ FIX: Use this line instead of just mongoose.model()
module.exports = mongoose.models.User || mongoose.model('User', userSchema);