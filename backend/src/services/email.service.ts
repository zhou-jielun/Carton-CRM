import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  campaignId?: string;
}

export class EmailService {
  private transport: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  configure(cfg: EmailConfig) {
    this.config = cfg;
    this.transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
      pool: true,
      maxConnections: 5,
      rateDelta: 3000,
      rateLimit: 20,
    });
  }

  isConfigured(): boolean {
    return !!this.transport && !!this.config;
  }

  async send(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transport || !this.config) {
      return { success: false, error: 'SMTP not configured' };
    }

    try {
      const info = await this.transport.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        headers: {
          'X-Campaign-ID': params.campaignId || '',
          'List-Unsubscribe': `<mailto:${this.config.fromEmail}?subject=unsubscribe>`,
        },
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async sendBatch(
    recipients: Array<{ email: string; variables: Record<string, string> }>,
    subject: string,
    template: string,
    options: { campaignId?: string; batchSize?: number; delayMs?: number } = {}
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const { batchSize = 20, delayMs = 3000 } = options;
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((r) => {
          const html = this.replaceVariables(template, r.variables);
          return this.send({ to: r.email, subject: this.replaceVariables(subject, r.variables), html, campaignId: options.campaignId });
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++;
        } else {
          failed++;
          errors.push(result.status === 'fulfilled' ? result.value.error! : result.reason?.message);
        }
      }

      if (i + batchSize < recipients.length && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    return { sent, failed, errors };
  }

  private replaceVariables(text: string, vars: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transport) return false;
    try {
      await this.transport.verify();
      return true;
    } catch {
      return false;
    }
  }
}

export const emailService = new EmailService();
