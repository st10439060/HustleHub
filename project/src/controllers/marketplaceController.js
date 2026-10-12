const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

async function listGigs(req, res, next) {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = String(req.query.category).trim();
    if (req.query.search) {
      const search = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }];
    }
    const gigs = await Gig.find(filter).populate('freelancer', 'name email').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, gigs });
  } catch (err) { next(err); }
}

async function createGig(req, res, next) {
  try {
    const gig = await Gig.create({ ...req.body, freelancer: req.user.id });
    res.status(201).json({ success: true, gig });
  } catch (err) { next(err); }
}

async function updateGig(req, res, next) {
  try {
    const gig = await Gig.findOne({ _id: req.params.id, freelancer: req.user.id });
    if (!gig) return res.status(404).json({ success: false, error: 'Gig not found or not owned by you.' });
    ['title', 'description', 'category', 'price', 'deliveryDays'].forEach((field) => {
      if (req.body[field] !== undefined) gig[field] = req.body[field];
    });
    await gig.save();
    res.json({ success: true, gig });
  } catch (err) { next(err); }
}

async function deleteGig(req, res, next) {
  try {
    const gig = await Gig.findOneAndUpdate({ _id: req.params.id, freelancer: req.user.id }, { isActive: false }, { new: true });
    if (!gig) return res.status(404).json({ success: false, error: 'Gig not found or not owned by you.' });
    res.json({ success: true, message: 'Gig archived.' });
  } catch (err) { next(err); }
}

async function createBooking(req, res, next) {
  try {
    const gig = await Gig.findOne({ _id: req.body.gigId, isActive: true });
    if (!gig) return res.status(404).json({ success: false, error: 'Available gig not found.' });
    if (gig.freelancer.toString() === req.user.id) return res.status(403).json({ success: false, error: 'You cannot book your own gig.' });
    const booking = await Booking.create({ gig: gig._id, client: req.user.id, freelancer: gig.freelancer, requirements: req.body.requirements, amount: gig.price });
    const platformFee = Math.round(gig.price * 0.1 * 100) / 100;
    const transaction = await Transaction.create({ booking: booking._id, client: req.user.id, freelancer: gig.freelancer, amount: gig.price, platformFee, freelancerAmount: gig.price - platformFee });
    const populated = await booking.populate([{ path: 'gig', select: 'title category price deliveryDays' }, { path: 'freelancer', select: 'name email' }]);
    res.status(201).json({ success: true, booking: populated, transaction });
  } catch (err) { next(err); }
}

async function listBookings(req, res, next) {
  try {
    const filter = req.user.role === 'client' ? { client: req.user.id } : { freelancer: req.user.id };
    const bookings = await Booking.find(filter).populate('gig', 'title category price deliveryDays').populate('client freelancer', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
}

async function updateBooking(req, res, next) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, $or: [{ client: req.user.id }, { freelancer: req.user.id }] });
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found or not owned by you.' });
    const allowed = req.user.role === 'freelancer' ? ['accepted', 'in_progress', 'completed'] : ['cancelled'];
    if (!allowed.includes(req.body.status)) return res.status(403).json({ success: false, error: 'That status change is not allowed for your role.' });
    const transitions = { pending: ['accepted', 'cancelled'], accepted: ['in_progress', 'cancelled'], in_progress: ['completed'], completed: [], cancelled: [] };
    if (!transitions[booking.status].includes(req.body.status)) return res.status(409).json({ success: false, error: 'That booking status transition is not available.' });
    booking.status = req.body.status;
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) { next(err); }
}

async function getIncome(req, res, next) {
  try {
    const transactions = await Transaction.find({ freelancer: req.user.id, status: 'paid' }).sort({ createdAt: -1 }).populate('booking', 'status');
    const gross = transactions.reduce((sum, item) => sum + item.amount, 0);
    const fees = transactions.reduce((sum, item) => sum + item.platformFee, 0);
    res.json({ success: true, summary: { gross, fees, net: gross - fees, estimatedTax: Math.round((gross - fees) * 0.2 * 100) / 100 }, transactions });
  } catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 });
    res.json({ success: true, users: users.map(safeUser) });
  } catch (err) { next(err); }
}

module.exports = { listGigs, createGig, updateGig, deleteGig, createBooking, listBookings, updateBooking, getIncome, listUsers };
