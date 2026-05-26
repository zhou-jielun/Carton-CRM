/**
 * DeepSeek API Service
 * Used for AI lead generation: keyword generation + search result analysis
 * DeepSeek API docs: https://platform.deepseek.com/api-docs
 */

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
}

class DeepSeekService {
  private apiUrl = 'https://api.deepseek.com/chat/completions';

  private getApiKey(): string {
    return process.env.DEEPSEEK_API_KEY || '';
  }

  private async call(
    messages: DeepSeekMessage[],
    options: { maxTokens?: number; temperature?: number; responseFormat?: 'text' | 'json_object' } = {}
  ): Promise<DeepSeekResponse> {
    const { maxTokens = 2000, temperature = 0.7, responseFormat = 'text' } = options;
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured. Please add it to backend/.env');
    }

    const body: Record<string, unknown> = {
      model: 'deepseek-chat',
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    };

    if (responseFormat === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${err}`);
    }

    const data: Record<string, unknown> = await response.json() as Record<string, unknown>;
    const choices = data.choices as Array<{ message: { content: string } }>;
    const usage = data.usage as { input_tokens: number; output_tokens: number } | undefined;

    return {
      content: choices?.[0]?.message?.content || '',
      usage: usage ? { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens } : undefined,
    };
  }

  /**
   * Step 1: Generate optimized search keywords
   * User describes their target in Chinese → AI generates search queries for Google
   */
  async generateKeywords(params: {
    targetCountry: string;
    productCategory: string;
    targetCustomerType?: string; // e.g. "终端客户" or "经销商"
    additionalNotes?: string;
  }): Promise<{
    googleSearchTerms: string[];
    googleMapsQueries: string[];
    linkedinFilters: string;
    explanation: string;
  }> {
    const { targetCountry, productCategory, targetCustomerType, additionalNotes } = params;

    const prompt = `你是国际贸易B2B客户开发专家，专精纸箱机械/包装行业。

    用户想开发的目标市场：
    - 目标国家：${targetCountry}
    - 产品类别：${productCategory}
    - 客户类型：${targetCustomerType || '不限'}
    - 补充说明：${additionalNotes || '无'}

    请生成以下内容，返回纯JSON格式（不要用markdown code block包裹）：

    {
      "googleSearchTerms": ["搜索词1", "搜索词2"...],  // 5-8个最优Google搜索词组，用目标国家的语言和英语
      "googleMapsQueries": ["地图搜索词1", "地图搜索词2"...],  // 3-5个适合Google Maps的搜索词
      "linkedinFilters": "LinkedIn高级筛选条件",  // 用该地区语言的LinkedIn搜索建议
      "explanation": "简要说明搜索策略（50字以内）"
    }

    搜索词要求：
    - 包含当地语言的关键词（如俄罗斯用俄语，西班牙用西语，土耳其用土耳其语）
    - 包含工厂/制造商/供应商等产业词
    - 避免过于泛化的词
    - Google搜索词格式如："corrugated box manufacturer Russia"
    - Google Maps词格式如："corrugated box factory Moscow"`;

    const result = await this.call(
      [
        { role: 'system', content: 'You are an expert B2B international trade lead generation specialist. Always output valid JSON.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.8, maxTokens: 2000, responseFormat: 'json_object' }
    );

    try {
      return JSON.parse(result.content);
    } catch {
      // Fallback: try to extract JSON
      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return {
        googleSearchTerms: [],
        googleMapsQueries: [],
        linkedinFilters: '',
        explanation: 'AI analysis failed, please try again.',
      };
    }
  }

  /**
   * Step 2: Analyze raw search results into structured customer data
   * User pastes search results text → AI extracts companies into structured JSON
   */
  async analyzeSearchResults(params: {
    rawText: string;
    targetCountry: string;
    productCategory: string;
  }): Promise<Array<{
    company: string;
    country: string;
    website: string;
    email: string;
    phone: string;
    description: string;
    industry: string;
    confidence: 'high' | 'medium' | 'low';
  }>> {
    const { rawText, targetCountry, productCategory } = params;

    const prompt = `你是国际贸易B2B客户开发专家，专精纸箱机械/包装行业。

    目标国家：${targetCountry}
    产品类别：${productCategory}

    下面是用户从Google/Google Maps搜索结果中复制粘贴的文本。请从中提取所有潜在客户公司信息。

    要求：
    1. 只提取真正做纸箱生产/包装/印刷的公司，过滤掉非相关公司
    2. 如果是行业展会列表、黄页目录等非具体公司条目，跳过
    3. 尽可能提取邮箱和官网
    4. 对无法确定的信息留空字符串
    5. confidence评分：有官网+邮箱=high，有官网无邮箱=medium，都不确定=low

    返回纯JSON数组（不要用markdown code block包裹）：
    [
      {
        "company": "公司名",
        "country": "${targetCountry}",
        "website": "官网URL（有则填）",
        "email": "邮箱（有则填）",
        "phone": "电话（有则填）",
        "description": "公司简介（1-2句话，描述主营业务）",
        "industry": "行业分类如 corrugated packaging / box manufacturing / printing & packaging",
        "confidence": "high或medium或low"
      }
    ]

    搜索结果文本：
    ---
    ${rawText.substring(0, 8000)}
    ---

    返回纯JSON数组，不要任何说明文字。`;

    const result = await this.call(
      [
        { role: 'system', content: 'You are an expert B2B trade data analyst. Extract structured company data from search results. Always output valid JSON array.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3, maxTokens: 4000, responseFormat: 'json_object' }
    );

    try {
      const parsed = JSON.parse(result.content);
      // Handle both array and { leads: [...] } formats
      if (Array.isArray(parsed)) return parsed;
      if (parsed.leads && Array.isArray(parsed.leads)) return parsed.leads;
      if (parsed.companies && Array.isArray(parsed.companies)) return parsed.companies;
      return [];
    } catch {
      const match = result.content.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return [];
        }
      }
      return [];
    }
  }
}

export const deepseekService = new DeepSeekService();
