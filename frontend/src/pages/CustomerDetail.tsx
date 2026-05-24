import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import AddCustomerModal from '@/components/AddCustomerModal';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building2,
  Hash,
  Tag as TagIcon,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
  Trash2,
  Plus,
  Clock,
  UserCheck,
  Users,
  FileText,
  X,
  SearchCheck,
  Download,
  Globe,
  TrendingUp,
  Target,
  ShoppingCart,
  Lightbulb,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { getCountryFlag } from '@/lib/countryFlags';

function scoreToGrade(score: number): { grade: string; color: string; bg: string; label: string } {
  if (score >= 80) return { grade: 'A', color: '#388E3C', bg: '#E8F5E9', label: '优质' };
  if (score >= 60) return { grade: 'B', color: '#1976D2', bg: '#E3F2FD', label: '良好' };
  if (score >= 40) return { grade: 'C', color: '#E65100', bg: '#FFF3E0', label: '一般' };
  return { grade: 'D', color: '#757575', bg: '#F5F5F5', label: '待跟进' };
}

const statusLabels: Record<string, string> = {
  lead: '线索',
  contacted: '已触达',
  following: '跟进中',
  quoted: '已报价',
  won: '已成交',
  dormant: '休眠',
};

const statusChipStyles: Record<string, { bg: string; color: string }> = {
  lead: { bg: '#F5F5F7', color: '#86868B' },
  contacted: { bg: '#E3F2FD', color: '#1976D2' },
  following: { bg: '#FFF3E0', color: '#E65100' },
  quoted: { bg: '#E8F5E9', color: '#388E3C' },
  won: { bg: '#E8F5E9', color: '#388E3C' },
  dormant: { bg: '#FBE9E7', color: '#BF360C' },
};

const sourceLabels: Record<string, string> = {
  google_search: '谷歌搜索',
  customs_data: '海关数据',
  manual_import: '手动导入',
};

const sourceOptions = [
  { value: 'google_search', label: '谷歌搜索' },
  { value: 'customs_data', label: '海关数据' },
  { value: 'manual_import', label: '手动导入' },
];

const customerTypeOptions = [
  { value: 'end_user', label: '终端用户' },
  { value: 'distributor', label: '经销商' },
];

const interactionTypeLabels: Record<string, string> = {
  note: '跟进备注',
  email: '邮件沟通',
  whatsapp: 'WhatsApp',
  call: '电话沟通',
};

interface Contact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  position?: string;
  isPrimary: boolean;
}

interface Interaction {
  id: string;
  type: string;
  content?: string;
  sentAt: string;
  direction: string;
}

interface CustomerDetail {
  id: string;
  company?: string;
  website?: string;
  industry?: string;
  country?: string;
  size?: string;
  score: number;
  status: string;
  customerType?: string | null;
  tags: string[];
  source?: string | null;
  notes?: string | null;
  nextFollowUp?: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: Contact[];
  interactions: Interaction[];
  backgroundCheck?: string | null;
}

