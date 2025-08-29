import express from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = express.Router();

router.get('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  res.json({ success: true, data: { users: [] } });
}));

export { router as userRouter };
