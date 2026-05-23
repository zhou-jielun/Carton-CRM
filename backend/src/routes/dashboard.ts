import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCustomers, newToday, newThisWeek, newThisMonth, campaigns, tasks] = await Promise.all([
      prisma.customer.count({ where: { userId } }),
      prisma.customer.count({ where: { userId, createdAt: { gte: startOfDay } } }),
      prisma.customer.count({ where: { userId, createdAt: { gte: startOfWeek } } }),
      prisma.customer.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
      prisma.emailCampaign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, status: true, totalSent: true, createdAt: true },
      }),
      prisma.automationTask.findMany({
        where: { userId },
        select: { id: true, name: true, type: true, status: true, lastRunAt: true },
      }),
    ]);

    const highIntentCustomers = await prisma.customer.count({
      where: { userId, score: { gte: 70 } },
    });

    res.json({
      success: true,
      data: {
        customers: { total: totalCustomers, newToday, newThisWeek, newThisMonth },
        campaigns,
        tasks,
        highIntentCustomers,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/activity', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;
