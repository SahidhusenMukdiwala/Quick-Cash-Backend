import express from 'express';
import {
  create,
  getAll,
  getById,
  update,
  remove
} from '../controllers/transaction.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createTransactionSchema, updateTransactionSchema, transactionIdParamSchema } from '../validations/transaction.validation.js';

const router = express.Router();

router.use(verifyToken);

router.post('/create', validate(createTransactionSchema), create);
router.get('/lists', getAll);
router.get('/list/:id', validate(transactionIdParamSchema), getById);
router.patch('/update/:id', validate(updateTransactionSchema), update);
router.delete('/delete/:id', validate(transactionIdParamSchema), remove);

export default router;
