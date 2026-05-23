import prisma from '../utils/prisma';
import { aiService } from './ai.service';
import { emailService } from './email.service';

export class FollowUpService {
  /** Auto-follow up on customers who haven't replied */
  async autoFollowUp(userId: string): Promise<{ total: number; sent: number; failed: number }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Configure email service if SMTP is set
    if (user.smtpHost && user.smtpUser && user.smtpPass) {
      emailService.configure({
        host: user.smtpHost,
        port: user.smtpPort || 587,
        user: user.smtpUser,
        pass: user.smtpPass,
        fromEmail: user.smtpFromEmail || user.email,
        fromName: user.smtpFromName || user.companyName || user.name || 'Team',
      });
    } else {
      return { total: 0, sent: 0, failed: 0 };
    }

    // Find customers who need follow-up (have been contacted but haven't replied)
    const customersToFollowUp = await prisma.$queryRaw<Array<{
      id: string;
      company: string | null;
      email: string;
      contactName: string;
      followUpCount: number;
      lastEmailContent: string;
    }>>`
      SELECT
        c.id,
        c.company,
        ct.email,
        ct.name as "contactName",
        CAST(COALESCE(fc.count, 0) AS INTEGER) as "followUpCount",
        COALESCE((
          SELECT i2.content
          FROM interactions i2
          WHERE i2."customerId" = c.id AND i2.type = 'email' AND i2.direction = 'outbound'
          ORDER BY i2."sentAt" DESC
          LIMIT 1
        ), '') as "lastEmailContent"
      FROM customers c
      JOIN contacts ct ON ct."customerId" = c.id AND ct."isPrimary" = true AND ct.email IS NOT NULL
      LEFT JOIN (
        SELECT "customerId", COUNT(*) as count
        FROM interactions
        WHERE direction = 'outbound' AND type = 'email'
        GROUP BY "customerId"
      ) fc ON fc."customerId" = c.id
      WHERE c."userId" = ${userId}
        AND c.status IN ('contacted', 'following')
        AND NOT EXISTS (
          SELECT 1 FROM interactions i
          WHERE i."customerId" = c.id AND i.direction = 'inbound' AND i.type = 'email'
        )
        AND (fc.count IS NULL OR fc.count < 5)
      LIMIT 20
    `;

    let sent = 0;
    let failed = 0;

    const productInfo = user.products ? JSON.stringify(user.products) : 'Our products';
    const companyName = user.companyName || 'Our Company';

    for (const customer of customersToFollowUp as any[]) {
      try {
        const followUpNumber = (customer.followUpCount || 0) + 1;

        const emailContent = await aiService.generateFollowUpSequence({
          originalEmail: customer.lastEmailContent || '',
          customerCompany: customer.company || 'Valued Customer',
          productInfo,
          language: user.language || 'en',
          followUpNumber,
        });

        const result = await emailService.send({
          to: customer.email,
          subject: `Re: Partnership opportunity with ${companyName}`,
          html: emailContent,
        });

        if (result.success) {
          // Record interaction
          await prisma.interaction.create({
            data: {
              type: 'email',
              direction: 'outbound',
              status: 'sent',
              content: emailContent.substring(0, 500),
              customerId: customer.id,
            },
          });

          // Update customer status
          await prisma.customer.update({
            where: { id: customer.id },
            data: { status: 'following' },
          });

          sent++;
        } else {
          failed++;
        }

        // Delay between sends
        await new Promise((r) => setTimeout(r, 3000));
      } catch {
        failed++;
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'auto_followup',
        entity: 'campaign',
        details: { total: customersToFollowUp.length, sent, failed },
      },
    });

    return { total: customersToFollowUp.length, sent, failed };
  }

  /** Stop follow-ups for a customer (mark as dormant or won) */
  async stopFollowUp(customerId: string, userId: string): Promise<void> {
    await prisma.customer.updateMany({
      where: { id: customerId, userId },
      data: { status: 'dormant' },
    });
  }
}

export const followUpService = new FollowUpService();
