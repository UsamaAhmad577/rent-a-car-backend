const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },  // ← Keep as 'price'
    imageUrl: { type: String, required: true },
    description: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Car', carSchema);