function CircularScore({ score, grade, color }: { score: number; grade: string; color: string }) {
  const size = 60;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F2F2F7" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[17px] font-bold leading-none" style={{ color }}>
          {grade}
        </span>
      </div>
    </div>
  );
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [interactionType, setInteractionType] = useState('note');
  const [interactionDirection, setInteractionDirection] = useState('inbound');
  const [interactionContent, setInteractionContent] = useState('');
  const [interactionDate, setInteractionDate] = useState(new Date().toISOString().slice(0, 10));
  const [addingInteractionLoading, setAddingInteractionLoading] = useState(false);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [editingSource, setEditingSource] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const interactionRef = useRef<HTMLDivElement>(null);
  // Navigation
  const [customerIds, setCustomerIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  // Interaction editing
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  // Background check
  const [backgroundCheck, setBackgroundCheck] = useState('');
  const [bgCheckRunning, setBgCheckRunning] = useState(false);
  // Tabs
  const [activeTab, setActiveTab] = useState<'detail' | 'interactions' | 'background'>('detail');
  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  useEffect(() => {
    loadCustomerIds();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate when user is typing in an input/textarea/contentEditable
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'TEXTAREA' ||
                        target.tagName === 'INPUT' ||
                        target.tagName === 'SELECT' ||
                        target.isContentEditable;
      if (isEditing) return;
      // Don't navigate when Ctrl/Meta is held (e.g. Ctrl+Arrow for word jump)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'ArrowRight') navigateToNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigateToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, customerIds]);

  const loadCustomer = async () => {
    setLoading(true);
    setAddingInteraction(false);
    setEditingInteractionId(null);
    setInteractionContent('');
    setBackgroundCheck('');
    try {
      const res = await fetch(`/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomer(data.customer);
        setNextFollowUpDate(data.customer.nextFollowUp ? data.customer.nextFollowUp.slice(0, 10) : '');
        setSelectedSource(data.customer.source || '');
        setBackgroundCheck(data.customer.backgroundCheck || '');
      } else {
        setError('客户不存在');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerIds = async () => {
    try {
      const res = await fetch('/api/customers/ids', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomerIds(data.ids);
        setCurrentIndex(data.ids.indexOf(id || ''));
      }
    } catch { /* silent */ }
  };

  const navigateToPrev = () => {
    if (currentIndex > 0) {
      navigate(`/customers/${customerIds[currentIndex - 1]}`);
    }
  };

  const navigateToNext = () => {
    if (currentIndex < customerIds.length - 1) {
      navigate(`/customers/${customerIds[currentIndex + 1]}`);
    }
  };

  const updateCustomer = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => prev ? { ...prev, ...data.customer } : null);
        toast('success', '已更新');
      } else {
        toast('error', data.message || '更新失败');
      }
    } catch {
      toast('error', '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag || !customer) return;
    if (customer.tags.includes(tag)) {
      toast('info', '标签已存在');
      return;
    }
    updateCustomer({ tags: [...customer.tags, tag] });
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    if (!customer) return;
    updateCustomer({ tags: customer.tags.filter((t) => t !== tag) });
  };

  const changeStatus = (status: string) => {
    updateCustomer({ status });
  };

  const changeCustomerType = (customerType: string | null) => {
    updateCustomer({ customerType });
  };

  const changeSource = () => {
    updateCustomer({ source: selectedSource || null });
    setEditingSource(false);
  };

  const saveNextFollowUp = () => {
    const val = nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null;
    updateCustomer({ nextFollowUp: val });
  };

  const deleteCustomer = async () => {
    if (!confirm('确定要删除此客户吗？此操作不可撤销。')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        toast('success', '已删除');
        navigate('/customers');
      } else {
        toast('error', data.message || '删除失败');
      }
    } catch {
      toast('error', '删除失败');
    }
  };

  const handleBgCheck = async () => {
    if (!customer) return;
    setBgCheckRunning(true);
    setActiveTab('background');
    toast('info', 'AI正在为您生成客户背调报告...');
    try {
      const res = await fetch(`/api/customers/${customer.id}/background-check`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => prev ? { ...prev, backgroundCheck: JSON.stringify(data.report) } : null);
        setBackgroundCheck(JSON.stringify(data.report));
        toast('success', `"${customer.company}" AI背调完成`);
        if (data.report?.decisionMakers?.length) {
          toast('info', `已为您识别 ${data.report.decisionMakers.length} 位决策人信息`);
        }
      } else {
        toast('error', data.message || '背调暂时失败，请稍后重试');
      }
    } catch {
      toast('error', '背调暂时失败，请稍后重试');
    } finally {
      setBgCheckRunning(false);
    }
  };

  const parseBackgroundReport = () => {
    if (!backgroundCheck) return null;
    try {
      return JSON.parse(backgroundCheck);
    } catch {
      return null;
    }
  };

  const addInteraction = async () => {
    if (!interactionContent.trim() || !customer) return;
    setAddingInteractionLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          type: interactionType,
          direction: interactionDirection,
          content: interactionContent.trim(),
          sentAt: interactionDate ? new Date(interactionDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => prev ? { ...prev, interactions: [data.interaction, ...prev.interactions] } : null);
        setInteractionContent('');
        setAddingInteraction(false);
        toast('success', '跟进记录已添加');
        setTimeout(() => interactionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        toast('error', data.message || '添加失败');
      }
    } catch {
      toast('error', '添加失败');
    } finally {
      setAddingInteractionLoading(false);
    }
  };

  const startEditingInteraction = (interaction: Interaction) => {
    setInteractionType(interaction.type);
    setInteractionDirection(interaction.direction);
    setInteractionContent(interaction.content || '');
    setInteractionDate(new Date(interaction.sentAt).toISOString().slice(0, 10));
    setEditingInteractionId(interaction.id);
    setAddingInteraction(true);
  };

  const saveEditedInteraction = async () => {
    if (!interactionContent.trim() || !customer || !editingInteractionId) return;
    setAddingInteractionLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/interactions/${editingInteractionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          type: interactionType,
          direction: interactionDirection,
          content: interactionContent.trim(),
          sentAt: interactionDate ? new Date(interactionDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => prev ? {
          ...prev,
          interactions: prev.interactions.map((i) => i.id === editingInteractionId ? data.interaction : i),
        } : null);
        setEditingInteractionId(null);
        setInteractionContent('');
        setAddingInteraction(false);
        toast('success', '跟进记录已更新');
      } else {
        toast('error', data.message || '更新失败');
      }
    } catch {
      toast('error', '更新失败');
    } finally {
      setAddingInteractionLoading(false);
    }
  };

  const deleteInteraction = async (interactionId: string) => {
    if (!confirm('确定要删除此跟进记录吗？')) return;
    try {
      const res = await fetch(`/api/customers/${customer?.id}/interactions/${interactionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomer((prev) => prev ? {
          ...prev,
          interactions: prev.interactions.filter((i) => i.id !== interactionId),
        } : null);
        toast('success', '已删除');
      } else {
        toast('error', data.message || '删除失败');
      }
    } catch {
      toast('error', '删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-2 text-body font-medium text-apple-blue hover:opacity-80 transition-opacity px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回客户库
        </button>
        <div className="flex items-center gap-2 p-4 rounded-[10px] bg-apple-red/5 border border-apple-red/20">
          <AlertCircle className="w-4 h-4 text-apple-red" />
          <span className="text-body text-apple-red">{error || '客户不存在'}</span>
        </div>
      </div>
    );
  }

  const grade = scoreToGrade(customer.score);
  const statusChip = statusChipStyles[customer.status] || { bg: '#F5F5F7', color: '#86868B' };
  const hasFollowUpChange = nextFollowUpDate !== (customer.nextFollowUp ? customer.nextFollowUp.slice(0, 10) : '');
  const showOverdueFollowUp = customer.nextFollowUp && new Date(customer.nextFollowUp) < new Date();

  return (
    <div className="min-h-screen bg-apple-background max-w-[1600px] mx-auto w-full px-4 md:px-6 lg:px-8 xl:px-10 py-5 md:py-6 lg:py-8 space-y-5 animate-fade-in">
      {/* ── Back button ── */}
      <button
        onClick={() => navigate('/customers')}
        className="inline-flex items-center gap-1.5 text-body font-medium text-apple-blue hover:text-[#0066CC] transition-colors duration-300 px-2 py-1 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        返回客户库
      </button>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between bg-apple-card rounded-[10px] border border-apple-border/40 px-4 py-2.5 shadow-apple">
        <div className="flex items-center gap-2">
          <button
            onClick={navigateToPrev}
            disabled={currentIndex <= 0}
            className="inline-flex items-center gap-1.5 text-caption font-medium text-apple-blue disabled:text-apple-tetriary disabled:cursor-not-allowed hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            上一页
          </button>
          <span className="text-caption text-apple-secondary min-w-[60px] text-center select-none">
            {currentIndex >= 0 ? `${currentIndex + 1} / ${customerIds.length}` : '-'}
          </span>
          <button
            onClick={navigateToNext}
            disabled={currentIndex >= customerIds.length - 1}
            className="inline-flex items-center gap-1.5 text-caption font-medium text-apple-blue disabled:text-apple-tetriary disabled:cursor-not-allowed hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
          >
            下一页
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-caption text-apple-tetriary ml-2 border-l border-apple-border/40 pl-3">
            快捷键: ↑/← 上一页 · → 下一页
          </span>
        </div>
      </div>

      {/* ── Header card ── */}
      <Card>
        <CardContent className="p-4 md:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <h1
                className="text-[24px] font-semibold text-apple-black truncate"
              >
                {customer.company || 'Unknown Company'}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 text-[12px] font-medium leading-none rounded-[4px]"
                  style={{ backgroundColor: statusChip.bg, color: statusChip.color }}
                >
                  {statusLabels[customer.status] || customer.status}
                </span>
                {customer.customerType && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-[12px] font-medium leading-none rounded-[4px]"
                    style={{
                      backgroundColor: customer.customerType === 'end_user' ? '#E8F5E9' : '#E3F2FD',
                      color: customer.customerType === 'end_user' ? '#388E3C' : '#1976D2',
                    }}
                  >
                    {customer.customerType === 'end_user' ? '终端用户' : '经销商'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5 text-caption text-apple-secondary">
                {customer.country && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm leading-none">{getCountryFlag(customer.country)}</span>
                    {customer.country}
                  </span>
                )}
                {customer.industry && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {customer.industry}
                  </span>
                )}
                {customer.size && (
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    {customer.size}
                  </span>
                )}
                {customer.website && (
                  <a
                    href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-apple-blue hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {customer.website}
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {timeAgo(customer.createdAt)} 创建
                </span>
              </div>
            </div>

            {/* Quick actions + Delete */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 flex-wrap justify-end">
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="inline-flex items-center gap-2 text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  onClick={handleBgCheck}
                  disabled={bgCheckRunning}
                  className="inline-flex items-center gap-2 text-caption font-medium text-white bg-apple-blue hover:bg-[#0066CC] disabled:opacity-50 px-3 py-1.5 rounded-[8px] transition-all duration-300 shadow-sm"
                >
                  {bgCheckRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <SearchCheck className="w-3.5 h-3.5" />
                  )}
                  AI背调
                </button>
                <div className="w-px h-5 bg-apple-border mx-1" />
                <button
                  onClick={() => {
                    const email = customer.contacts[0]?.email;
                    if (email) window.location.href = `mailto:${email}`;
                    else toast('info', '暂无联系人邮箱');
                  }}
                  className="inline-flex items-center gap-2 text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
                >
                  <Mail className="w-3.5 h-3.5" />
                  发邮件
                </button>
                <button
                  onClick={() => {
                    const wa = customer.contacts[0]?.whatsapp;
                    if (wa) navigate(`/whatsapp?customerId=${customer.id}`);
                    else toast('info', '暂无WhatsApp号码');
                  }}
                  className="inline-flex items-center gap-2 text-caption font-medium text-apple-green hover:bg-[#E8F5E9] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => {
                    setAddingInteraction(true);
                    setActiveTab('interactions');
                    setTimeout(() => interactionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                  }}
                  className="inline-flex items-center gap-2 text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加跟进
                </button>
              </div>
              <button
                onClick={deleteCustomer}
                className="inline-flex items-center gap-2 text-caption font-medium px-2.5 py-1.5 rounded-[6px] text-apple-red transition-colors duration-300"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFEEEE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除客户
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-1 p-1 rounded-[12px] bg-apple-surface">
        <button
          onClick={() => setActiveTab('detail')}
          className={`px-4 py-2 rounded-[10px] text-body font-medium transition-all duration-300 ${
            activeTab === 'detail'
              ? 'bg-white text-apple-black shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
              : 'text-apple-secondary hover:text-apple-black'
          }`}
        >
          客户详情
        </button>
        <button
          onClick={() => setActiveTab('interactions')}
          className={`px-4 py-2 rounded-[10px] text-body font-medium transition-all duration-300 ${
            activeTab === 'interactions'
              ? 'bg-white text-apple-black shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
              : 'text-apple-secondary hover:text-apple-black'
          }`}
        >
          跟进记录
          {customer.interactions.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-medium bg-[#E8E8ED] text-apple-secondary">
              {customer.interactions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('background')}
          className={`px-4 py-2 rounded-[10px] text-body font-medium transition-all duration-300 flex items-center gap-1.5 ${
            activeTab === 'background'
              ? 'bg-white text-apple-black shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
              : 'text-apple-secondary hover:text-apple-black'
          }`}
        >
          AI背调
          {bgCheckRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-apple-blue" />
          ) : backgroundCheck ? (
            <span className="w-2 h-2 rounded-full bg-apple-green" />
          ) : null}
        </button>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ── Tab: 客户详情 ── */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'detail' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 lg:gap-6 xl:gap-8">
          {/* ── Left column ── */}
          <div className="lg:col-span-8 space-y-4 md:space-y-5 lg:space-y-6 flex flex-col">
            {/* Status segmented control */}
            <Card>
              <CardHeader>
                <h2 className="text-subheading font-medium text-apple-black">客户阶段</h2>
              </CardHeader>
              <CardContent>
                <div
                  className="flex flex-wrap gap-1 p-1 rounded-[10px] bg-apple-surface"
                >
                  {Object.entries(statusLabels).map(([key, label]) => {
                    const isSelected = customer.status === key;
                    return (
                      <button
                        key={key}
                        onClick={() => changeStatus(key)}
                        disabled={saving}
                        className={`px-3 py-1.5 rounded-[8px] text-caption font-medium transition-all duration-300 ${
                          isSelected
                            ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                            : 'hover:text-[#1D1D1F]'
                        }`}
                        style={{
                          color: isSelected ? '#1D1D1F' : '#86868B',
                          fontWeight: 500,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-apple-border/30 pt-4 mt-4">
                  <h3 className="text-caption font-medium text-apple-secondary mb-2">客户类型</h3>
                  <div className="flex gap-2 flex-wrap">
                    {customerTypeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => changeCustomerType(opt.value)}
                        disabled={saving}
                        className={`px-4 py-1.5 rounded-full text-caption font-medium transition-all duration-300 flex items-center gap-1.5 ${
                          customer.customerType === opt.value
                            ? 'bg-apple-blue text-white shadow-sm'
                            : 'bg-[#F5F5F7] text-apple-secondary hover:bg-[#E8E8ED]'
                        }`}
                      >
                        {opt.value === 'end_user' ? <UserCheck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                        {opt.label}
                      </button>
                    ))}
                    {customer.customerType && (
                      <button
                        onClick={() => changeCustomerType(null)}
                        className="px-3 py-1.5 rounded-full text-caption text-apple-secondary hover:bg-[#F5F5F7] transition-all duration-300"
                      >
                        清除
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
              <CardHeader>
                <h2 className="text-subheading font-medium text-apple-black">联系人</h2>
              </CardHeader>
              <CardContent>
                {customer.contacts.length === 0 ? (
                  <p className="text-caption text-apple-secondary">暂无联系人</p>
                ) : (
                  <div className="space-y-3">
                    {customer.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-4 p-3 rounded-[10px] bg-[#F5F5F7]">
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[16px] font-semibold"
                          style={{ backgroundColor: '#E3F2FD', color: '#1976D2' }}
                        >
                          {(contact.name || '?')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-body font-medium text-apple-black">
                              {contact.name || '未知'}
                            </span>
                            {contact.isPrimary && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue">
                                主要
                              </span>
                            )}
                          </div>
                          {(contact.position || contact.email || contact.phone || contact.whatsapp) && (
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap text-caption text-apple-secondary">
                              {contact.position && <span>{contact.position}</span>}
                              {contact.email && (
                                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-apple-blue hover:underline">
                                  <Mail className="w-3 h-3" />{contact.email}
                                </a>
                              )}
                              {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-apple-blue hover:underline">
                                  <Phone className="w-3 h-3" />{contact.phone}
                                </a>
                              )}
                              {contact.whatsapp && (
                                <span className="flex items-center gap-1" style={{ color: '#34C759' }}>
                                  <MessageSquare className="w-3 h-3" />{contact.whatsapp}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interactions (compact in detail tab) */}
            <Card className="rounded-[12px] flex-1 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-subheading font-medium text-apple-black">最近跟进</h2>
                  <button
                    onClick={() => setActiveTab('interactions')}
                    className="text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
                  >
                    查看全部
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {customer.interactions.length === 0 && !customer.notes ? (
                  <div className="text-center py-8">
                    <p className="text-caption text-apple-secondary mb-3">暂无跟进记录</p>
                    <button
                      onClick={() => { setAddingInteraction(true); setActiveTab('interactions'); }}
                      className="inline-flex items-center gap-1.5 text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-3 py-1.5 rounded-[6px] transition-colors duration-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      添加第一条跟进
                    </button>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#E5E5EA' }}>
                    {/* show max 5 recent interactions */}
                    {customer.interactions.slice(0, 5).map((interaction, idx) => (
                      <div
                        key={interaction.id}
                        className={`${idx === 0 ? 'pb-3' : 'py-3'} ${idx === Math.min(customer.interactions.length, 5) - 1 ? 'pb-0' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: interaction.direction === 'outbound' ? '#E3F2FD' : '#F5F5F7',
                              color: interaction.direction === 'outbound' ? '#1976D2' : '#86868B',
                            }}
                          >
                            {interaction.direction === 'outbound' ? '我方发出' : '客户反馈'}
                          </span>
                          <span className="text-caption font-medium text-apple-black">
                            {interactionTypeLabels[interaction.type] || interaction.type}
                          </span>
                          <span className="text-caption text-apple-secondary ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(interaction.sentAt)}
                          </span>
                        </div>
                        {interaction.content && (
                          <p className="text-body mt-1 whitespace-pre-wrap leading-relaxed text-apple-black line-clamp-2">
                            {interaction.content}
                          </p>
                        )}
                      </div>
                    ))}
                    {customer.interactions.length > 5 && (
                      <div className="pt-3 text-center">
                        <button
                          onClick={() => setActiveTab('interactions')}
                          className="text-caption font-medium text-apple-blue hover:underline"
                        >
                          查看全部 {customer.interactions.length} 条跟进
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-4 md:space-y-5 lg:space-y-6">
            {/* Details card */}
            <Card>
              <CardHeader>
                <h2 className="text-subheading font-medium text-apple-black">客户详情</h2>
              </CardHeader>
              <CardContent className="space-y-0">
                {/* Score — visual centerpiece */}
                <div className="flex flex-col items-center py-4 border-b border-apple-border">
                  <CircularScore score={customer.score} grade={grade.grade} color={grade.color} />
                  <span className="text-caption mt-1.5 font-medium" style={{ color: grade.color }}>
                    {grade.label}
                  </span>
                </div>

                {/* Source */}
                <div className="flex items-center justify-between py-3 border-b border-apple-border">
                  <span className="text-body text-apple-secondary">来源</span>
                  <div className="flex items-center gap-2">
                    {editingSource ? (
                      <>
                        <select
                          value={selectedSource}
                          onChange={(e) => setSelectedSource(e.target.value)}
                          className="h-8 px-2 rounded-[8px] border border-apple-border/50 bg-white text-caption text-apple-black focus:outline-none focus:border-apple-blue"
                        >
                          <option value="">选择来源</option>
                          {sourceOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <button onClick={changeSource} className="text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-2 py-1 rounded-[4px]">保存</button>
                        <button onClick={() => { setEditingSource(false); setSelectedSource(customer.source || ''); }} className="text-caption text-apple-secondary hover:bg-[#F5F5F7] px-2 py-1 rounded-[4px]">取消</button>
                      </>
                    ) : (
                      <>
                        <span className="text-body font-medium text-apple-black">
                          {sourceLabels[customer.source || ''] || customer.source || '未设置'}
                        </span>
                        <button onClick={() => setEditingSource(true)} className="text-apple-secondary hover:text-apple-black transition-colors duration-300 p-1">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Next follow-up */}
                <div className="flex items-center justify-between py-3 border-b border-apple-border">
                  <span className="text-body text-apple-secondary">下次跟进</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-apple-secondary" />
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className="h-8 px-2 rounded-[8px] border border-apple-border/50 bg-white text-caption text-apple-black focus:outline-none focus:border-apple-blue transition-colors duration-300"
                      style={{ width: '140px' }}
                    />
                  </div>
                </div>
                {showOverdueFollowUp && (
                  <div className="flex items-center gap-1.5 pt-2 pb-1 text-caption text-apple-red">
                    <Clock className="w-3 h-3" />
                    计划跟进：{formatDate(customer.nextFollowUp)} (已逾期)
                  </div>
                )}
                {!showOverdueFollowUp && customer.nextFollowUp && (
                  <div className="flex items-center gap-1.5 pt-2 pb-1 text-caption text-apple-blue">
                    <Clock className="w-3 h-3" />
                    计划跟进：{formatDate(customer.nextFollowUp)}
                  </div>
                )}
                {hasFollowUpChange && (
                  <div className="pt-2 pb-1">
                    <Button variant="primary" size="sm" onClick={saveNextFollowUp} disabled={saving} className="w-full text-caption h-8">
                      保存日期
                    </Button>
                  </div>
                )}

                {/* Tags */}
                <div className="py-3 border-b border-apple-border">
                  <span className="text-body text-apple-secondary block mb-2">标签</span>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {customer.tags.length === 0 ? (
                      <p className="text-caption text-apple-secondary">暂无标签</p>
                    ) : (
                      customer.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption transition-colors duration-300"
                          style={{ backgroundColor: '#F5F5F7', color: '#86868B' }}
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-apple-red transition-colors duration-300 leading-none">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="添加标签..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      className="text-caption h-8"
                    />
                    <Button variant="secondary" size="sm" onClick={addTag} className="shrink-0">
                      <TagIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* AI背调 shortcut */}
                <div className="py-3">
                  <button
                    onClick={() => setActiveTab('background')}
                    className="w-full flex items-center gap-3 p-3 rounded-[10px] bg-[#F5F5F7] hover:bg-[#EBEBF0] transition-colors duration-300 group"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: backgroundCheck ? '#E8F5E9' : '#E3F2FD' }}
                    >
                      {backgroundCheck ? (
                        <SearchCheck className="w-4 h-4 text-apple-green" />
                      ) : (
                        <SearchCheck className="w-4 h-4 text-apple-blue" />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-body font-medium text-apple-black">
                        {backgroundCheck ? 'AI背调报告已完成' : 'AI客户背调'}
                      </p>
                      <p className="text-caption text-apple-secondary mt-0.5">
                        {backgroundCheck ? '点击查看完整报告' : '一键分析客户采购潜力'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-apple-tetriary group-hover:text-apple-black transition-colors duration-300" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ── Tab: 跟进记录 ── */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'interactions' && (
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-5 lg:space-y-6">
          <Card ref={interactionRef} className="rounded-[12px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-subheading font-medium text-apple-black">
                  跟进记录
                  {customer.interactions.length > 0 && (
                    <span className="ml-2 text-caption font-normal text-apple-secondary">
                      ({customer.interactions.length})
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setAddingInteraction(!addingInteraction)}
                  className="inline-flex items-center gap-2 text-body font-medium text-apple-blue hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {addingInteraction ? '收起' : '添加跟进'}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Add follow-up form */}
              {addingInteraction && (
                <div className="mb-6 p-4 rounded-[12px] bg-white border border-apple-border/30 space-y-3 shadow-sm">
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={interactionType}
                      onChange={(e) => setInteractionType(e.target.value)}
                      className="h-9 px-3 rounded-[8px] border border-apple-border/50 bg-white text-body text-apple-black focus:outline-none focus:border-apple-blue transition-colors duration-300"
                    >
                      <option value="note">跟进备注</option>
                      <option value="email">邮件沟通</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="call">电话沟通</option>
                    </select>
                    <select
                      value={interactionDirection}
                      onChange={(e) => setInteractionDirection(e.target.value)}
                      className="h-9 px-3 rounded-[8px] border border-apple-border/50 bg-white text-body text-apple-black focus:outline-none focus:border-apple-blue transition-colors duration-300"
                    >
                      <option value="inbound">收到</option>
                      <option value="outbound">发出</option>
                    </select>
                    <input
                      type="date"
                      value={interactionDate}
                      onChange={(e) => setInteractionDate(e.target.value)}
                      className="h-9 px-3 rounded-[8px] border border-apple-border/50 bg-white text-body text-apple-black focus:outline-none focus:border-apple-blue transition-colors duration-300"
                    />
                  </div>
                  <textarea
                    className="w-full h-28 px-3 py-2.5 rounded-[8px] border border-apple-border/50 bg-white text-body text-apple-black resize-none focus:outline-none focus:border-apple-blue transition-colors duration-300"
                    value={interactionContent}
                    onChange={(e) => setInteractionContent(e.target.value)}
                    placeholder="记录跟进内容..."
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={editingInteractionId ? saveEditedInteraction : addInteraction} disabled={addingInteractionLoading || !interactionContent.trim()}>
                      {addingInteractionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      {editingInteractionId ? '保存修改' : '保存跟进'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setAddingInteraction(false); setInteractionContent(''); setEditingInteractionId(null); }}>
                      取消
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing notes fallback */}
              {customer.notes && customer.interactions.length === 0 && (
                <div className="mb-4 p-4 rounded-[12px] bg-white border border-apple-border/20 border-l-4" style={{ borderLeftColor: '#007AFF' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F5F5F7] text-apple-secondary">历史备注</span>
                    <span className="text-caption text-apple-secondary ml-auto">{timeAgo(customer.updatedAt)}</span>
                  </div>
                  <p className="text-body text-apple-secondary whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
                </div>
              )}

              {/* Interaction list */}
              {customer.interactions.length === 0 && !customer.notes ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F5F5F7] flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-apple-tetriary" />
                  </div>
                  <p className="text-body text-apple-secondary mb-4">暂无跟进记录</p>
                  <button
                    onClick={() => setAddingInteraction(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-body font-medium text-white bg-apple-blue hover:bg-[#0066CC] rounded-[10px] transition-all duration-300 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加第一条跟进
                  </button>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#E5E5EA' }}>
                  {customer.interactions.map((interaction, idx) => (
                    <div
                      key={interaction.id}
                      className={`${idx === 0 ? 'pb-4' : 'py-4'} ${idx === customer.interactions.length - 1 ? 'pb-0' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: interaction.direction === 'outbound' ? '#E3F2FD' : '#F5F5F7',
                            color: interaction.direction === 'outbound' ? '#1976D2' : '#86868B',
                          }}
                        >
                          {interaction.direction === 'outbound' ? '我方发出' : '客户反馈'}
                        </span>
                        <span className="text-caption font-medium text-apple-black">
                          {interactionTypeLabels[interaction.type] || interaction.type}
                        </span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          <span className="text-caption flex items-center gap-1 text-apple-secondary">
                            <Clock className="w-3 h-3" />
                            {timeAgo(interaction.sentAt)}
                          </span>
                          <button
                            onClick={() => startEditingInteraction(interaction)}
                            className="p-1 rounded-full hover:bg-white transition-colors text-apple-secondary hover:text-apple-blue"
                            title="编辑"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteInteraction(interaction.id)}
                            className="p-1 rounded-full hover:bg-white transition-colors text-apple-secondary hover:text-apple-red"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {interaction.content && (
                        <p className="text-body whitespace-pre-wrap leading-relaxed text-apple-black">
                          {interaction.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ── Tab: AI 背调 ── */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'background' && (() => {
        const report = parseBackgroundReport();
        return (
          <div className="max-w-5xl mx-auto space-y-4 md:space-y-5 lg:space-y-6">
            {/* Loading state */}
            {bgCheckRunning && (
              <Card>
                <CardContent className="flex flex-col items-center py-20 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-[#E3F2FD] flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-apple-blue animate-spin" />
                    </div>
                  </div>
                  <p className="text-body font-medium text-apple-black">AI 正在分析 "{customer.company}"...</p>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-caption text-apple-secondary">正在抓取公开信息、行业数据和社交网络</span>
                    <span className="text-[11px] text-apple-tetriary">预计需要 15-30 秒</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {!bgCheckRunning && !report && (
              <Card>
                <CardContent className="flex flex-col items-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] flex items-center justify-center">
                    <SearchCheck className="w-7 h-7 text-apple-tetriary" />
                  </div>
                  <div className="text-center">
                    <p className="text-body font-medium text-apple-black mb-1">暂无AI背调报告</p>
                    <p className="text-caption text-apple-secondary max-w-sm">
                      AI 将自动分析客户公司背景、业务规模、采购需求和决策链，帮助您制定更精准的跟进策略
                    </p>
                  </div>
                  <button
                    onClick={handleBgCheck}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-body font-medium text-white bg-apple-blue hover:bg-[#0066CC] rounded-[10px] transition-all duration-300 shadow-sm mt-2"
                  >
                    <SearchCheck className="w-4 h-4" />
                    生成背调报告
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Report content */}
            {!bgCheckRunning && report && (
              <>
                {/* Report header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center">
                      <SearchCheck className="w-5 h-5 text-apple-blue" />
                    </div>
                    <div>
                      <p className="text-subheading font-semibold text-apple-black">AI背调报告</p>
                      <p className="text-[11px] text-apple-tetriary">
                        生成时间：{new Date(report.generatedAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBgCheck}
                      disabled={bgCheckRunning}
                      className="inline-flex items-center gap-1.5 text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-3 py-1.5 rounded-[6px] transition-colors duration-300"
                    >
                      {bgCheckRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SearchCheck className="w-3.5 h-3.5" />}
                      重新分析
                    </button>
                  </div>
                </div>

                {/* ── Company Info ── */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-apple-blue" />
                      <h2 className="text-subheading font-medium text-apple-black">公司信息</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <InfoItem label="公司名称" value={report.companyInfo.name} />
                      <InfoItem label="成立年份" value={report.companyInfo.founded} />
                      <InfoItem label="员工规模" value={report.companyInfo.employees} />
                      <InfoItem label="注册地址" value={report.companyInfo.address} />
                      <InfoItem label="所属行业" value={report.companyInfo.industry} />
                      <InfoItem label="注册号" value={report.companyInfo.registrationNumber} />
                    </div>
                    {report.companyInfo.website && report.companyInfo.website !== '未提供' && (
                      <div className="mt-3 pt-3 border-t border-apple-border/30">
                        <a
                          href={report.companyInfo.website.startsWith('http') ? report.companyInfo.website : `https://${report.companyInfo.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-caption text-apple-blue hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {report.companyInfo.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Business Analysis ── */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-apple-blue" />
                      <h2 className="text-subheading font-medium text-apple-black">业务分析</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <span className="text-caption text-apple-secondary block mb-1">主营产品</span>
                        <p className="text-body font-medium text-apple-black">{report.businessAnalysis.mainProducts}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-caption text-apple-secondary block mb-1">目标市场</span>
                          <p className="text-body text-apple-black">{report.businessAnalysis.targetMarkets}</p>
                        </div>
                        <div>
                          <span className="text-caption text-apple-secondary block mb-1">年营收估算</span>
                          <p className="text-body text-apple-black">{report.businessAnalysis.annualRevenue}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-caption text-apple-secondary block mb-1">规模评估</span>
                        <p className="text-body text-apple-black leading-relaxed">{report.businessAnalysis.scaleAssessment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ── Decision Makers ── */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-apple-blue" />
                      <h2 className="text-subheading font-medium text-apple-black">决策链识别</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {report.decisionMakers.map((dm: { name: string; position: string; linkedin?: string; contact?: string; influence: string }, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-[10px] bg-[#F5F5F7]">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[14px] font-semibold"
                            style={{
                              backgroundColor: dm.influence === '决策者' ? '#E3F2FD' : '#F5F5F7',
                              color: dm.influence === '决策者' ? '#1976D2' : '#86868B',
                            }}
                          >
                            {dm.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-body font-medium text-apple-black">{dm.name}</span>
                              <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: dm.influence === '决策者' ? '#E3F2FD' : '#FFF3E0',
                                  color: dm.influence === '决策者' ? '#1976D2' : '#E65100',
                                }}
                              >
                                {dm.influence}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-caption text-apple-secondary">
                              <span>{dm.position}</span>
                              {dm.contact && dm.contact !== '未获取' && (
                                <span className="text-apple-blue">{dm.contact}</span>
                              )}
                            </div>
                          </div>
                          {dm.linkedin && (
                            <a
                              href={`https://${dm.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-caption text-apple-blue hover:underline flex-shrink-0"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ── Procurement ── */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-apple-blue" />
                      <h2 className="text-subheading font-medium text-apple-black">采购情报</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="最近采购" value={report.procurement.lastPurchase} />
                      <InfoItem label="采购频率" value={report.procurement.frequency} />
                      <InfoItem label="采购品类" value={report.procurement.products} />
                      <InfoItem label="估算预算" value={report.procurement.estimatedBudget} />
                    </div>
                  </CardContent>
                </Card>

                {/* ── AI Advice ── */}
                <Card style={{ borderColor: report.aiAdvice.intentColor, borderWidth: '1px' }}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" style={{ color: report.aiAdvice.intentColor }} />
                      <h2 className="text-subheading font-medium text-apple-black">AI跟进建议</h2>
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full ml-auto"
                        style={{
                          backgroundColor: report.aiAdvice.intentColor + '20',
                          color: report.aiAdvice.intentColor,
                        }}
                      >
                        采购意向：{report.aiAdvice.intentLevel}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-caption text-apple-secondary block mb-1.5">
                        <Target className="w-3.5 h-3.5 inline mr-1" />
                        跟进策略
                      </span>
                      <p className="text-body text-apple-black leading-relaxed">{report.aiAdvice.followUpAdvice}</p>
                    </div>
                    <div>
                      <span className="text-caption text-apple-secondary block mb-1.5">
                        <Target className="w-3.5 h-3.5 inline mr-1" />
                        切入建议
                      </span>
                      <p className="text-body text-apple-black leading-relaxed">{report.aiAdvice.entryPoint}</p>
                    </div>
                    <div className="pt-2 border-t border-apple-border/30">
                      <span className="text-caption text-apple-tetriary">
                        建议联系时间：{report.aiAdvice.recommendedContactTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Download / Export */}
                <div className="flex justify-end gap-2 pb-4">
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${customer.company || 'customer'}_background_report.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast('success', '背调报告已下载');
                    }}
                    className="inline-flex items-center gap-1.5 text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-3 py-1.5 rounded-[6px] transition-colors duration-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载报告
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── Edit Customer Modal ── */}
      <AddCustomerModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={(cid, cname) => {
          loadCustomer();
          toast('success', `"${cname}" 已更新`);
        }}
        customer={{
          id: customer.id,
          company: customer.company,
          country: customer.country,
          industry: customer.industry,
          size: customer.size,
          website: customer.website,
          score: customer.score,
          status: customer.status,
          customerType: customer.customerType,
          tags: customer.tags,
          source: customer.source,
          contacts: customer.contacts,
        }}
      />
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[11px] text-apple-tetriary block mb-0.5">{label}</span>
      <span className="text-body text-apple-black">{value || '-'}</span>
    </div>
  );
}
