interface WhatsAppConfig {
  apiKey: string;
  apiUrl: string;
}

interface SendMessageParams {
  to: string;
  message: string;
  campaignId?: string;
}

export class WhatsAppService {
  private config: WhatsAppConfig | null = null;

  configure(cfg: WhatsAppConfig) {
    this.config = cfg;
  }

  isConfigured(): boolean {
    return !!this.config;
  }

  async sendMessage(params: SendMessageParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'WhatsApp API not configured' };
    }

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          to: params.to,
          text: params.message,
          type: 'text',
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: `WhatsApp API error: ${err}` };
      }

      const data: any = await response.json();
      return { success: true, messageId: data.id || data.messageId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async sendBatch(
    recipients: Array<{ phone: string; message: string }>,
    options: { batchSize?: number; delayMs?: number } = {}
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const { batchSize = 5, delayMs = 5000 } = options;
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((r) => this.sendMessage({ to: r.phone, message: r.message }))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++;
        } else {
          failed++;
          errors.push(result.status === 'fulfilled' ? result.value.error! : result.reason?.message);
        }
      }

      if (i + batchSize < recipients.length) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    return { sent, failed, errors };
  }
}

export const whatsappService = new WhatsAppService();
