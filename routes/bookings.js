const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Destination = require('../models/Destination');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Create new booking
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { destinationId, checkin, checkout, name } = req.body;

        // Basic validation
        if (!destinationId || !checkin || !checkout) {
            req.flash('error', 'Booking validation failed: missing fields');
            return res.redirect('back');
        }

        const checkinDate = new Date(checkin);
        const checkoutDate = new Date(checkout);
        if (isNaN(checkinDate.valueOf()) || isNaN(checkoutDate.valueOf()) || checkinDate > checkoutDate) {
            req.flash('error', 'Booking validation failed: invalid dates');
            return res.redirect('back');
        }

        const booking = new Booking({
            user: req.session.userId,
            destination: destinationId,
            guestName: name || null,
            checkin: checkinDate,
            checkout: checkoutDate
        });

        await booking.save();
        req.flash('success', 'Booking created successfully!');
        res.redirect('/bookings');
    } catch (error) {
        console.error('Booking create error:', error);
        req.flash('error', 'Error creating booking');
        res.redirect('back');
    }
});

// Get user's bookings
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.session.userId })
            .populate('destination')
            .sort({ createdAt: -1 });
    res.render('view_bookings.ejs', { bookings });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching bookings');
        res.redirect('/home');
    }
});

// Cancel booking
router.post('/:id/cancel', isAuthenticated, async (req, res) => {
    try {
        const booking = await Booking.findOneAndUpdate(
            { _id: req.params.id, user: req.session.userId },
            { status: 'cancelled' },
            { new: true }
        );

        if (!booking) {
            req.flash('error', 'Booking not found');
            return res.redirect('/bookings');
        }

        req.flash('success', 'Booking cancelled successfully');
        res.redirect('/bookings');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error cancelling booking');
        res.redirect('/bookings');
    }
});

module.exports = router;