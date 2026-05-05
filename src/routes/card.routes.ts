import { Router } from 'express';
import cardController from '../controllers/card.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { createCardValidation, updateCardLimitsValidation, paginationValidation, uuidParamValidation } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: Bank card management
 */

/**
 * @swagger
 * /api/cards:
 *   post:
 *     summary: Request a new card
 *     tags: [Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, type]
 *             properties:
 *               accountId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [debit, credit, prepaid]
 *                 example: debit
 *     responses:
 *       201:
 *         description: Card created
 *       404:
 *         description: Account not found
 */
router.post('/', authenticate, createCardValidation, cardController.create);

/**
 * @swagger
 * /api/cards:
 *   get:
 *     summary: Get all user cards
 *     tags: [Cards]
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
 *         description: Cards list
 */
router.get('/', authenticate, paginationValidation, cardController.getAll);

/**
 * @swagger
 * /api/cards/{id}:
 *   get:
 *     summary: Get card by ID
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Card details
 *       404:
 *         description: Card not found
 */
router.get('/:id', authenticate, ...uuidParamValidation(), cardController.getById);

/**
 * @swagger
 * /api/cards/{id}/status:
 *   patch:
 *     summary: Update card status
 *     tags: [Cards]
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
 *                 enum: [active, inactive, blocked]
 *     responses:
 *       200:
 *         description: Card status updated
 */
router.patch('/:id/status', authenticate, ...uuidParamValidation(), cardController.updateStatus);

/**
 * @swagger
 * /api/cards/{id}/limits:
 *   put:
 *     summary: Update card spending limits
 *     tags: [Cards]
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
 *               dailyLimit:
 *                 type: number
 *                 example: 2000
 *               monthlyLimit:
 *                 type: number
 *                 example: 30000
 *     responses:
 *       200:
 *         description: Card limits updated
 */
router.put('/:id/limits', authenticate, ...uuidParamValidation(), updateCardLimitsValidation, cardController.updateLimits);

/**
 * @swagger
 * /api/cards/{id}/contactless:
 *   patch:
 *     summary: Toggle contactless payment
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Contactless toggled
 */
router.patch('/:id/contactless', authenticate, ...uuidParamValidation(), cardController.toggleContactless);

/**
 * @swagger
 * /api/cards/{id}/online:
 *   patch:
 *     summary: Toggle online payments
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Online payments toggled
 */
router.patch('/:id/online', authenticate, ...uuidParamValidation(), cardController.toggleOnline);

/**
 * @swagger
 * /api/cards/{id}/block:
 *   patch:
 *     summary: Block a card immediately
 *     tags: [Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Card blocked
 */
router.patch('/:id/block', authenticate, ...uuidParamValidation(), cardController.blockCard);

export default router;
