import express from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = express.Router();

router.post('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  res.json({ success: true, data: { meeting: { id: 'meeting_123' } } });
}));

router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  res.json({ success: true, data: { meeting: { id: req.params.id } } });
}));

export { router as meetingRouter };
