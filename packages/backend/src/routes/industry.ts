import express from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = express.Router();

router.get('/modules', asyncHandler(async (req: express.Request, res: express.Response) => {
  res.json({ success: true, data: { modules: [] } });
}));

export { router as industryRouter };
