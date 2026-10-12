const { body, validationResult } = require('express-validator');

const PASSWORD_RULE = [
  'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
];

const passwordRules = () => [
  body('password')
    .trim()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),
];

const registerRules = () => [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.')
    .escape(),

  body('email')
    .trim()
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email must not exceed 254 characters.'),

  ...passwordRules(),

  body('role')
    .optional()
    .trim()
    .isIn(['client', 'freelancer']).withMessage('Role must be either "client" or "freelancer".'),
];

const loginRules = () => [
  body('email')
    .trim()
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty().withMessage('Password is required.'),
];

const gigRules = (optional = false) => {
  const title = body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be between 3 and 120 characters.').escape();
  const description = body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be between 20 and 2000 characters.').escape();
  const category = body('category').trim().isLength({ min: 2, max: 60 }).withMessage('Category is required.').escape();
  const price = body('price').isFloat({ min: 1, max: 100000 }).withMessage('Price must be between 1 and 100000.').toFloat();
  const deliveryDays = body('deliveryDays').isInt({ min: 1, max: 365 }).withMessage('Delivery days must be between 1 and 365.').toInt();
  return optional ? [title.optional(), description.optional(), category.optional(), price.optional(), deliveryDays.optional()] : [title, description, category, price, deliveryDays];
};

const bookingRules = () => [
  body('gigId').isMongoId().withMessage('A valid gig is required.'),
  body('requirements').optional().trim().isLength({ max: 2000 }).withMessage('Requirements must not exceed 2000 characters.').escape(),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: 'Validation failed.',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = {
  registerRules,
  loginRules,
  passwordRules,
  validate,
  PASSWORD_RULE,
  gigRules,
  bookingRules,
};
