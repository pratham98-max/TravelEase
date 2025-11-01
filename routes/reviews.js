const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Destination = require('../models/Destination');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Get list of destinations to choose for reviews
router.get('/', async (req, res) => {
    try {
        const hotels = await Destination.find();
        res.render('review_list.ejs', { hotels });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Unable to load hotels');
        res.redirect('/home');
    }
});

// Create new review
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { destinationId, rating, comment } = req.body;
        
        const review = new Review({
            user: req.session.userId,
            destination: destinationId,
            rating,
            comment
        });

        await review.save();
        req.flash('success', 'Review submitted successfully!');
        res.redirect('back');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error submitting review');
        res.redirect('back');
    }
});

// Get reviews for a destination and show review form + existing reviews
router.get('/destination/:destinationId', async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.destinationId);
        if (!destination) {
            req.flash('error', 'Destination not found');
            return res.redirect('/reviews');
        }
        const reviews = await Review.find({ destination: req.params.destinationId })
            .populate('user', 'username')
            .sort({ createdAt: -1 });
        res.render('review.ejs', { hotel: destination, reviews });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching reviews');
        res.redirect('/reviews');
    }
});

// Get user's reviews
router.get('/user', isAuthenticated, async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.session.userId })
            .populate('destination')
            .sort({ createdAt: -1 });
    res.render('view_reviews.ejs', { reviews });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error fetching reviews');
        res.redirect('/home');
    }
});

module.exports = router;