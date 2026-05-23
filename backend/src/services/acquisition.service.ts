import prisma from '../utils/prisma';
import { crawlerService } from './crawler.service';
import { aiService } from './ai.service';

interface AcquisitionResult {
  customersCreated: number;
  contactsFound: number;
  keywords: string[];
  errors: string[];
}

export class AcquisitionService {
  /**
   * Run a full acquisition campaign:
   * 1. Search Google for each keyword
   * 2. Extract company info and contacts
   * 3. Save to database and AI score
   */
  async runAcquisition(
    userId: string,
    keywords: string[],
    options: { maxPerKeyword?: number; extractContacts?: boolean; aiScore?: boolean } = {}
  ): Promise<AcquisitionResult> {
    const { maxPerKeyword = 10, extractContacts = true, aiScore = true } = options;
    const result: AcquisitionResult = { customersCreated: 0, contactsFound: 0, keywords, errors: [] };

    // Get user company info for AI scoring context
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Search and extract
    const companies = await crawlerService.acquireCompanies(keywords, { maxPerKeyword, extractContacts });

    // Save to database
    for (const company of companies) {
      try {
        // Determine likely country from the domain/IP
        const country = this.guessCountry(company.website, company.description);

        // Determine industry
        const industry = this.guessIndustry(company.description);

        // AI score if enabled
        let score = 0;
        if (aiScore) {
          try {
            const scoring = await aiService.scoreCustomer({
              companySize: undefined,
              industry,
              website: company.website,
              country,
            });
            score = scoring.score;
          } catch {
            score = 50;
          }
        }

        // Create customer
        const customer = await prisma.customer.create({
          data: {
            userId,
            company: company.name,
            website: company.website,
            description: company.description.substring(0, 1000),
            industry,
            country,
            score,
            status: 'lead',
            source: 'google_search',
            tags: keywords.filter((k) => company.description.toLowerCase().includes(k.toLowerCase()) || company.name.toLowerCase().includes(k.toLowerCase())),
          },
        });

        result.customersCreated++;

        // Create contacts
        const contactsToCreate: Array<{
          name?: string;
          email?: string;
          phone?: string;
          whatsapp?: string;
          linkedin?: string;
          isPrimary: boolean;
          customerId: string;
        }> = [];

        // Primary contact from extracted data
        if (company.contacts.emails.length > 0 || company.contacts.whatsapp) {
          contactsToCreate.push({
            email: company.contacts.emails[0] || undefined,
            phone: company.contacts.phones[0] || undefined,
            whatsapp: company.contacts.whatsapp || undefined,
            linkedin: company.contacts.linkedin || undefined,
            isPrimary: true,
            customerId: customer.id,
          });
          result.contactsFound++;
        }

        // Additional contacts
        for (let i = 1; i < company.contacts.emails.length; i++) {
          contactsToCreate.push({
            email: company.contacts.emails[i],
            isPrimary: false,
            customerId: customer.id,
          });
          result.contactsFound++;
        }

        if (contactsToCreate.length > 0) {
          await prisma.contact.createMany({ data: contactsToCreate });
        }

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId,
            action: 'customer_created',
            entity: 'customer',
            entityId: customer.id,
            details: { source: 'google_search', keyword: keywords[0], score },
          },
        });
      } catch (err) {
        result.errors.push(`Failed to save ${company.name}: ${(err as Error).message}`);
      }
    }

    return result;
  }

  /** Batch acquisition from keyword list (runs in background) */
  async batchAcquisition(
    userId: string,
    keywords: string[],
    taskId: string,
    options: { maxPerKeyword?: number; batchSize?: number } = {}
  ): Promise<void> {
    const { maxPerKeyword = 10, batchSize = 5 } = options;

    // Update task status
    await prisma.automationTask.update({
      where: { id: taskId },
      data: { status: 'running', lastRunAt: new Date() },
    });

    try {
      // Process keywords in batches
      for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        const result = await this.runAcquisition(userId, batch, { maxPerKeyword });

        // Log batch progress
        await prisma.taskLog.create({
          data: {
            taskId,
            status: result.errors.length > 0 ? 'success' : 'success',
            message: `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(keywords.length / batchSize)}: created ${result.customersCreated} customers`,
            metadata: JSON.parse(JSON.stringify({ batch, result })),
          },
        });
      }

      // Mark task as completed
      await prisma.automationTask.update({
        where: { id: taskId },
        data: { status: 'completed' },
      });
    } catch (err) {
      await prisma.automationTask.update({
        where: { id: taskId },
        data: { status: 'failed' },
      });
      await prisma.taskLog.create({
        data: {
          taskId,
          status: 'failed',
          message: `Acquisition failed: ${(err as Error).message}`,
        },
      });
    }
  }

  /** Import customs data CSV */
  async importCustomsData(userId: string, csvData: string): Promise<number> {
    const lines = csvData.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return 0;

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        const company = row['company'] || row['buyer'] || row['importer'] || '';
        if (!company) continue;

        await prisma.customer.create({
          data: {
            userId,
            company,
            country: row['country'] || row['origin'] || undefined,
            industry: row['product'] || row['commodity'] || undefined,
            source: 'customs_data',
            status: 'lead',
            tags: ['customs_import'],
            notes: `Imported from customs data. HS Code: ${row['hs_code'] || ''}, Frequency: ${row['frequency'] || ''}`,
          },
        });
        imported++;
      } catch {
        // skip malformed rows
      }
    }

    return imported;
  }

  private guessCountry(website: string, description: string): string | undefined {
    const text = `${website} ${description}`.toLowerCase();
    const countryMap: Record<string, string> = {
      'usa': 'US', 'united states': 'US', '.us': 'US',
      'china': 'CN', '.cn': 'CN', 'chinese': 'CN',
      'uk': 'GB', 'united kingdom': 'GB', '.uk': 'GB',
      'germany': 'DE', '.de': 'DE', 'german': 'DE',
      'japan': 'JP', '.jp': 'JP', 'japanese': 'JP',
      'vietnam': 'VN', '.vn': 'VN', 'viet nam': 'VN',
      'russia': 'RU', '.ru': 'RU', 'russian': 'RU',
      'india': 'IN', '.in': 'IN',
      'australia': 'AU', '.au': 'AU',
      'canada': 'CA', '.ca': 'CA',
      'brazil': 'BR', '.br': 'BR',
      'south korea': 'KR', '.kr': 'KR', 'korea': 'KR',
    };

    for (const [key, code] of Object.entries(countryMap)) {
      if (text.includes(key)) return code;
    }
    return undefined;
  }

  private guessIndustry(description: string): string | undefined {
    const text = description.toLowerCase();
    const industryMap: Record<string, string[]> = {
      'Manufacturing': ['manufactur', 'factory', 'production', 'plant', 'industrial'],
      'Technology': ['software', 'technology', 'tech', 'digital', 'it ', 'computer', 'electronic'],
      'Healthcare': ['pharma', 'medical', 'healthcare', 'health', 'hospital', 'clinic'],
      'Agriculture': ['agriculture', 'farm', 'food processing', 'organic', 'crop'],
      'Automotive': ['auto parts', 'automotive', 'car ', 'vehicle', 'automobile'],
      'Textile': ['textile', 'fabric', 'garment', 'apparel', 'clothing'],
      'Chemical': ['chemical', 'petrochem', 'plastic', 'polymer'],
      'Construction': ['construction', 'building material', 'architect', 'engineering'],
      'Energy': ['energy', 'solar', 'renewable', 'oil ', 'gas ', 'power'],
      'Logistics': ['logistics', 'shipping', 'freight', 'transport', 'warehouse'],
    };

    for (const [industry, keywords] of Object.entries(industryMap)) {
      if (keywords.some((k) => text.includes(k))) return industry;
    }
    return undefined;
  }
}

export const acquisitionService = new AcquisitionService();
