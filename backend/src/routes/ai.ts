import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { aiService } from '../services/ai.service';
import prisma from '../utils/prisma';

const router = Router();

// Test AI connection
router.post('/test', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ apiKey: z.string().min(1) });
    const { apiKey } = schema.parse(req.body);

    aiService.setApiKey(apiKey);
    const result = await aiService.generateSalesEmail({
      companyName: 'Test Company',
      customerCompany: 'Test Customer',
      productInfo: 'Testing API connection',
      language: 'en',
    });

    res.json({ success: true, message: 'AI connection successful', data: { sample: result.substring(0, 100) } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    res.status(400).json({ success: false, message: 'AI connection failed: ' + (err as Error).message });
  }
});

// Score customer
router.post('/score-customer', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerId } = z.object({ customerId: z.string() }).parse(req.body);

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, userId: req.userId! },
    });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const result = await aiService.scoreCustomer({
      companySize: customer.size || undefined,
      industry: customer.industry || undefined,
      website: customer.website || undefined,
      country: customer.country || undefined,
    });

    await prisma.customer.update({
      where: { id: customerId },
      data: { score: result.score },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Generate report
router.post('/generate-report', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.enum(['weekly', 'monthly']),
      period: z.string(),
      language: z.string().default('zh'),
    });
    const { type, period, language } = schema.parse(req.body);

    const userId = req.userId!;

    // Gather stats
    const [totalCustomers, totalCampaigns, totalInteractions] = await Promise.all([
      prisma.customer.count({ where: { userId } }),
      prisma.emailCampaign.count({ where: { userId } }),
      prisma.interaction.count({ where: { customer: { userId } } }),
    ]);

    const stats = { totalCustomers, totalCampaigns, totalInteractions };

    const reportContent = await aiService.generateReport({ type, period, stats, language });

    const report = await prisma.aiReport.create({
      data: {
        userId,
        type,
        title: `${type === 'weekly' ? '周' : '月'}度获客报告 - ${period}`,
        summary: reportContent.substring(0, 500),
        content: { full: reportContent },
        periodStart: new Date(),
        periodEnd: new Date(),
      },
    });

    res.json({ success: true, data: report });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// List reports
router.get('/reports', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.aiReport.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

export default router;
