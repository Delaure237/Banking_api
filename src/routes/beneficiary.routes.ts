import { Router } from 'express';
import beneficiaryController from '../controllers/beneficiary.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { createBeneficiaryValidation, paginationValidation, uuidParamValidation } from '../middlewares/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Beneficiaries
 *   description: Beneficiary management for transfers
 */

/**
 * @swagger
 * /api/beneficiaries:
 *   post:
 *     summary: Add a new beneficiary
 *     tags: [Beneficiaries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, iban, bankName]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               iban:
 *                 type: string
 *                 example: "FR7630006000011234567890189"
 *               bankName:
 *                 type: string
 *                 example: "BNP Paribas"
 *               bankCode:
 *                 type: string
 *                 example: "BNPAFRPP"
 *     responses:
 *       201:
 *         description: Beneficiary added
 *       409:
 *         description: Beneficiary with this IBAN already exists
 */
router.post('/', authenticate, createBeneficiaryValidation, beneficiaryController.create);

/**
 * @swagger
 * /api/beneficiaries:
 *   get:
 *     summary: Get all beneficiaries
 *     tags: [Beneficiaries]
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
 *         description: Beneficiaries list
 */
router.get('/', authenticate, paginationValidation, beneficiaryController.getAll);

/**
 * @swagger
 * /api/beneficiaries/{id}:
 *   get:
 *     summary: Get beneficiary by ID
 *     tags: [Beneficiaries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Beneficiary details
 *       404:
 *         description: Beneficiary not found
 */
router.get('/:id', authenticate, ...uuidParamValidation(), beneficiaryController.getById);

/**
 * @swagger
 * /api/beneficiaries/{id}:
 *   put:
 *     summary: Update a beneficiary
 *     tags: [Beneficiaries]
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
 *               name:
 *                 type: string
 *               iban:
 *                 type: string
 *               bankName:
 *                 type: string
 *               bankCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Beneficiary updated
 */
router.put('/:id', authenticate, ...uuidParamValidation(), beneficiaryController.update);

/**
 * @swagger
 * /api/beneficiaries/{id}:
 *   delete:
 *     summary: Remove a beneficiary
 *     tags: [Beneficiaries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Beneficiary removed
 *       404:
 *         description: Beneficiary not found
 */
router.delete('/:id', authenticate, ...uuidParamValidation(), beneficiaryController.delete);

export default router;
