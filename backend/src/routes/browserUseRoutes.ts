import express from 'express';
import { browserUseController } from '../controllers/browserUseController';

const router = express.Router();

router.post('/message', browserUseController.handleBrowserMessage);
router.post('/action', browserUseController.handleBrowserAction);
router.get('/history', browserUseController.getBrowserHistory);

export default router;
