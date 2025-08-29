import express from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = express.Router();

router.post('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  res.json({ success: true, data: { reminder: { id: 'reminder_123' } } });
}));

export { router as reminderRouter };
