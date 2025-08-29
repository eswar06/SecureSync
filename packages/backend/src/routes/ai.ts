import express from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = express.Router();

router.post('/adapt', asyncHandler(async (req: express.Request, res: express.Response) => {
  res.json({ success: true, data: { adaptation: { layout: 'default' } } });
}));

export { router as aiRouter };
