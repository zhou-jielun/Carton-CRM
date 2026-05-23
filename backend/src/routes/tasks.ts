import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { acquisitionService } from '../services/acquisition.service';
import { followUpService } from '../services/followup.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// List all automation tasks
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await prisma.automationTask.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      include: { taskLogs: { orderBy: { startedAt: 'desc' }, take: 5 } },
    });
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// Create automation task
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      type: z.enum(['google_scrape', 'email_send', 'whatsapp_send', 'data_analysis', 'report']),
      schedule: z.string().optional(),
      config: z.record(z.any()).default({}),
    });
    const data = schema.parse(req.body);

    const task = await prisma.automationTask.create({
      data: {
        userId: req.userId!,
        name: data.name,
        type: data.type,
        status: 'idle',
        schedule: data.schedule,
        config: data.config,
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

// Run task immediately
router.post('/:id/run', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.automationTask.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!task) throw new AppError('Task not found', 404);

    // Update status
    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'running' },
    });

    // Execute based on type
    let result: any = {};

    try {
      switch (task.type) {
        case 'google_scrape': {
          const config = task.config as any;
          if (config?.keywords?.length) {
            result = await acquisitionService.runAcquisition(req.userId!, config.keywords, {
              maxPerKeyword: config.maxPerKeyword || 10,
            });
          }
          break;
        }
        case 'email_send':
        case 'followup': {
          result = await followUpService.autoFollowUp(req.userId!);
          break;
        }
        case 'report': {
          // Report generation handled in AI routes
          result = { message: 'Report generation started' };
          break;
        }
        default:
          result = { message: `Task type '${task.type}' execution not yet implemented` };
      }

      await prisma.automationTask.update({
        where: { id: task.id },
        data: { status: 'completed', lastRunAt: new Date() },
      });

      await prisma.taskLog.create({
        data: {
          taskId: task.id,
          status: 'success',
          message: `Task completed successfully`,
          metadata: JSON.parse(JSON.stringify(result)),
        },
      });
    } catch (err) {
      await prisma.automationTask.update({
        where: { id: task.id },
        data: { status: 'failed' },
      });

      await prisma.taskLog.create({
        data: {
          taskId: task.id,
          status: 'failed',
          message: (err as Error).message,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Toggle task pause/resume
router.patch('/:id/toggle', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.automationTask.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!task) throw new AppError('Task not found', 404);

    const newStatus = task.status === 'paused' ? 'idle' : 'paused';
    const updated = await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: newStatus },
    });

    res.json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
});

// Delete task
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.automationTask.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!task) throw new AppError('Task not found', 404);

    await prisma.automationTask.delete({ where: { id: task.id } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// Get task logs
router.get('/:id/logs', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.taskLog.findMany({
      where: { taskId: req.params.id },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// Run follow-up check immediately
router.post('/followup/run', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await followUpService.autoFollowUp(req.userId!);

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'followup_run',
        entity: 'campaign',
        details: result,
      },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
