const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 * Registers a new client or freelancer.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, role: role || 'client' });

    logger.info(`User registered: ${email} (role: ${user.role})`);

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
      return res.status(422).json({ success: false, error: 'Validation failed.', details });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn(`Failed login attempt (unknown email): ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      logger.warn(`Failed login attempt (wrong password): ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    logger.info(`User logged in: ${email} (role: ${user.role})`);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/health
 * Public health check endpoint.
 */
function health(_req, res) {
  return res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
}

module.exports = { register, login, me, health };
