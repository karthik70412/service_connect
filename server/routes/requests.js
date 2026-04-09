// server/routes/requests.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request');

// POST /api/requests: Create a new service request
router.post('/', async (req, res) => {
    try {
        const { userName, professionalName, bookingDate, bookingTime, address, note } = req.body;

        // Validate required fields
        if (!userName || !professionalName || !bookingDate || !bookingTime || !address) {
            return res.status(400).json({
                message: 'Missing required fields: userName, professionalName, bookingDate, bookingTime, address'
            });
        }

        const newRequest = new Request({
            userName,
            professionalName,
            bookingDate,
            bookingTime,
            address,
            note: note || '',
            status: 'pending'
        });

        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        console.error('Error creating request:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// GET /api/requests/user/:userName: Get all requests for a user
router.get('/user/:userName', async (req, res) => {
    try {
        const { userName } = req.params;
        const requests = await Request.find({ userName });
        res.json(requests);
    } catch (err) {
        console.error('Error fetching user requests:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// GET /api/requests/professional/:professionalName: Get all requests for a professional
router.get('/professional/:professionalName', async (req, res) => {
    try {
        const { professionalName } = req.params;
        const requests = await Request.find({ professionalName });
        res.json(requests);
    } catch (err) {
        console.error('Error fetching professional requests:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// PUT /api/requests/:id?status=:status: Update request status
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        if (!status) {
            return res.status(400).json({ message: 'Status parameter is required' });
        }

        const updatedRequest = await Request.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json(updatedRequest);
    } catch (err) {
        console.error('Error updating request status:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;