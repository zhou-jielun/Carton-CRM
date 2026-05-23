import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImportDialog from '@/components/ImportDialog';
import { useToast } from '@/contexts/ToastContext';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  Mail,
  MessageSquare,
  ChevronRight,
  FileText,
  Table2,
  Trash2,
  Plus,
  MoreHorizontal,
  Upload,
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

interface Customer {
  id: string;
  company: string;
  website?: string;
  industry?: string;
  country?: string;
  score: number;
  status: string;
  source?: string;
  tags: string[];
  createdAt: string;
  contacts: Array<{ email?: string; phone?: string; whatsapp?: string }>;
}

const statusLabels: Record<string, string> = {
  lead: '线索',
  contacted: '已触达',
  following: '跟进中',
  quoted: '已报价',
  won: '已成交',
  dormant: '休眠',
};

const quickFilters = [
  { key: 'all', label: '全部', grade: '', status: '' },
  { key: 'grade-a', label: 'A', grade: 'A', status: '' },
  { key: 'grade-b', label: 'B', grade: 'B', status: '' },
  { key: 'grade-c', label: 'C', grade: 'C', status: '' },
  { key: 'status-lead', label: '待跟进', grade: '', status: 'lead' },
  { key: 'status-contacted', label: '已触达', grade: '', status: 'contacted' },
  { key: 'status-following', label: '跟进中', grade: '', status: 'following' },
];

const statusChipStyles: Record<string, { bg: string; color: string }> = {
  lead: { bg: '#F5F5F7', color: '#86868B' },
  contacted: { bg: '#E3F2FD', color: '#1976D2' },
  following: { bg: '#FFF3E0', color: '#E65100' },
  quoted: { bg: '#E8F5E9', color: '#388E3C' },
  won: { bg: '#E8F5E9', color: '#388E3C' },
  dormant: { bg: '#FBE9E7', color: '#BF360C' },
};

