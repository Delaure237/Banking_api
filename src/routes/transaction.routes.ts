import { Router } from 'express';
import transactionController from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { depositValidation, withdrawValidation, transferValidation, paginationValidation, uuidParamValidation } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Banking transactions (deposit, withdrawal, transfer)
 */

/**
 * @swagger
 * /api/transactions/deposit:
 *   post:
 *     summary: Make a deposit
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, amount]
 *             properties:
 *               accountId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 1000.00
 *               description:
 *                 type: string
 *                 example: "Cash deposit"
 *     responses:
 *       201:
 *         description: Deposit successful
 *       400:
 *         description: Bad request
 *       404:
 *         description: Account not found
 */
router.post('/deposit', authenticate, depositValidation, transactionController.deposit);

/**
 * @swagger
 * /api/transactions/withdraw:
 *   post:
 *     summary: Make a withdrawal
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, amount]
 *             properties:
 *               accountId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 500.00
 *               description:
 *                 type: string
 *                 example: "ATM withdrawal"
 *     responses:
 *       201:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient funds
 */
router.post('/withdraw', authenticate, withdrawValidation, transactionController.withdraw);

/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     summary: Transfer money between accounts
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromAccountId, toAccountId, amount]
 *             properties:
 *               fromAccountId:
 *                 type: string
 *                 format: uuid
 *               toAccountId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 250.00
 *               description:
 *                 type: string
 *                 example: "Rent payment"
 *     responses:
 *       201:
 *         description: Transfer successful
 *       400:
 *         description: Insufficient funds or same account
 */
router.post('/transfer', authenticate, transferValidation, transactionController.transfer);

/**
 * @swagger
 * /api/transactions/account/{accountId}:
 *   get:
 *     summary: Get transactions for an account
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, transfer, payment, fee, interest, refund]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled, reversed]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transaction list with pagination
 */
router.get('/account/:accountId', authenticate, ...uuidParamValidation('accountId'), paginationValidation, transactionController.getByAccount);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 */
router.get('/:id', authenticate, ...uuidParamValidation(), transactionController.getById);

export default router;
