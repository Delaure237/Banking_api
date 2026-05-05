import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from '../errors';

export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }
  next();
};

// Auth validations
export const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('postalCode').trim().notEmpty().withMessage('Postal code is required'),
  body('nationalId').trim().notEmpty().withMessage('National ID is required'),
  validate,
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Account validations
export const createAccountValidation = [
  body('type').isIn(['checking', 'savings', 'business']).withMessage('Invalid account type'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  validate,
];

// Transaction validations
export const depositValidation = [
  body('accountId').isUUID().withMessage('Valid account ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString(),
  validate,
];

export const withdrawValidation = [
  body('accountId').isUUID().withMessage('Valid account ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString(),
  validate,
];

export const transferValidation = [
  body('fromAccountId').isUUID().withMessage('Valid source account ID is required'),
  body('toAccountId').isUUID().withMessage('Valid destination account ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString(),
  validate,
];

// Card validations
export const createCardValidation = [
  body('accountId').isUUID().withMessage('Valid account ID is required'),
  body('type').isIn(['debit', 'credit', 'prepaid']).withMessage('Invalid card type'),
  validate,
];

export const updateCardLimitsValidation = [
  body('dailyLimit').optional().isFloat({ min: 0 }).withMessage('Daily limit must be >= 0'),
  body('monthlyLimit').optional().isFloat({ min: 0 }).withMessage('Monthly limit must be >= 0'),
  validate,
];

// Beneficiary validations
export const createBeneficiaryValidation = [
  body('name').trim().notEmpty().withMessage('Beneficiary name is required'),
  body('iban').trim().notEmpty().withMessage('IBAN is required'),
  body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('bankCode').optional().isString(),
  validate,
];

// Loan validations
export const createLoanValidation = [
  body('accountId').isUUID().withMessage('Valid account ID is required'),
  body('type').isIn(['personal', 'mortgage', 'auto', 'student', 'business']).withMessage('Invalid loan type'),
  body('amount').isFloat({ min: 100 }).withMessage('Loan amount must be at least 100'),
  body('termMonths').isInt({ min: 1, max: 360 }).withMessage('Term must be between 1 and 360 months'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  validate,
];

// Pagination validation
export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  validate,
];

// Param validations
export const uuidParamValidation = (paramName: string = 'id') => [
  param(paramName).isUUID().withMessage(`Valid ${paramName} is required`),
  validate,
];
