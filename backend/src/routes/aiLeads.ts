import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { deepseekService } from '../services/deepseek.service';
import prisma from '../utils/prisma';

const router = Router();

/**
 * Step 1: Generate search keywords
 * POST /api/ai-leads/generate-keywords
 */
router.post('/generate-keywords', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      targetCountry: z.string().min(1, '请输入目标国家'),
      productCategory: z.string().min(1, '请输入产品类别'),
      targetCustomerType: z.string().optional(),
      additionalNotes: z.string().optional(),
    });

    const params = schema.parse(req.body);
    const result = await deepseekService.generateKeywords(params);

    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

/**
 * Step 2: Analyze search results into structured customer data
 * POST /api/ai-leads/analyze-results
 */
router.post('/analyze-results', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      rawText: z.string().min(10, '请粘贴搜索结果文本（至少10个字符）'),
      targetCountry: z.string().min(1),
      productCategory: z.string().min(1),
    });

    const params = schema.parse(req.body);
    const leads = await deepseekService.analyzeSearchResults(params);

    res.json({ success: true, data: { leads, total: leads.length } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

/**
 * Step 3: Batch import selected leads into CRM
 * POST /api/ai-leads/import
 */
router.post('/import', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      leads: z.array(z.object({
        company: z.string(),
        country: z.string().optional(),
        website: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        description: z.string().optional(),
        industry: z.string().optional(),
        source: z.string().optional(),
      })),
    });

    const { leads } = schema.parse(req.body);
    const userId = req.userId!;

    let imported = 0;
    let skipped = 0;
    const importedIds: string[] = [];

    for (const lead of leads) {
      if (!lead.company?.trim()) continue;

      // Check if company already exists for this user
      const existing = await prisma.customer.findFirst({
        where: {
          userId,
          company: lead.company.trim(),
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const customer = await prisma.customer.create({
        data: {
          userId,
          company: lead.company.trim(),
          country: lead.country || '',
          website: lead.website || null,
          industry: lead.industry || null,
          source: lead.source || 'AI获客',
          status: 'lead',
          score: 50,
        },
      });

      // If email provided, create a contact
      if (lead.email?.trim()) {
        await prisma.contact.create({
          data: {
            customerId: customer.id,
            email: lead.email.trim(),
            name: '',
            isPrimary: true,
          },
        });
      }

      // Create an interaction note with the description
      if (lead.description?.trim()) {
        await prisma.interaction.create({
          data: {
            customerId: customer.id,
            type: 'note',
            content: `[AI获客分析] ${lead.description.trim()}`,
            direction: 'inbound',
            status: 'sent',
          },
        });
      }

      imported++;
      importedIds.push(customer.id);
    }

    res.json({
      success: true,
      data: { imported, skipped, total: leads.length, importedIds },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

export default router;
