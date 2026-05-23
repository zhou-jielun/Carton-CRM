import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { backupToPrisma, prismaToBackup, BackupCustomer } from '../utils/importMapping';

const router = Router();

// List customers
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, status, source, scoreMin, scoreMax, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.userId! };
    if (search) {
      where.OR = [
        { company: { contains: search as string, mode: 'insensitive' } },
        { industry: { contains: search as string, mode: 'insensitive' } },
        { country: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (source) where.source = source;
    if (scoreMin) where.score = { ...where.score, gte: parseInt(scoreMin as string) };
    if (scoreMax) where.score = { ...where.score, lte: parseInt(scoreMax as string) };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { contacts: true, interactions: { take: 3, orderBy: { sentAt: 'desc' } } },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ success: true, data: customers, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
});

// ── Export customers (must be before /:id) ──
router.get('/export', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as string) || 'json';
    const customers = await prisma.customer.findMany({
      where: { userId: req.userId! },
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        interactions: { orderBy: { sentAt: 'asc' }, take: 100 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const backupData = {
      exportedAt: new Date().toISOString(),
      total: customers.length,
      customers: customers.map(prismaToBackup),
    };

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(backupData.customers as Record<string, unknown>[]);
      ws['!cols'] = [
        { wch: 40 }, { wch: 10 }, { wch: 30 }, { wch: 15 },
        { wch: 30 }, { wch: 18 }, { wch: 30 }, { wch: 10 },
        { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 40 },
        { wch: 40 }, { wch: 30 }, { wch: 40 }, { wch: 40 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 8 },
        { wch: 14 }, { wch: 20 }, { wch: 24 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="carton-crm-export-${new Date().toISOString().slice(0, 10)}.xlsx"`);
      res.send(buf);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="carton-crm-export-${new Date().toISOString().slice(0, 10)}.json"`);
      res.json(backupData);
    }
  } catch (err) {
    next(err);
  }
});

// Get all customer IDs for navigation
router.get('/ids', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { userId: req.userId! },
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, ids: customers.map((c) => c.id), total: customers.length });
  } catch (err) {
    next(err);
  }
});

// Get single customer
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        contacts: true,
        interactions: { orderBy: { sentAt: 'desc' }, take: 50 },
        quotes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) throw new AppError('Customer not found', 404);
    res.json({ success: true, customer });
  } catch (err) {
    next(err);
  }
});

// Update customer
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    const schema = z.object({
      company: z.string().optional(),
      industry: z.string().optional(),
      country: z.string().optional(),
      size: z.string().optional(),
      status: z.enum(['lead', 'contacted', 'following', 'quoted', 'won', 'dormant']).optional(),
      score: z.number().min(0).max(100).optional(),
      customerType: z.enum(['end_user', 'distributor']).optional().nullable(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional().nullable(),
      backgroundCheck: z.string().optional().nullable(),
      nextFollowUp: z.string().optional().nullable(),
    });
    const parsed = schema.parse(req.body);

    // Convert nextFollowUp string to Date for Prisma
    const data: any = { ...parsed };
    if (parsed.nextFollowUp !== undefined) {
      data.nextFollowUp = parsed.nextFollowUp ? new Date(parsed.nextFollowUp) : null;
    }

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data,
    });

    res.json({ success: true, customer: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Delete customer
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    await prisma.customer.delete({ where: { id: customer.id } });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'customer_deleted',
        entity: 'customer',
        entityId: customer.id,
        details: { company: customer.company },
      },
    });

    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
});

// Delete all customers for current user
router.delete('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.customer.deleteMany({
      where: { userId: req.userId! },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'customers_deleted_all',
        entity: 'customer',
        details: { count: result.count },
      },
    });

    res.json({ success: true, deleted: result.count });
  } catch (err) {
    next(err);
  }
});
router.post('/:id/interactions', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    const schema = z.object({
      type: z.enum(['note', 'email', 'whatsapp', 'call']),
      direction: z.enum(['inbound', 'outbound']),
      content: z.string().min(1).max(5000),
      sentAt: z.string().optional(),
    });
    const parsed = schema.parse(req.body);

    const createData: any = {
      type: parsed.type,
      direction: parsed.direction,
      status: parsed.type === 'note' ? 'sent' : parsed.direction === 'outbound' ? 'sent' : 'delivered',
      content: parsed.content,
      customerId: customer.id,
    };
    if (parsed.sentAt) {
      createData.sentAt = new Date(parsed.sentAt);
    }

    const interaction = await prisma.interaction.create({
      data: createData,
    });

    res.json({ success: true, interaction });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Update interaction
router.put('/:id/interactions/:interactionId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    const schema = z.object({
      type: z.enum(['note', 'email', 'whatsapp', 'call']).optional(),
      direction: z.enum(['inbound', 'outbound']).optional(),
      content: z.string().min(1).max(5000).optional(),
      sentAt: z.string().optional(),
    });
    const parsed = schema.parse(req.body);

    const data: any = {};
    if (parsed.type) data.type = parsed.type;
    if (parsed.direction) data.direction = parsed.direction;
    if (parsed.content) data.content = parsed.content;
    if (parsed.sentAt) data.sentAt = new Date(parsed.sentAt);

    const interaction = await prisma.interaction.update({
      where: { id: req.params.interactionId },
      data,
    });

    res.json({ success: true, interaction });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Delete interaction
