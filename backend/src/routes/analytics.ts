import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();

// Full analytics data
router.get('/overview', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const now = new Date();

    // Customer status breakdown
    const statusBreakdown = await prisma.customer.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    });

    // Source breakdown
    const sourceBreakdown = await prisma.customer.groupBy({
      by: ['source'],
      where: { userId, source: { not: null } },
      _count: { id: true },
    });

    // Monthly new customers (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyCustomers = await prisma.customer.findMany({
      where: { userId, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });

    const monthlyData: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
    }
    for (const c of monthlyCustomers) {
      const d = c.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key] !== undefined) monthlyData[key]++;
    }

    // Campaign stats
    const campaignStats = await prisma.emailCampaign.aggregate({
      where: { userId },
      _sum: { totalSent: true, totalOpened: true, totalClicked: true, totalReplied: true },
    });

    // Interaction stats by type
    const interactionsByType = await prisma.interaction.groupBy({
      by: ['type'],
      where: { customer: { userId } },
      _count: { id: true },
    });

    // Country breakdown
    const countryBreakdown = await prisma.customer.groupBy({
      by: ['country'],
      where: { userId, country: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Score distribution
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];
    const scoreDistribution = await Promise.all(
      scoreRanges.map(async ({ range, min, max }) => ({
        range,
        count: await prisma.customer.count({ where: { userId, score: { gte: min, lte: max } } }),
      }))
    );

    res.json({
      success: true,
      data: {
        statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.id })),
        sourceBreakdown: sourceBreakdown.map((s) => ({ source: s.source, count: s._count.id })),
        monthlyCustomers: Object.entries(monthlyData).map(([month, count]) => ({ month, count })),
        campaignStats: {
          sent: campaignStats._sum.totalSent || 0,
          opened: campaignStats._sum.totalOpened || 0,
          clicked: campaignStats._sum.totalClicked || 0,
          replied: campaignStats._sum.totalReplied || 0,
        },
        interactionsByType: interactionsByType.map((i) => ({ type: i.type, count: i._count.id })),
        countryBreakdown: countryBreakdown.map((c) => ({ country: c.country, count: c._count.id })),
        scoreDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
});

// AI reports list
router.get('/reports', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.aiReport.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, title: true, type: true, summary: true, createdAt: true, periodStart: true, periodEnd: true },
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

export default router;
