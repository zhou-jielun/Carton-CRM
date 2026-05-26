import prisma from '../utils/prisma';
import { emailService } from './email.service';

export class ReminderService {
  /**
   * Send daily follow-up reminder email to a user.
   * Lists all overdue and today-follow-up customers.
   */
  async sendDailyReminder(userId: string): Promise<{ sent: boolean; customerCount: number }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Check SMTP config
    if (!user.smtpHost || !user.smtpUser || !user.smtpPass) {
      return { sent: false, customerCount: 0 };
    }

    emailService.configure({
      host: user.smtpHost,
      port: user.smtpPort || 587,
      user: user.smtpUser,
      pass: user.smtpPass,
      fromEmail: user.smtpFromEmail || user.email,
      fromName: user.smtpFromName || user.companyName || user.name || 'Carton CRM',
    });

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowDate = new Date(todayDate.getTime() + 86400000);

    // Get all customers with overdue or today follow-ups
    const customers = await prisma.customer.findMany({
      where: {
        userId,
        nextFollowUp: { lte: tomorrowDate },
        status: { notIn: ['won', 'lost', 'dormant'] },
      },
      select: {
        id: true,
        company: true,
        nextFollowUp: true,
        status: true,
        country: true,
      },
      orderBy: { nextFollowUp: 'asc' },
    });

    if (customers.length === 0) {
      return { sent: false, customerCount: 0 };
    }

    // Categorize
    const overdue = customers.filter((c) => {
      if (!c.nextFollowUp) return false;
      return new Date(c.nextFollowUp) < todayDate;
    });
    const today = customers.filter((c) => {
      if (!c.nextFollowUp) return false;
      const d = new Date(c.nextFollowUp);
      return d.toDateString() === todayDate.toDateString();
    });

    // Build email HTML
    const lines: string[] = [];
    lines.push(`<h2>📋 Carton CRM 跟进提醒</h2>`);
    lines.push(`<p>以下客户需要跟进：</p>`);

    if (overdue.length > 0) {
      lines.push(`<h3 style="color:#FF3B30;">🔴 已逾期 (${overdue.length})</h3>`);
      lines.push('<ul>');
      for (const c of overdue) {
        const dateLabel = c.nextFollowUp
          ? new Date(c.nextFollowUp).toISOString().slice(0, 10)
          : 'N/A';
        lines.push(
          `<li>${c.company || '未命名'} — ${c.country || ''} — <span style="color:#FF3B30;">${dateLabel}</span></li>`
        );
      }
      lines.push('</ul>');
    }

    if (today.length > 0) {
      lines.push(`<h3 style="color:#FF9500;">🟠 今天跟进 (${today.length})</h3>`);
      lines.push('<ul>');
      for (const c of today) {
        const dateLabel = c.nextFollowUp
          ? new Date(c.nextFollowUp).toISOString().slice(0, 10)
          : 'N/A';
        lines.push(
          `<li>${c.company || '未命名'} — ${c.country || ''} — ${dateLabel}</li>`
        );
      }
      lines.push('</ul>');
    }

    lines.push(
      `<p style="margin-top:20px;color:#86868B;">— 来自 Carton CRM 自动提醒</p>`
    );

    const html = lines.join('\n');

    const result = await emailService.send({
      to: user.email,
      subject: `📋 跟进提醒：${overdue.length} 逾期 + ${today.length} 今天`,
      html,
    });

    return { sent: result.success, customerCount: customers.length };
  }
}

export const reminderService = new ReminderService();