router.delete('/:id/interactions/:interactionId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    await prisma.interaction.delete({
      where: { id: req.params.interactionId },
    });

    res.json({ success: true, message: 'Interaction deleted' });
  } catch (err) {
    next(err);
  }
});

// Update customer tags
router.put('/:id/tags', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tags } = z.object({ tags: z.array(z.string()) }).parse(req.body);
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { tags },
    });

    res.json({ success: true, customer: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Multer config — in-memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.json', '.xlsx', '.xls'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('仅支持 .json / .xlsx / .xls 文件', 400));
    }
  },
});

// ── Import customers ──
router.post('/import', authenticate, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('请上传文件', 400);

    const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
    let records: BackupCustomer[] = [];

    if (ext === '.json') {
      const raw = JSON.parse(req.file.buffer.toString('utf-8'));
      records = raw.customers || (Array.isArray(raw) ? raw : [raw]);
    } else if (ext === '.xlsx' || ext === '.xls') {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      records = rows as unknown as BackupCustomer[];
    }

    if (records.length === 0) throw new AppError('文件中没有客户数据', 400);
    if (records.length > 2000) throw new AppError('单次导入最多 2000 条客户', 400);

    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      const data = backupToPrisma(record);

      // Skip if no meaningful data
      if (!data.company && !data.website && !data.industry && !data.country) {
        skipped++;
        continue;
      }

      // Deduplicate: skip if same company exists for this user
      if (data.company) {
        const existing = await prisma.customer.findFirst({
          where: { userId: req.userId!, company: data.company },
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      const created = await prisma.customer.create({
        data: {
          company: data.company,
          website: data.website,
          industry: data.industry,
          country: data.country,
          size: data.size,
          score: data.score,
          status: data.status,
          tags: data.tags,
          source: data.source,
          notes: data.notes,
          userId: req.userId!,
          contacts: data.contacts,
        },
      });

      // Build interactions from structured backup fields
      const interactionsToCreate: Array<{
        type: string; direction: string; status: string;
        content: string; sentAt: Date; customerId: string;
      }> = [];

      // 1. From explicit interactions array (if present in JSON)
      if (record.interactions && Array.isArray(record.interactions)) {
        for (const i of record.interactions) {
          if (i.content || i.type) {
            interactionsToCreate.push({
              type: i.type || 'note',
              direction: i.direction || 'inbound',
              status: 'sent',
              content: i.content || '',
              sentAt: i.sentAt ? new Date(i.sentAt) : new Date(),
              customerId: created.id,
            });
          }
        }
      }

      // 2. From firstContactDate
      if (record.firstContactDate) {
        const fcDate = record.firstContactDate;
        let contactContent = `【首次联系】日期: ${fcDate}`;
        if (record.contactPerson) contactContent += `\n联系人: ${record.contactPerson}`;
        if (record.source) contactContent += `\n来源: ${record.source}`;
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: contactContent,
          sentAt: new Date(fcDate),
          customerId: created.id,
        });
      }

      // 3. From corePainPoints
      if (record.corePainPoints) {
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: `【客户痛点】\n${record.corePainPoints}`,
          sentAt: record.nextFollowUp ? new Date(record.nextFollowUp) : new Date(),
          customerId: created.id,
        });
      }

      // 4. From currentCapacity + currentEquipment (production info)
      const prodInfo = [record.currentCapacity, record.currentEquipment].filter(Boolean).join('\n\n');
      if (prodInfo) {
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: `【产能与设备】\n${prodInfo}`,
          sentAt: new Date(),
          customerId: created.id,
        });
      }

      // 5. From mainIndustries (industry info)
      if (record.mainIndustries) {
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: `【目标行业】\n${record.mainIndustries}`,
          sentAt: new Date(),
          customerId: created.id,
        });
      }

      // 6. From budget/expectedPurchaseTime
      const purchaseInfo = [record.budget, record.expectedPurchaseTime].filter(Boolean).join(' | ');
      if (purchaseInfo) {
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: `【采购计划】\n${purchaseInfo}`,
          sentAt: new Date(),
          customerId: created.id,
        });
      }

      // Batch create all interactions (max 100 per customer)
      if (interactionsToCreate.length > 0) {
        await prisma.interaction.createMany({
          data: interactionsToCreate.slice(0, 100),
        });
      }

      imported++;
    }

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'customers_imported',
        entity: 'customer',
        details: { imported, skipped, total: records.length },
      },
    });

    res.json({ success: true, imported, skipped, total: records.length });
  } catch (err) {
    if (err instanceof SyntaxError) {
      res.status(400).json({ success: false, message: 'JSON 格式错误，请检查文件内容' });
      return;
    }
    next(err);
  }
});

export default router;
