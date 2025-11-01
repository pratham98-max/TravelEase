const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'Templates'));
// Serve static files
app.use(express.static(path.join(__dirname, 'static')));
// Set view engine
// (views already configured above)

// Use EJS layouts
app.use(expressLayouts);
app.set('layout', 'layout.ejs');
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/travel_db',
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Flash messages middleware
app.use(flash());

// Make flash messages and user data available to all templates
app.use((req, res, next) => {
    // If a userId is in session, load the user document so views can access username etc.
    res.locals.user = null;
    if (req.session && req.session.userId) {
        // lazy require to avoid circular deps
        const User = require('./models/User');
        User.findById(req.session.userId).then(user => {
            res.locals.user = user || null;
            res.locals.success = req.flash('success');
            res.locals.error = req.flash('error');
            next();
        }).catch(err => {
            console.error('Error loading user for template locals', err);
            res.locals.success = req.flash('success');
            res.locals.error = req.flash('error');
            next();
        });
        return;
    }
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));

// Also mount the same route handlers on non-API paths so page links like
// `/destinations/:id` and `/bookings` work (these handlers render EJS views).
app.use('/users', require('./routes/users'));
app.use('/destinations', require('./routes/destinations'));
app.use('/bookings', require('./routes/bookings'));
app.use('/reviews', require('./routes/reviews'));

// Main route
app.get('/', (req, res) => {
    res.render('welcome.ejs');
});

app.get('/home', (req, res) => {
    // Redirect to the public destinations listing which renders index.ejs
    const qs = req.originalUrl.split('?')[1];
    res.redirect('/destinations' + (qs ? ('?' + qs) : ''));
});

// Render auth pages
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Dashboard page for logged-in user
app.get('/dashboard', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.redirect('/login');
        const Booking = require('./models/Booking');
        const Review = require('./models/Review');
        const bookings = await Booking.find({ user: req.session.userId }).populate('destination').sort({ createdAt: -1 });
        const reviews = await Review.find({ user: req.session.userId }).populate('destination').sort({ createdAt: -1 });
        res.render('dashboard.ejs', { bookings, reviews, user: res.locals.user });
    } catch (err) {
        console.error(err);
        res.redirect('/home');
    }
    
});