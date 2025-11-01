const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already exists!');
            return res.redirect('/signup');
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
        });
        await user.save();

        req.flash('success', 'Account created successfully! Please log in.');
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error creating account');
        res.redirect('/signup');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
        }

        // Set session
        req.session.userId = user._id;
        req.flash('success', 'Login successful!');
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error logging in');
        res.redirect('/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Get user profile
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        // Render dashboard since profile view isn't present; dashboard will show user info if available
        res.render('dashboard.ejs', { user });
    } catch (error) {
        console.error(error);
        res.redirect('/home');
    }
});

module.exports = router;