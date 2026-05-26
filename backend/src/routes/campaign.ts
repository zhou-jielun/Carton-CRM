import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { aiService } from '../services/ai.service';
import { emailService } from '../services/email.service';
import { whatsappService } from '../services/whatsapp.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Create campaign
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      type: z.enum(['outreach', 'followup', 'newsletter']).default('outreach'),
      language: z.string().default('en'),
      subject: z.string().optional(),
      content: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const campaign = await prisma.emailCampaign.create({
      data: { ...data, userId: req.userId! },
    });
    res.status(201).json({ success: true, campaign });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// List campaigns
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
});

// Get single campaign
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: { interactions: { take: 20, orderBy: { sentAt: 'desc' } } },
    });
    if (!campaign) throw new AppError('Campaign not found', 404);
    res.json({ success: true, campaign });
  } catch (err) {
    next(err);
  }
});

// AI Generate email content
router.post('/generate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      customerIds: z.array(z.string()).optional(),
      language: z.string().default('en'),
      tone: z.string().optional(),
      campaignId: z.string().optional(),
    });
    const { customerIds, language, tone, campaignId } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError('User not found', 404);

    const productInfo = user.products ? JSON.stringify(user.products) : 'Our products';
    const companyName = user.companyName || 'Our Company';

    // Get customers to generate for
    const customers = customerIds?.length
      ? await prisma.customer.findMany({ where: { id: { in: customerIds }, userId: req.userId! }, include: { contacts: true } })
      : [];

    const generatedEmails: Array<{ customerId: string; subject: string; content: string }> = [];

    for (const customer of customers) {
      const content = await aiService.generateSalesEmail({
        companyName,
        customerCompany: customer.company || customer.website || 'Valued Customer',
        customerIndustry: customer.industry || undefined,
        customerWebsite: customer.website || undefined,
        language,
        productInfo,
        tone,
      });

      const subject = `Partnership opportunity with ${companyName}`;

      generatedEmails.push({ customerId: customer.id, subject, content });
    }

    // Create campaign if needed
    let campaign;
    if (campaignId) {
      campaign = await prisma.emailCampaign.findFirst({ where: { id: campaignId, userId: req.userId! } });
    }

    res.json({ success: true, data: { emails: generatedEmails, campaign } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Send email campaign
router.post('/:id/send', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!campaign) throw new AppError('Campaign not found', 404);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError('User not found', 404);

    // Configure email service
    if (!user.smtpHost || !user.smtpUser || !user.smtpPass) {
      throw new AppError('SMTP not configured. Please set up in Settings.', 400);
    }

    emailService.configure({
      host: user.smtpHost,
      port: user.smtpPort || 587,
      user: user.smtpUser,
      pass: user.smtpPass,
      fromEmail: user.smtpFromEmail || user.email,
      fromName: user.smtpFromName || user.companyName || user.name || 'Team',
    });

    // Get target customers
    const customers = await prisma.customer.findMany({
      where: { userId: req.userId! },
      include: { contacts: { where: { isPrimary: true } } },
    });

    type RecipientCustomer = { company?: string | null; contacts: { email: string | null; name: string | null; whatsapp?: string | null }[] };
    const recipients = customers
      .filter((c: RecipientCustomer) => c.contacts.length > 0)
      .map((c: RecipientCustomer) => ({
        email: c.contacts[0].email!,
        variables: {
          company: c.company || 'Customer',
          contact_name: c.contacts[0].name || 'Sir/Madam',
        },
      }));

    if (recipients.length === 0) {
      throw new AppError('No recipients found with email contacts', 400);
    }

    // Update status
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'sending' },
    });

    // Send asynchronously
    const result = await emailService.sendBatch(recipients, campaign.subject || '', campaign.content || '', {
      campaignId: campaign.id,
    });

    // Update campaign stats
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: result.failed === 0 ? 'sent' : 'sent',
        totalSent: result.sent,
      },
    });

    // Record interactions
    for (let i = 0; i < recipients.length; i++) {
      if (i < result.sent) {
        const customer = customers[i];
        if (customer) {
          await prisma.interaction.create({
            data: {
              type: 'email',
              direction: 'outbound',
              status: 'sent',
              content: campaign.content?.substring(0, 500),
              customerId: customer.id,
              campaignId: campaign.id,
            },
          });
        }
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'campaign_sent',
        entity: 'campaign',
        entityId: campaign.id,
        details: { sent: result.sent, failed: result.failed },
      },
    });

    res.json({ success: true, data: { sent: result.sent, failed: result.failed } });
  } catch (err) {
    next(err);
  }
});

// AI Generate WhatsApp message
router.post('/whatsapp/generate', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      customerId: z.string(),
      language: z.string().default('en'),
    });
    const { customerId, language } = schema.parse(req.body);

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, userId: req.userId! },
      include: { contacts: true },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw new AppError('User not found', 404);

    const contact = customer.contacts.find((c: { whatsapp?: string | null }) => c.whatsapp);
    const productInfo = user.products ? JSON.stringify(user.products) : 'Our products';

    const message = await aiService.generateWhatsAppMessage({
      companyName: user.companyName || 'Our Company',
      contactName: contact?.name || 'Valued Customer',
      customerCompany: customer.company || 'Your Company',
      productInfo,
      language,
    });

    res.json({ success: true, data: { message, customerId, contactPhone: contact?.whatsapp } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

// Send WhatsApp message
router.post('/whatsapp/send', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      customerId: z.string(),
      message: z.string().min(1),
    });
    const { customerId, message } = schema.parse(req.body);

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, userId: req.userId! },
      include: { contacts: true },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    const contact = customer.contacts.find((c: { whatsapp?: string | null }) => c.whatsapp);
    if (!contact?.whatsapp) throw new AppError('No WhatsApp number found for this customer', 400);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user?.whatsappApiKey || !user?.whatsappApiUrl) throw new AppError('WhatsApp API not configured', 400);

    whatsappService.configure({ apiKey: user.whatsappApiKey, apiUrl: user.whatsappApiUrl });
    const result = await whatsappService.sendMessage({ to: contact.whatsapp, message });

    // Record interaction
    await prisma.interaction.create({
      data: {
        type: 'whatsapp',
        direction: 'outbound',
        status: result.success ? 'sent' : 'failed',
        content: message.substring(0, 500),
        customerId: customer.id,
      },
    });

    res.json({ success: result.success, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, message: err.errors[0].message });
      return;
    }
    next(err);
  }
});

export default router;
