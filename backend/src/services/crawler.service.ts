import * as cheerio from 'cheerio';

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface ContactInfo {
  emails: string[];
  phones: string[];
  whatsapp: string | null;
  linkedin: string | null;
  facebook: string | null;
  socialLinks: string[];
}

interface CompanyProfile {
  name: string;
  website: string;
  description: string;
  industry?: string;
  country?: string;
  contacts: ContactInfo;
}

export class CrawlerService {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private requestDelay = 2000; // ms between requests
  private lastRequestTime = 0;

  private async delay() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.requestDelay) {
      await new Promise((r) => setTimeout(r, this.requestDelay - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private async fetch(url: string): Promise<string | null> {
    await this.delay();
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }

  /** Search Google for companies matching keywords */
  async googleSearch(query: string, maxResults: number = 20): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.google.com/search?q=${encodedQuery}&num=${Math.min(maxResults, 20)}`;

    const html = await this.fetch(searchUrl);
    if (!html) return results;

    const $ = cheerio.load(html);

    $('div.g').each((_, el) => {
      const titleEl = $(el).find('h3').first();
      const linkEl = $(el).find('a').first();
      const descEl = $(el).find('div[data-sncf], span.aCOpRe, div.VwiC3b').first();

      const title = titleEl.text().trim();
      const url = linkEl.attr('href') || '';
      const description = descEl.text().trim();

      if (title && url) {
        const cleanUrl = url.startsWith('/url?q=') ? decodeURIComponent(url.replace('/url?q=', '').split('&')[0]) : url;
        results.push({ title, url: cleanUrl, description });
      }
    });

    return results;
  }

  /** Extract contact information from a company website */
  async extractContacts(website: string): Promise<ContactInfo> {
    const info: ContactInfo = {
      emails: [],
      phones: [],
      whatsapp: null,
      linkedin: null,
      facebook: null,
      socialLinks: [],
    };

    const html = await this.fetch(website);
    if (!html) return info;

    const $ = cheerio.load(html);
    const text = $('body').text();

    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails) {
      info.emails = [...new Set(emails)].filter((e) => !e.includes('example.com') && !e.includes('domain.com'));
    }

    // Extract phone numbers (international format)
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const phones = text.match(phoneRegex);
    if (phones) {
      info.phones = [...new Set(phones)].filter((p) => p.replace(/[^\d]/g, '').length >= 7);
    }

    // Extract WhatsApp numbers
    const waRegex = /(?:\+?\d{1,3}[-.\s]?)?\d{9,15}/g;
    $('a[href*="whatsapp"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/phone=(\d+)/);
      if (match) info.whatsapp = match[1];
    });

    // Extract social links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('linkedin.com/company/')) info.linkedin = href.split('?')[0];
      if (href.includes('facebook.com/')) info.facebook = href.split('?')[0];
      if (href.includes('linkedin') || href.includes('facebook') || href.includes('twitter') || href.includes('instagram')) {
        info.socialLinks.push(href.split('?')[0]);
      }
    });

    return info;
  }

  /** Full company acquisition pipeline */
  async acquireCompanies(
    keywords: string[],
    options: { maxPerKeyword?: number; extractContacts?: boolean } = {}
  ): Promise<CompanyProfile[]> {
    const { maxPerKeyword = 10, extractContacts = true } = options;
    const companies: CompanyProfile[] = [];
    const seen = new Set<string>();

    for (const keyword of keywords) {
      const results = await this.googleSearch(keyword, maxPerKeyword);

      for (const result of results) {
        const domain = new URL(result.url).hostname.replace('www.', '');
        if (seen.has(domain)) continue;
        seen.add(domain);

        const profile: CompanyProfile = {
          name: result.title,
          website: result.url,
          description: result.description,
          contacts: { emails: [], phones: [], whatsapp: null, linkedin: null, facebook: null, socialLinks: [] },
        };

        if (extractContacts) {
          try {
            const contacts = await this.extractContacts(result.url);
            profile.contacts = contacts;
          } catch {
            // continue with empty contacts
          }
        }

        companies.push(profile);
      }
    }

    return companies;
  }
}

export const crawlerService = new CrawlerService();
