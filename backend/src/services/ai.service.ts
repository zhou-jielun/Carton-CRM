interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AiResponse {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export class AiService {
  private apiKey: string = '';
  private apiUrl = 'https://api.anthropic.com/v1/messages';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async callClaude(
    messages: AiMessage[],
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<AiResponse> {
    const { maxTokens = 2000, temperature = 0.7 } = options;

    const systemMsg = messages.find((m) => m.role === 'system');
    const userMsgs = messages.filter((m) => m.role !== 'system');

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey || process.env.CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: maxTokens,
        temperature,
        system: systemMsg?.content,
        messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${err}`);
    }

    const data: any = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    };
  }

  /** Generate personalized sales email based on customer info */
  async generateSalesEmail(params: {
    companyName: string;
    customerCompany: string;
    customerIndustry?: string;
    customerWebsite?: string;
    language: string;
    productInfo: string;
    tone?: string;
  }): Promise<string> {
    const { companyName, customerCompany, customerIndustry, customerWebsite, language, productInfo, tone = 'professional' } = params;

    const prompt = `You are a professional international trade business developer. Write a cold outreach sales email.

Company: ${companyName}
Target Company: ${customerCompany}
Industry: ${customerIndustry || 'General'}
Target Website: ${customerWebsite || 'N/A'}
Product/Service: ${productInfo}
Language: ${language}
Tone: ${tone}

Requirements:
1. Personalized opening referencing the target company's business
2. Clear value proposition
3. Social proof or credibility indicator
4. Specific call to action
5. Professional signature
6. Spam-compliance: avoid excessive caps, exclamation marks, or trigger words
7. Output ONLY the email body (no explanations)`;

    const result = await this.callClaude([
      { role: 'system', content: 'You are an expert international trade email copywriter.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.8, maxTokens: 1500 });

    return result.content.trim();
  }

  /** Generate WhatsApp message */
  async generateWhatsAppMessage(params: {
    companyName: string;
    contactName: string;
    customerCompany: string;
    productInfo: string;
    language: string;
  }): Promise<string> {
    const { companyName, contactName, customerCompany, productInfo, language } = params;

    const prompt = `Write a concise WhatsApp business message (max 200 words).

From: ${companyName}
To: ${contactName} at ${customerCompany}
Product: ${productInfo}
Language: ${language}

Requirements:
- Very brief and conversational
- Professional but friendly
- Single clear call-to-action
- No spammy language
- Output ONLY the message`;

    const result = await this.callClaude([
      { role: 'system', content: 'You write effective short WhatsApp business messages.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.7, maxTokens: 800 });

    return result.content.trim();
  }

  /** Score customer lead quality 0-100 */
  async scoreCustomer(params: {
    companySize?: string;
    industry?: string;
    website?: string;
    country?: string;
    importBehavior?: string;
  }): Promise<{ score: number; reasoning: string }> {
    const prompt = `Evaluate this export lead quality (0-100 score):

Company Size: ${params.companySize || 'Unknown'}
Industry: ${params.industry || 'Unknown'}
Website: ${params.website || 'Unknown'}
Country: ${params.country || 'Unknown'}
Import Behavior: ${params.importBehavior || 'Unknown'}

Return ONLY a JSON: { "score": number, "reasoning": "brief explanation" }`;

    const result = await this.callClaude([
      { role: 'system', content: 'You evaluate international trade lead quality.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3, maxTokens: 500 });

    try {
      return JSON.parse(result.content);
    } catch {
      return { score: 50, reasoning: 'AI evaluation unavailable' };
    }
  }

  /** Generate follow-up email sequence (up to 5 follow-ups) */
  async generateFollowUpSequence(params: {
    originalEmail: string;
    customerCompany: string;
    productInfo: string;
    language: string;
    followUpNumber: number;
  }): Promise<string> {
    const prompt = `Write follow-up email #${params.followUpNumber} for a sales sequence.

Original email: "${params.originalEmail.substring(0, 200)}"
Target Company: ${params.customerCompany}
Product: ${params.productInfo}
Language: ${params.language}
Follow-up number: ${params.followUpNumber}/5

Requirements:
- ${params.followUpNumber === 1 ? 'Gentle reminder, add new value point' : ''}
- ${params.followUpNumber === 2 ? 'Share a relevant case study or statistic' : ''}
- ${params.followUpNumber === 3 ? 'Offer a specific incentive or discount' : ''}
- ${params.followUpNumber === 4 ? 'Create urgency, mention limited capacity' : ''}
- ${params.followUpNumber === 5 ? 'Final attempt, leave door open for future contact' : ''}
- Maintain professional tone
- Output ONLY the email body`;

    const result = await this.callClaude([
      { role: 'system', content: 'You write strategic sales follow-up emails.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.8, maxTokens: 1200 });

    return result.content.trim();
  }

  /** Analyze customs data to identify buyer patterns */
  async analyzeCustomsData(csvData: string): Promise<string> {
    const result = await this.callClaude([
      { role: 'system', content: 'You are a trade data analyst expert. Analyze import/export data to identify buying patterns, frequency, volume trends, and supplier relationships.' },
      { role: 'user', content: `Analyze this customs/trade data and provide actionable buyer insights:\n\n${csvData.substring(0, 5000)}` },
    ], { temperature: 0.3, maxTokens: 2000 });

    return result.content.trim();
  }

  /** Auto-generate weekly/monthly report */
  async generateReport(params: {
    type: 'weekly' | 'monthly';
    period: string;
    stats: Record<string, any>;
    language: string;
  }): Promise<string> {
    const prompt = `Generate a ${params.type} acquisition report for ${params.period}.

Stats: ${JSON.stringify(params.stats, null, 2)}
Language: ${params.language}

Include:
1. Executive summary
2. Key metrics highlights
3. Channel performance comparison
4. Improvement suggestions
5. Next week/month action plan

Output in clean markdown format.`;

    const result = await this.callClaude([
      { role: 'system', content: 'You generate professional business intelligence reports.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.5, maxTokens: 2500 });

    return result.content.trim();
  }
}

export const aiService = new AiService();
