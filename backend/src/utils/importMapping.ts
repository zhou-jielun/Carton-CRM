const stageMap: Record<string, string> = {
  '潜在客户': 'lead',
  '已触达': 'contacted',
  '跟进中': 'following',
  '已报价': 'quoted',
  '已成交': 'won',
  '休眠': 'dormant',
};

const reverseStageMap: Record<string, string> = {
  lead: '潜在客户',
  contacted: '已触达',
  following: '跟进中',
  quoted: '已报价',
  won: '已成交',
  dormant: '休眠',
};

const priorityScore: Record<string, number> = { A: 90, B: 60, C: 30 };

export interface BackupCustomer {
  name?: string;
  country?: string;
  mainProduct?: string;
  contactPerson?: string;
  email?: string;
  whatsapp?: string;
  website?: string;
  source?: string;
  companySize?: string;
  techContact?: string;
  firstContactDate?: string;
  foundedDate?: string;
  currentCapacity?: string;
  currentEquipment?: string;
  mainIndustries?: string;
  corePainPoints?: string;
  targetEquipment?: string[];
  equipmentSpecs?: string;
  budget?: string;
  expectedPurchaseTime?: string;
  needsFactoryInspection?: boolean;
  stage?: string;
  priority?: string;
  nextFollowUp?: string;
  tags?: string[];
  interactions?: Array<{
    type?: string;
    direction?: string;
    content?: string;
    sentAt?: string;
  }>;
  [key: string]: unknown;
}

const additionalFields = [
  'techContact', 'foundedDate', 'targetEquipment', 'equipmentSpecs',
  'needsFactoryInspection', 'mainProduct', 'companySize',
];

const interactionFields = [
  'firstContactDate', 'currentCapacity', 'currentEquipment',
  'corePainPoints', 'mainIndustries', 'budget', 'expectedPurchaseTime',
  'nextFollowUp', 'contactPerson',
];

export function backupToPrisma(record: BackupCustomer) {
  const notes: Record<string, unknown> = {};
  for (const field of additionalFields) {
    if (record[field] !== undefined && record[field] !== '' &&
        !(Array.isArray(record[field]) && (record[field] as unknown[]).length === 0)) {
      notes[field] = record[field];
    }
  }
  if (record.mainIndustries) notes.mainIndustries = record.mainIndustries;
  if (record.equipmentSpecs) notes.equipmentSpecs = record.equipmentSpecs;

  const stageEn = record.stage ? (stageMap[record.stage] || 'lead') : 'lead';

  const extraNotes: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (!['name', 'country', 'website', 'source', 'stage', 'priority',
          'tags', 'email', 'whatsapp', 'interactions',
          ...additionalFields, ...interactionFields].includes(k)) {
      if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
        extraNotes[k] = v;
      }
    }
  }
  if (Object.keys(extraNotes).length > 0) {
    notes._extra = extraNotes;
  }

  return {
    company: record.name || '',
    website: record.website || '',
    industry: record.mainIndustries || '',
    country: record.country || '',
    size: record.companySize || '',
    score: record.priority ? (priorityScore[record.priority.toUpperCase()] ?? 0) : 0,
    status: stageEn,
    customerType: (record.customerType as string) || null,
    tags: record.tags || [],
    source: record.source || 'manual_import',
    notes: Object.keys(notes).length > 0 ? JSON.stringify(notes) : null,
    contacts: record.contactPerson || record.email || record.whatsapp
      ? {
          create: {
            name: record.contactPerson || '',
            email: record.email || '',
            whatsapp: record.whatsapp || '',
            isPrimary: true,
          },
        }
      : undefined,
  };
}

export function prismaToBackup(customer: {
  company: string | null;
  website: string | null;
  industry: string | null;
  country: string | null;
  size: string | null;
  score: number;
  status: string;
  customerType: string | null;
  tags: string[];
  source: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  contacts?: Array<{ name: string | null; email: string | null; whatsapp: string | null }>;
  interactions?: Array<{ type: string; direction: string; content: string | null; sentAt: Date }>;
}) {
  let notes: Record<string, unknown> = {};
  try {
    if (customer.notes) notes = JSON.parse(customer.notes);
  } catch { /* ignore */ }

  return {
    name: customer.company || '',
    mainProduct: (notes.mainProduct as string) || '',
    country: customer.country || '',
    contactPerson: (notes.contactPerson as string) || customer.contacts?.[0]?.name || '',
    email: customer.contacts?.[0]?.email || '',
    whatsapp: customer.contacts?.[0]?.whatsapp || '',
    website: customer.website || '',
    source: customer.source || '',
    companySize: (notes.companySize as string) || customer.size || '',
    firstContactDate: (notes.firstContactDate as string) || '',
    foundedDate: (notes.foundedDate as string) || '',
    currentCapacity: (notes.currentCapacity as string) || '',
    currentEquipment: (notes.currentEquipment as string) || '',
    mainIndustries: customer.industry || (notes.mainIndustries as string) || '',
    corePainPoints: (notes.corePainPoints as string) || '',
    targetEquipment: (notes.targetEquipment as string[]) || [],
    equipmentSpecs: (notes.equipmentSpecs as string) || '',
    budget: (notes.budget as string) || '',
    expectedPurchaseTime: (notes.expectedPurchaseTime as string) || '',
    needsFactoryInspection: (notes.needsFactoryInspection as boolean) || false,
    stage: reverseStageMap[customer.status] || customer.status,
    priority: customer.score >= 80 ? 'A' : customer.score >= 45 ? 'B' : 'C',
    customerType: customer.customerType || '',
    nextFollowUp: (notes.nextFollowUp as string) || '',
    tags: customer.tags || [],
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    interactions: (customer.interactions || []).map((i) => ({
      type: i.type,
      direction: i.direction,
      content: i.content || '',
      sentAt: i.sentAt.toISOString(),
    })),
  };
}
