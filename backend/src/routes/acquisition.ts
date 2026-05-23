import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { acquisitionService } from '../services/acquisition.service';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { aiService } from '../services/ai.service';

const router = Router();

// Create automation task (scheduled acquisition)
router.post('/task', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      keywords: z.array(z.string()).min(1),
      schedule: z.string().optional(),
      maxPerKeyword: z.number().default(10),
    });
    const data = schema.parse(req.body);

    const task = await prisma.automationTask.create({
      data: {
        userId: req.userId!,
        name: data.name,
        type: 'google_scrape',
        status: 'idle',
        schedule: data.schedule,
        config: { keywords: data.keywords, maxPerKeyword: data.maxPerKeyword },
      },
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Run acquisition immediately
router.post('/run', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      keywords: z.array(z.string()).min(1).max(50),
      maxPerKeyword: z.number().default(10),
      aiScore: z.boolean().default(true),
    });
    const { keywords, maxPerKeyword, aiScore } = schema.parse(req.body);

    // Create a one-time task
    const task = await prisma.automationTask.create({
      data: {
        userId: req.userId!,
        name: `Manual: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`,
        type: 'google_scrape',
        status: 'running',
        config: { keywords, maxPerKeyword, aiScore },
      },
    });

    // Run (non-blocking)
    acquisitionService.runAcquisition(req.userId!, keywords, { maxPerKeyword, aiScore })
      .then(async (result) => {
        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'completed' },
        });
        await prisma.taskLog.create({
          data: {
            taskId: task.id,
            status: 'success',
            message: `Created ${result.customersCreated} customers from ${keywords.length} keywords`,
            metadata: JSON.parse(JSON.stringify(result)),
          },
        });
      })
      .catch(async (err) => {
        await prisma.automationTask.update({
          where: { id: task.id },
          data: { status: 'failed' },
        });
        await prisma.taskLog.create({
          data: {
            taskId: task.id,
            status: 'failed',
            message: err.message,
          },
        });
      });

    res.json({ success: true, message: 'Acquisition started', taskId: task.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Import customs data
router.post('/import-customs', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      csvData: z.string().min(1),
    });
    const { csvData } = schema.parse(req.body);
    const imported = await acquisitionService.importCustomsData(req.userId!, csvData);

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'customs_import',
        entity: 'customer',
        details: { imported },
      },
    });

    res.json({ success: true, data: { imported } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// AI score single customer
router.post('/score/:customerId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.customerId, userId: req.userId! },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    const result = await aiService.scoreCustomer({
      companySize: customer.size || undefined,
      industry: customer.industry || undefined,
      website: customer.website || undefined,
      country: customer.country || undefined,
    });

    await prisma.customer.update({
      where: { id: customer.id },
      data: { score: result.score },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Batch score all unscored customers
router.post('/score-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { userId: req.userId!, score: 0 },
      take: 50,
    });

    let scored = 0;
    for (const customer of customers) {
      try {
        const result = await aiService.scoreCustomer({
          companySize: customer.size || undefined,
          industry: customer.industry || undefined,
          website: customer.website || undefined,
          country: customer.country || undefined,
        });
        await prisma.customer.update({
          where: { id: customer.id },
          data: { score: result.score },
        });
        scored++;
      } catch {
        // skip failed
      }
    }

    res.json({ success: true, data: { total: customers.length, scored } });
  } catch (err) {
    next(err);
  }
});

export default router;
