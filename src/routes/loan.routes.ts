import { Router } from 'express';
import loanController from '../controllers/loan.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createLoanValidation, paginationValidation, uuidParamValidation } from '../middlewares/validation.middleware';
import { UserRole } from '../shared/types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Loans
 *   description: Loan management (apply, approve, reject, pay)
 */

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Apply for a loan
 *     tags: [Loans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, type, amount, termMonths, description]
 *             properties:
 *               accountId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [personal, mortgage, auto, student, business]
 *                 example: personal
 *               amount:
 *                 type: number
 *                 minimum: 100
 *                 example: 10000
 *               termMonths:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 360
 *                 example: 24
 *               description:
 *                 type: string
 *                 example: "Home renovation loan"
 *     responses:
 *       201:
 *         description: Loan application submitted
 *       404:
 *         description: Account not found
 */
router.post('/', authenticate, createLoanValidation, loanController.apply);

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Get my loans
 *     tags: [Loans]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Loans list
 */
router.get('/', authenticate, paginationValidation, loanController.getMyLoans);

/**
 * @swagger
 * /api/loans/{id}:
 *   get:
 *     summary: Get loan details
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Loan details
 *       404:
 *         description: Loan not found
 */
router.get('/:id', authenticate, ...uuidParamValidation(), loanController.getById);

/**
 * @swagger
 * /api/loans/{id}/approve:
 *   patch:
 *     summary: Approve a loan (admin only)
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Loan approved and funds disbursed
 *       400:
 *         description: Loan not in pending status
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/approve', authenticate, authorize(UserRole.ADMIN), ...uuidParamValidation(), loanController.approve);

/**
 * @swagger
 * /api/loans/{id}/reject:
 *   patch:
 *     summary: Reject a loan (admin only)
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Loan rejected
 *       400:
 *         description: Loan not in pending status
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/reject', authenticate, authorize(UserRole.ADMIN), ...uuidParamValidation(), loanController.reject);

/**
 * @swagger
 * /api/loans/{id}/pay:
 *   post:
 *     summary: Make a loan payment
 *     tags: [Loans]
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
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 450.00
 *     responses:
 *       200:
 *         description: Payment successful
 *       400:
 *         description: Loan not active or payment exceeds balance
 */
router.post('/:id/pay', authenticate, ...uuidParamValidation(), loanController.makePayment);

export default router;
