// 客户状态统一配置
// Cotton Viki & CRM 共享 10 阶段定义

export const STATUS_ORDER = [
  'lead',
  'interested',
  'contacted',
  'following',
  'quoted',
  'negotiating',
  'sampling',
  'won',
  'lost',
  'dormant',
] as const;

export type CustomerStatus = (typeof STATUS_ORDER)[number];

export const statusLabels: Record<string, string> = {
  lead: '潜在客户',
  interested: '意向明确',
  contacted: '已触达',
  following: '跟进中',
  quoted: '已报价',
  negotiating: '谈判中',
  sampling: '样品确认',
  won: '已成交',
  lost: '已流失',
  dormant: '休眠',
};

export const statusChipStyles: Record<string, { bg: string; color: string }> = {
  lead: { bg: '#F5F5F7', color: '#86868B' },
  interested: { bg: '#E8EAF6', color: '#3949AB' },
  contacted: { bg: '#E3F2FD', color: '#1976D2' },
  following: { bg: '#FFF3E0', color: '#E65100' },
  quoted: { bg: '#E8F5E9', color: '#388E3C' },
  negotiating: { bg: '#F3E5F5', color: '#7B1FA2' },
  sampling: { bg: '#E0F7FA', color: '#00838F' },
  won: { bg: '#E8F5E9', color: '#388E3C' },
  lost: { bg: '#FBE9E7', color: '#BF360C' },
  dormant: { bg: '#FBE9E7', color: '#BF360C' },
};

// 客户列表快捷筛选（按 Viki 7 阶段 + 评分展示）
export const quickFilters = [
  { key: 'all', label: '全部', grade: '', status: '' },
  { key: 'grade-a', label: 'A', grade: 'A', status: '' },
  { key: 'grade-b', label: 'B', grade: 'B', status: '' },
  { key: 'grade-c', label: 'C', grade: 'C', status: '' },
  { key: 'grade-d', label: 'D', grade: 'D', status: '' },
  { key: 'status-lead', label: '潜在客户', grade: '', status: 'lead' },
  { key: 'status-interested', label: '意向明确', grade: '', status: 'interested' },
  { key: 'status-quoted', label: '已报价', grade: '', status: 'quoted' },
  { key: 'status-negotiating', label: '谈判中', grade: '', status: 'negotiating' },
  { key: 'status-sampling', label: '样品确认', grade: '', status: 'sampling' },
  { key: 'status-won', label: '已成交', grade: '', status: 'won' },
  { key: 'status-lost', label: '已流失', grade: '', status: 'lost' },
];
