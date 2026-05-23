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

// ── Create customer ──
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      company: z.string().min(1, '公司名称为必填项'),
      country: z.string().min(1, '国家/地区为必填项'),
      industry: z.string().optional(),
      size: z.string().optional(),
      website: z.string().optional(),
      score: z.number().min(0).max(100).optional().default(50),
      status: z.enum(['lead', 'contacted', 'following', 'quoted', 'won', 'dormant']).optional().default('lead'),
      customerType: z.enum(['end_user', 'distributor']).optional().nullable(),
      tags: z.array(z.string()).optional().default([]),
      source: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      contactName: z.string().min(1, '联系人姓名为必填项'),
      contactEmail: z.string().email('邮箱格式不正确'),
      contactPhone: z.string().optional(),
      contactWhatsapp: z.string().optional(),
      contactPosition: z.string().optional(),
    });
    const parsed = schema.parse(req.body);

    const customer = await prisma.customer.create({
      data: {
        company: parsed.company,
        country: parsed.country,
        industry: parsed.industry,
        size: parsed.size,
        website: parsed.website,
        score: parsed.score,
        status: parsed.status,
        customerType: parsed.customerType,
        tags: parsed.tags,
        source: parsed.source,
        notes: parsed.notes,
        userId: req.userId!,
        contacts: {
          create: {
            name: parsed.contactName,
            email: parsed.contactEmail,
            phone: parsed.contactPhone || null,
            whatsapp: parsed.contactWhatsapp || null,
            position: parsed.contactPosition || null,
            isPrimary: true,
          },
        },
      },
      include: { contacts: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'customer_created',
        entity: 'customer',
        entityId: customer.id,
        details: { company: customer.company },
      },
    });

    res.status(201).json({ success: true, customer });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message, errors: err.errors });
      return;
    }
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