export default function CustomersPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target as Node)) {
        setMoreActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterGrade) {
        const g = scoreToGrade(c.score);
        if (g.grade !== filterGrade) return false;
      }
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    });
  }, [customers, filterGrade, filterStatus]);

  const loadCustomers = async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (query) params.set('search', query);
      const res = await fetch(`/api/customers?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setCustomers(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(search);
  };

  const handleExport = async (format: 'json' | 'xlsx') => {
    setMoreActionsOpen(false);
    try {
      const res = await fetch(`/api/customers/export?format=${format}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('导出失败');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carton-crm-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('success', `已导出 ${customers.length} 条客户数据`);
    } catch (err: any) {
      toast('error', err.message || '导出失败');
    }
  };

  const handleImportComplete = () => {
    setImportOpen(false);
    loadCustomers(search);
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== '确认删除') return;
    setDeletingAll(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        toast('success', `已删除全部 ${data.deleted} 个客户`);
        setCustomers([]);
        setDeleteAllOpen(false);
        setDeleteConfirmText('');
      } else {
        toast('error', data.message || '删除失败');
      }
    } catch {
      toast('error', '删除失败');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleFilterClick = (grade: string, status: string) => {
    setFilterGrade(grade);
    setFilterStatus(status);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map((c) => c.id)));
    }
  };

  const isAllSelected = filteredCustomers.length > 0 && selectedIds.size === filteredCustomers.length;
  const showEmptyFiltered = !loading && customers.length > 0 && filteredCustomers.length === 0;
  const activeFilter = quickFilters.find((f) => f.grade === filterGrade && f.status === filterStatus)?.key || 'all';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-apple-black">客户库</h1>
          <p className="text-body text-apple-secondary mt-1">
            共 {customers.length} 个客户 · AI自动归档全量数据
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="px-3 py-1.5 rounded-[8px] text-caption font-medium select-none"
            style={{ backgroundColor: '#E3F2FD', color: '#1976D2' }}
          >
            A级客户 {customers.filter((c) => c.score >= 80).length}
          </span>
          <span
            className="px-3 py-1.5 rounded-[8px] text-caption font-medium select-none"
            style={{ backgroundColor: '#E8F5E9', color: '#388E3C' }}
          >
            跟进中 {customers.filter((c) => c.status === 'following').length}
          </span>
          <div className="w-px h-5 bg-[#E5E5EA] mx-0.5" />

          <button
            onClick={() => toast('info', '添加客户功能开发中')}
            className="inline-flex items-center gap-2 text-body font-medium text-apple-blue hover:opacity-80 transition-opacity px-2 py-1.5"
          >
            <Plus className="w-4 h-4" />
            添加客户
          </button>

          <div ref={moreActionsRef} className="relative">
            <button
              onClick={() => setMoreActionsOpen(!moreActionsOpen)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-apple-secondary hover:text-apple-black hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-all duration-300"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {moreActionsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 z-50 animate-fade-in">
                <div className="bg-apple-card border border-apple-border/50 rounded-[10px] shadow-apple-lg py-1 overflow-hidden">
                  <button
                    onClick={() => { setMoreActionsOpen(false); setImportOpen(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body text-apple-black hover:bg-[#F5F5F7] transition-colors duration-300"
                  >
                    <Upload className="w-4 h-4 text-apple-blue" />
                    导入客户
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body text-apple-black hover:bg-[#F5F5F7] transition-colors duration-300"
                  >
                    <FileText className="w-4 h-4 text-[#FF9500]" />
                    导出 JSON
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body text-apple-black hover:bg-[#F5F5F7] transition-colors duration-300"
                  >
                    <Table2 className="w-4 h-4 text-apple-green" />
                    导出 Excel
                  </button>
                  {customers.length > 0 && (
                    <>
                      <div className="h-px bg-[#E5E5EA] mx-3 my-1" />
                      <button
                        onClick={() => { setMoreActionsOpen(false); setDeleteAllOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-body text-apple-red hover:bg-[#FFF5F5] transition-colors duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        清空全部
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Filter Chips ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {quickFilters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => handleFilterClick(f.grade, f.status)}
              className={`px-3.5 py-1.5 rounded-[8px] text-caption font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-apple-blue text-white shadow-sm'
                  : 'bg-apple-surface text-apple-secondary hover:bg-[#E8E8ED]'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ── Search + Batch Bar ── */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-secondary pointer-events-none" />
          <Input
            className="pl-9 h-10 rounded-[10px] focus-visible:border-apple-blue"
            style={{ borderColor: '#E5E5EA' }}
            placeholder="搜索公司名、行业、国家..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-[#1C1C1E] rounded-[10px] shadow-apple-lg border border-apple-border/30 animate-fade-in">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={selectAll}
                className="w-4 h-4 rounded-[4px] border-apple-tetriary text-apple-blue focus:ring-apple-blue focus:ring-1"
              />
              <span className="text-caption text-apple-secondary whitespace-nowrap">已选 {selectedIds.size}</span>
            </label>
            <div className="w-px h-5 bg-[#E5E5EA]" />
            <button
              onClick={() => toast('info', `批量发送邮件给 ${selectedIds.size} 个客户（开发中）`)}
              className="text-caption font-medium text-apple-blue hover:opacity-80 transition-opacity px-2 py-1"
            >
              <Mail className="w-3.5 h-3.5 inline -mt-0.5 mr-2 align-middle" />
              邮件
            </button>
            <button
              onClick={() => toast('info', `批量发送WhatsApp给 ${selectedIds.size} 个客户（开发中）`)}
              className="text-caption font-medium text-apple-green hover:opacity-80 transition-opacity px-2 py-1"
            >
              <MessageSquare className="w-3.5 h-3.5 inline -mt-0.5 mr-2 align-middle" />
              WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded-[10px] bg-apple-red/5 border border-apple-red/20">
          <AlertCircle className="w-4 h-4 text-apple-red" />
          <span className="text-body text-apple-red">{error}</span>
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 text-apple-secondary mb-4" />
            <p className="text-body text-apple-secondary mb-2">暂无客户数据</p>
            <p className="text-caption text-apple-secondary">使用"AI获客"功能自动搜索并导入客户</p>
          </CardContent>
        </Card>
      ) : showEmptyFiltered ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="w-10 h-10 text-apple-secondary mb-3" />
            <p className="text-body text-apple-secondary mb-1">没有匹配的客户</p>
            <p className="text-caption text-apple-secondary">尝试切换筛选条件查看全部客户</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => handleFilterClick('', '')}>
              查看全部
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer) => {
            const grade = scoreToGrade(customer.score);
            const statusStyle = statusChipStyles[customer.status] || { bg: '#F5F5F7', color: '#86868B' };
            return (
              <Card
                key={customer.id}
                className="group hover:shadow-apple-lg hover:bg-apple-hover transition-all duration-300 ease-in-out cursor-pointer overflow-hidden"
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Checkbox — hidden until hover or checked */}
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(customer.id)}
                        onChange={() => toggleSelect(customer.id)}
                        className="w-4 h-4 rounded-[4px] border-apple-tetriary text-apple-blue focus:ring-apple-blue focus:ring-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 checked:opacity-100"
                      />
                    </div>

                    {/* Circular grade */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold leading-none select-none"
                      style={{ backgroundColor: grade.bg, color: grade.color }}
                    >
                      {grade.grade}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-subheading font-semibold text-apple-black dark:text-white truncate">
                          {customer.company || 'Unknown Company'}
                        </h3>
                        <span
                          className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium leading-none rounded-[4px]"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                        >
                          {statusLabels[customer.status] || customer.status}
                        </span>
                        {customer.source === 'google_search' && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium leading-none rounded-[4px]"
                            style={{ backgroundColor: '#E3F2FD', color: '#1976D2' }}
                          >
                            谷歌获客
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-caption text-apple-secondary">
                        {customer.country && (
                          <span className="flex items-center gap-1">
                            <span className="text-sm leading-none">{getCountryFlag(customer.country)}</span>
                            {customer.country}
                          </span>
                        )}
                        {customer.industry && <span>{customer.industry}</span>}
                        <span>{timeAgo(customer.createdAt)}</span>
                      </div>

                      {(customer.contacts.length > 0 &&
                        (customer.contacts[0]?.email || customer.contacts[0]?.whatsapp)) && (
                        <div className="flex items-center gap-3 mt-1.5">
                          {customer.contacts[0]?.email && (
                            <span className="flex items-center gap-1 text-caption text-apple-blue">
                              <Mail className="w-3 h-3" />
                              {customer.contacts[0].email}
                            </span>
                          )}
                          {customer.contacts[0]?.whatsapp && (
                            <span className="flex items-center gap-1 text-caption text-apple-green">
                              <MessageSquare className="w-3 h-3" />
                              WA
                            </span>
                          )}
                        </div>
                      )}

                      {customer.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {customer.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-caption"
                              style={{ backgroundColor: '#F5F5F7', color: '#86868B' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-apple-tetriary group-hover:text-apple-blue transition-colors duration-300 ml-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Floating selection indicator ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
          <div className="flex items-center gap-3 px-5 py-3 bg-[#1C1C1E] text-white rounded-[12px] shadow-apple-lg border border-white/10">
            <span className="text-caption font-medium">已选择 {selectedIds.size} 个客户</span>
            <div className="w-px h-4 bg-white/20" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-caption text-white/70 hover:text-white transition-colors duration-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* ── Delete All Confirmation ── */}
      {deleteAllOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
          onClick={() => setDeleteAllOpen(false)}
        >
          <div
            className="bg-apple-card rounded-[14px] shadow-apple-lg p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-body font-semibold text-apple-black mb-2">确认清空全部客户</h3>
            <p className="text-caption text-apple-secondary mb-4">
              此操作不可撤销，将删除全部 {customers.length} 个客户及其所有跟进记录。
            </p>
            <div className="mb-4">
              <p className="text-caption text-apple-secondary mb-1.5">
                请输入 <strong>确认删除</strong> 以继续
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="确认删除"
                className="text-body"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeleteAllOpen(false);
                  setDeleteConfirmText('');
                }}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAll}
                disabled={deleteConfirmText !== '确认删除' || deletingAll}
              >
                {deletingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                确认清空
              </Button>
            </div>
          </div>
        </div>
      )}

      <ImportDialog open={importOpen} onClose={handleImportComplete} />
    </div>
  );
}
