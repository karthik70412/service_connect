// server/models/Request.js
const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    professionalName: { type: String, required: true },
    bookingDate: { type: String, required: true },
    bookingTime: { type: String, required: true },
    address: { type: String, required: true },
    note: { type: String, default: '' },
    status: { type: String, default: 'pending' }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Request', RequestSchema);