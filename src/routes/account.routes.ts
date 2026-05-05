import { Router } from 'express';
import accountController from '../controllers/account.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createAccountValidation, paginationValidation, uuidParamValidation } from '../middlewares/validation.middleware';
import { UserRole } from '../shared/types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Bank account management
 */

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new bank account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [checking, savings, business]
 *                 example: checking
 *               currency:
 *                 type: string
 *                 example: EUR
 *     responses:
 *       201:
 *         description: Account created
 *       422:
 *         description: Validation error
 */
router.post('/', authenticate, createAccountValidation, accountController.create);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get all accounts of the current user
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Accounts list
 */
router.get('/', authenticate, paginationValidation, accountController.getAll);

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Account details
 *       404:
 *         description: Account not found
 */
router.get('/:id', authenticate, ...uuidParamValidation(), accountController.getById);

/**
 * @swagger
 * /api/accounts/{id}/balance:
 *   get:
 *     summary: Get account balance
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Account balance details
 *       404:
 *         description: Account not found
 */
router.get('/:id/balance', authenticate, ...uuidParamValidation(), accountController.getBalance);

/**
 * @swagger
 * /api/accounts/{id}/limits:
 *   put:
 *     summary: Update account limits
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dailyTransferLimit:
 *                 type: number
 *                 example: 50000
 *               dailyWithdrawalLimit:
 *                 type: number
 *                 example: 5000
 *               overdraftLimit:
 *                 type: number
 *                 example: 1000
 *     responses:
 *       200:
 *         description: Limits updated
 */
router.put('/:id/limits', authenticate, ...uuidParamValidation(), accountController.updateLimits);

/**
 * @swagger
 * /api/accounts/{id}/close:
 *   put:
 *     summary: Close an account
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Account closed
 *       400:
 *         description: Account balance must be 0
 */
router.put('/:id/close', authenticate, ...uuidParamValidation(), accountController.closeAccount);

/**
 * @swagger
 * /api/accounts/{id}/status:
 *   patch:
 *     summary: Update account status (admin only)
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, locked, closed]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/status', authenticate, authorize(UserRole.ADMIN), ...uuidParamValidation(), accountController.updateStatus);

export default router;
