import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
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
  const [editingBackgroundCheck, setEditingBackgroundCheck] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  useEffect(() => {
    loadCustomerIds();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    setEditingBackgroundCheck(false);
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

  const saveBackgroundCheck = async () => {
    await updateCustomer({ backgroundCheck });
    setEditingBackgroundCheck(false);
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
              <div className="flex items-center gap-1">
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

      {/* ── Main grid ── */}
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

          {/* Interactions */}
          <Card
            ref={interactionRef}
            className="rounded-[12px] bg-apple-hover flex-1 flex flex-col"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-subheading font-medium text-apple-black">跟进记录</h2>
                <button
                  onClick={() => setAddingInteraction(!addingInteraction)}
                  className="inline-flex items-center gap-2 text-body font-medium text-apple-blue hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {addingInteraction ? '收起' : '添加跟进'}
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {/* Add follow-up form */}
              {addingInteraction && (
                <div className="mb-5 p-4 rounded-[10px] bg-white border border-apple-border/30 space-y-3 shadow-sm">
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={interactionType}
                      onChange={(e) => setInteractionType(e.target.value)}
                      className="h-8 px-2 rounded-[8px] border border-apple-border/50 bg-white text-caption text-apple-black focus:outline-none focus:border-apple-blue"
                    >
                      <option value="note">跟进备注</option>
                      <option value="email">邮件沟通</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="call">电话沟通</option>
                    </select>
                    <select
                      value={interactionDirection}
                      onChange={(e) => setInteractionDirection(e.target.value)}
                      className="h-8 px-2 rounded-[8px] border border-apple-border/50 bg-white text-caption text-apple-black focus:outline-none focus:border-apple-blue"
                    >
                      <option value="inbound">收到</option>
                      <option value="outbound">发出</option>
                    </select>
                    <input
                      type="date"
                      value={interactionDate}
                      onChange={(e) => setInteractionDate(e.target.value)}
                      className="h-8 px-2 rounded-[8px] border border-apple-border/50 bg-white text-caption text-apple-black focus:outline-none focus:border-apple-blue"
                    />
                  </div>
                  <textarea
                    className="w-full h-24 px-3 py-2 rounded-[8px] border border-apple-border/50 bg-white text-body text-apple-black resize-none focus:outline-none focus:border-apple-blue transition-colors duration-300"
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
                <div className="mb-4 p-3 rounded-[10px] bg-white border border-apple-border/20 border-l-4" style={{ borderLeftColor: '#007AFF' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#F5F5F7] text-apple-secondary">历史备注</span>
                    <span className="text-caption text-apple-secondary ml-auto">{timeAgo(customer.updatedAt)}</span>
                  </div>
                  <p className="text-caption text-apple-secondary mt-1 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}

              {/* Interaction list */}
              {customer.interactions.length === 0 && !customer.notes ? (
                <p className="text-caption text-apple-secondary py-4 text-center">暂无跟进记录，点击"添加跟进"开始记录</p>
              ) : (
                <div className="divide-y" style={{ borderColor: '#E5E5EA' }}>
                  {customer.interactions.map((interaction, idx) => (
                    <div
                      key={interaction.id}
                      className={`${idx === 0 ? 'pb-3' : 'py-3'} ${idx === customer.interactions.length - 1 ? 'pb-0' : ''}`}
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
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteInteraction(interaction.id)}
                            className="p-1 rounded-full hover:bg-white transition-colors text-apple-secondary hover:text-apple-red"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {interaction.content && (
                        <p className="text-body mt-1 whitespace-pre-wrap leading-relaxed text-apple-black">
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

        {/* ── Right column ── */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-4 md:space-y-5 lg:space-y-6">
          {/* Merged details card */}
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
              <div className="py-3">
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
            </CardContent>
          </Card>

          {/* ── Background check card ── */}
          <Card>
            <CardHeader>
              <h2 className="text-subheading font-medium text-apple-black">客户背调</h2>
            </CardHeader>
            <CardContent>
              {editingBackgroundCheck ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full h-32 px-3 py-2 rounded-[8px] border border-apple-border/50 bg-white text-body text-apple-black resize-none focus:outline-none focus:border-apple-blue transition-colors duration-300"
                    value={backgroundCheck}
                    onChange={(e) => setBackgroundCheck(e.target.value)}
                    placeholder="输入客户背调信息..."
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={saveBackgroundCheck} disabled={saving}>
                      保存
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setEditingBackgroundCheck(false); setBackgroundCheck(customer?.backgroundCheck || ''); }}>
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {backgroundCheck ? (
                    <p className="text-body text-apple-black whitespace-pre-wrap leading-relaxed">{backgroundCheck}</p>
                  ) : (
                    <p className="text-caption text-apple-secondary">暂无背调信息</p>
                  )}
                  <button
                    onClick={() => setEditingBackgroundCheck(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-caption font-medium text-apple-blue hover:bg-[#E3F2FD] px-2.5 py-1.5 rounded-[6px] transition-colors duration-300"
                  >
                    <Edit3 className="w-3 h-3" />
                    {backgroundCheck ? '编辑背调' : '添加背调'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
