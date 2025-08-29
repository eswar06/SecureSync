import express from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = express.Router();

router.post('/start', asyncHandler(async (req: express.Request, res: express.Response) => {
  res.json({ success: true, data: { transcription: { id: 'transcription_123' } } });
}));

export { router as transcriptionRouter };
