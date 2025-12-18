import express from 'express';
import { getStock } from '../controllers/stock-controller.js';

const router = express.Router();

router.get('/:id', getStock);

export default router;
