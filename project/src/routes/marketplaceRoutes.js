const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { listGigs, createGig, updateGig, deleteGig, createBooking, listBookings, updateBooking, getIncome, listUsers } = require('../controllers/marketplaceController');
const { gigRules, bookingRules, validate } = require('../middleware/validators');

const isTest = process.env.NODE_ENV === 'test';
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many booking requests. Please try again later.' },
});
const skipInTest = (_req, _res, next) => next();

router.get('/gigs', listGigs);
router.post('/gigs', authenticate, authorize('freelancer'), gigRules(), validate, createGig);
router.patch('/gigs/:id', authenticate, authorize('freelancer'), gigRules(true), validate, updateGig);
router.delete('/gigs/:id', authenticate, authorize('freelancer'), deleteGig);
router.post('/bookings', isTest ? skipInTest : bookingLimiter, authenticate, authorize('client'), bookingRules(), validate, createBooking);
router.get('/bookings', authenticate, authorize('client', 'freelancer'), listBookings);
router.patch('/bookings/:id/status', authenticate, authorize('client', 'freelancer'), updateBooking);
router.get('/income', authenticate, authorize('freelancer'), getIncome);
router.get('/admin/users', authenticate, authorize('admin'), listUsers);

module.exports = router;
