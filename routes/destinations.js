const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Get all destinations
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } }
                ]
            };
        }

    const destinations = await Destination.find(query);
    res.render('index.ejs', { destinations, query: search });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching destinations');
        res.redirect('/home');
    }
});

// Get single destination
router.get('/:id', async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        if (!destination) {
            req.flash('error', 'Destination not found');
            return res.redirect('/home');
        }
    // Render booking/details page for the destination
    res.render('booking.ejs', { hotel: destination });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching destination');
        res.redirect('/home');
    }
});

module.exports = router;