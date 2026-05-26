import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { reminderService } from '../services/reminder.service';

const router = Router();

// Trigger daily reminder email (manual or scheduled)
router.post('/send', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await reminderService.sendDailyReminder(req.userId!);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
