const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');

/**
 * Protected demo route — proves JWT middleware works.
 * Returns the authenticated user's basic info.
 */
router.get('/profile', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'You have accessed a protected route.',
    user: req.user,
  });
});

module.exports = router;
