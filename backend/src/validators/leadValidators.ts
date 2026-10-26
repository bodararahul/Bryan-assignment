import { body, param, query as queryValidator } from 'express-validator';

export const createLeadValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 255 }).withMessage('Name must be at most 255 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Email must be a valid email address')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Please enter a valid email address with a valid domain (e.g. name@company.com)')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+\d{1,4}\s)?[0-9]{10}$/)
    .withMessage('Phone number must contain exactly 10 digits with an optional country code (e.g. +91 9876543210)'),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Notes must be at most 5000 characters'),
];

export const updateStatusValidation = [
  param('id')
    .isUUID().withMessage('Lead ID must be a valid UUID'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['New', 'Contacted', 'Qualified', 'Closed'])
    .withMessage('Status must be one of: New, Contacted, Qualified, Closed'),
];

export const updateLeadValidation = [
  param('id')
    .isUUID().withMessage('Lead ID must be a valid UUID'),

  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 255 }).withMessage('Name must be at most 255 characters'),

  body('email')
    .optional()
    .trim()
    .notEmpty().withMessage('Email cannot be empty')
    .isEmail().withMessage('Email must be a valid email address')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Please enter a valid email address with a valid domain (e.g. name@company.com)')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .notEmpty().withMessage('Phone number cannot be empty')
    .matches(/^(\+\d{1,4}\s)?[0-9]{10}$/)
    .withMessage('Phone number must contain exactly 10 digits with an optional country code (e.g. +91 9876543210)'),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Notes must be at most 5000 characters'),

  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Closed'])
    .withMessage('Status must be one of: New, Contacted, Qualified, Closed'),
];

export const deleteLeadValidation = [
  param('id')
    .isUUID().withMessage('Lead ID must be a valid UUID'),
];

export const getLeadsValidation = [
  queryValidator('search')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Search term too long'),

  queryValidator('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Closed'])
    .withMessage('Status filter must be one of: New, Contacted, Qualified, Closed'),

  queryValidator('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  queryValidator('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];