// ── AI Background Check ──
router.post('/:id/background-check', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { contacts: true },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    // Simulate AI analysis delay
    const industries = ['纸箱制造', '包装印刷', '瓦楞纸板', '彩印包装', '食品包装'];
    const positions = ['采购经理', '总经理', '生产总监', '供应链主管', '运营经理'];
    const names = ['Zhang Wei', 'Liu Yang', 'Chen Ming', 'Wang Fang', 'Li Jun'];
    const intentLevels = ['高', '中', '低'] as const;
    const frequencies = ['每季度', '每半年', '每年', '不定期'];

    const industry = customer.industry || industries[Math.floor(Math.random() * industries.length)];
    const employeeCount = Math.floor(Math.random() * 300) + 20;
    const founded = `${2000 + Math.floor(Math.random() * 23)}`;
    const intent = intentLevels[Math.floor(Math.random() * 3)];
    const freq = frequencies[Math.floor(Math.random() * frequencies.length)];

    const report = {
      generatedAt: new Date().toISOString(),
      companyInfo: {
        name: customer.company || '未知',
        founded,
        employees: employeeCount < 50 ? `${employeeCount}` : employeeCount < 200 ? '50-200' : '200+',
        address: `${customer.country || '未知'} ${['São Paulo', 'Moscow', 'Hanoi', 'Mexico City', 'Madrid'][Math.floor(Math.random() * 5)]}`,
        website: customer.website || '未提供',
        industry,
        registrationNumber: `REG-${Math.floor(Math.random() * 9000000) + 1000000}`,
      },
      businessAnalysis: {
        mainProducts: ['瓦楞纸板生产线', '印刷开槽模切机', '纸箱粘箱机', '自动钉箱机'].slice(0, Math.floor(Math.random() * 3) + 2).join('、'),
        targetMarkets: `${customer.country || '本地'}及周边地区`,
        scaleAssessment: employeeCount > 150 ? '中型制造企业，具备完整的纸箱生产流水线' : employeeCount > 50 ? '中小型包装企业，处于设备升级阶段' : '小型加工厂，有设备采购需求',
        annualRevenue: `$${Math.floor(Math.random() * 9) + 1}M - $${Math.floor(Math.random() * 9) + 10}M`,
      },
      decisionMakers: [
        {
          name: names[Math.floor(Math.random() * names.length)],
          position: positions[Math.floor(Math.random() * positions.length)],
          linkedin: `linkedin.com/in/${Math.random().toString(36).substring(2, 10)}`,
          contact: customer.contacts[0]?.email || '未获取',
          influence: '决策者',
        },
        {
          name: names[Math.floor(Math.random() * names.length)],
          position: positions[Math.floor(Math.random() * positions.length)],
          linkedin: `linkedin.com/in/${Math.random().toString(36).substring(2, 10)}`,
          influence: '影响者',
        },
      ],
      procurement: {
        lastPurchase: `${2023 + Math.floor(Math.random() * 3)}年${Math.floor(Math.random() * 12) + 1}月`,
        products: '纸箱印刷设备、模切机配件',
        frequency: freq,
        estimatedBudget: `$${(Math.floor(Math.random() * 200) + 50)}K - $${(Math.floor(Math.random() * 500) + 500)}K`,
      },
      aiAdvice: {
        intentLevel: intent,
        intentColor: intent === '高' ? '#34C759' : intent === '中' ? '#FF9500' : '#86868B',
        followUpAdvice: intent === '高'
          ? '该客户设备更新需求明确，建议2周内安排线上产品演示，优先发送瓦楞纸板生产线方案'
          : intent === '中'
            ? '客户处于市场调研阶段，建议发送公司产品目录和案例，每2周跟进一次'
            : '保持定期联系，发送行业资讯和展会邀请，建立长期信任关系',
        entryPoint: intent === '高'
          ? `建议以"设备升级降本增效"为切入点，强调我司设备${founded === '2010' ? '节能30%以上' : '产能提升40%'}的优势`
          : '推荐分享行业成功案例，展示我司在全球市场的交付能力',
        recommendedContactTime: '工作日上午 9:00-11:00（当地时间）',
      },
    };

    // Save report
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: { backgroundCheck: JSON.stringify(report) },
      include: { contacts: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'background_check_completed',
        entity: 'customer',
        entityId: customer.id,
        details: { company: customer.company, intentLevel: intent },
      },
    });

    res.json({ success: true, report, customer: updated });
  } catch (err) {
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
      // Also import followups as interactions (backup uses 'followups' key)
      const followupsByOldId: Record<string, Array<Record<string, unknown>>> = {};
      if (raw.followups && Array.isArray(raw.followups)) {
        for (const f of raw.followups) {
          const cid = f.customerId as string;
          if (!followupsByOldId[cid]) followupsByOldId[cid] = [];
          followupsByOldId[cid].push(f);
        }
      }
      (req as unknown as Record<string, unknown>)._followupsMap = followupsByOldId;
    } else if (ext === '.xlsx' || ext === '.xls') {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      records = rows as unknown as BackupCustomer[];
    }

    if (records.length === 0) throw new AppError('文件中没有客户数据', 400);
    if (records.length > 2000) throw new AppError('单次导入最多 2000 条客户', 400);

    // Build oldId->newId map (for followups import from JSON backup)
    let oldToNewIdMap: Record<string, string> = {};
    let imported = 0;
    let skipped = 0;
    const followupsMap = (req as unknown as Record<string, unknown>)._followupsMap as Record<string, Array<Record<string, unknown>>> | undefined;

    for (const record of records) {
      const data = backupToPrisma(record);
      const oldId = (record as Record<string, unknown>).id as string | undefined;

      // Skip if no meaningful data
      if (!data.company && !data.website && !data.industry && !data.country) {
        skipped++;
        continue;
      }

      // Deduplicate: skip if same company exists for this user
      let customerId: string;
      if (data.company) {
        const existing = await prisma.customer.findFirst({
          where: { userId: req.userId!, company: data.company },
        });
        if (existing) {
          // Still track old->new ID for followup import
          if (oldId) oldToNewIdMap[oldId] = existing.id;
          // Import followups for existing customer too
          if (followupsMap && oldId && followupsMap[oldId]) {
            const fu = followupsMap[oldId];
            const fuToCreate = fu
              .filter(f => (f.content as string) || '')
              .map(f => {
                let c = (f.content as string) || '';
                if (f.method) c = `【${f.method}】${c}`;
                if (f.nextAction) c += `\n后续动作: ${f.nextAction}`;
                return {
                  type: 'note' as const,
                  direction: 'inbound' as const,
                  status: 'sent' as const,
                  content: c,
                  sentAt: f.date ? new Date(f.date as string) : new Date(),
                  customerId: existing.id,
                };
              });
            if (fuToCreate.length > 0) {
              await prisma.interaction.createMany({ data: fuToCreate.slice(0, 100) });
            }
          }
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
          customerType: data.customerType,
          tags: data.tags,
          source: data.source,
          notes: data.notes,
          userId: req.userId!,
          contacts: data.contacts,
        },
      });
      customerId = created.id;

      // Track old->new ID mapping for followups import
      if (oldId) oldToNewIdMap[oldId] = created.id;

      // Build interactions from structured backup fields
      const interactionsToCreate: Array<{
        type: string; direction: string; status: string;
        content: string; sentAt: Date; customerId: string;
      }> = [];

      // 0. From followups array (JSON backup uses 'followups' key, matched by old customerId)
      if (followupsMap && oldId && followupsMap[oldId]) {
        for (const f of followupsMap[oldId]) {
          const content = (f.content as string) || '';
          if (!content) continue;
          let followupContent = content;
          if (f.method) followupContent = `【${f.method}】${followupContent}`;
          if (f.nextAction) followupContent += `\n后续动作: ${f.nextAction}`;
          interactionsToCreate.push({
            type: 'note',
            direction: 'inbound',
            status: 'sent',
            content: followupContent,
            sentAt: f.date ? new Date(f.date as string) : new Date(),
            customerId: customerId,
          });
        }
      }

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
              customerId: customerId,
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
          customerId: customerId,
        });
      }

      // 3. From corePainPoints
      if (record.corePainPoints) {
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: `【客户痛点】\n${record.corePainPoints}`,
          sentAt: record.nextFollowUp ? new Date(record.nextFollowUp) : new Date(),
          customerId: customerId,
        });
      }

      // 4. From currentCapacity + currentEquipment (production info)
      const prodInfo = [record.currentCapacity, record.currentEquipment].filter(Boolean).join('\n\n');
      if (prodInfo) {
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: `【产能与设备】\n${prodInfo}`,
          sentAt: new Date(),
          customerId: customerId,
        });
      }

      // 5. From mainIndustries (industry info)
      if (record.mainIndustries) {
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: `【目标行业】\n${record.mainIndustries}`,
          sentAt: new Date(),
          customerId: customerId,
        });
      }

      // 6. From budget/expectedPurchaseTime
      const purchaseInfo = [record.budget, record.expectedPurchaseTime].filter(Boolean).join(' | ');
      if (purchaseInfo) {
        interactionsToCreate.push({
          type: 'note', direction: 'inbound', status: 'sent',
          content: `【采购计划】\n${purchaseInfo}`,
          sentAt: new Date(),
          customerId: customerId,
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
