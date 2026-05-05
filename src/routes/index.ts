import { Router } from 'express';
import authRoutes from './auth.routes';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import cardRoutes from './card.routes';
import beneficiaryRoutes from './beneficiary.routes';
import loanRoutes from './loan.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/cards', cardRoutes);
router.use('/beneficiaries', beneficiaryRoutes);
router.use('/loans', loanRoutes);

export default router;
