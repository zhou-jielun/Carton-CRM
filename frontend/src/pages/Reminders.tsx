import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { statusLabels, statusChipStyles } from '@/lib/statusConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReminderItem {
  id: string;
  company: string | null;
  nextFollowUp: string | null;
  status: string;
  country: string | null;
}

interface RemindersData {
  total: number;
  overdue: number;
  today: number;
  upcoming: number;
  items: ReminderItem[];
}

function formatRelative(dateStr: string): { label: string; urgent: boolean } {
  const d = new Date(dateStr);
  const today = new Date();
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = (dateOnly.getTime() - todayOnly.getTime()) / 86400000;

  if (diff < 0) return { label: `逾期 ${Math.abs(diff)} 天`, urgent: true };
  if (diff === 0) return { label: '今天', urgent: true };
  if (diff === 1) return { label: '明天', urgent: false };
  return { label: `${diff} 天后`, urgent: false };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export default function RemindersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RemindersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followUpDays, setFollowUpDays] = useState<Record<string, number>>({});
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<RemindersData>('/customers/reminders');
      setData(res);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFollowedUp = async (customerId: string) => {
    const days = followUpDays[customerId] || 7;
    setActionLoading((prev) => new Set(prev).add(customerId));
    try {
      await api.post(`/customers/${customerId}/followed-up`, { days } as any);
      // Remove from local state immediately for responsive UI
      if (data) {
        const newItems = data.items.filter((i) => i.id !== customerId);
        setData({ ...data, items: newItems, total: data.total - 1 });
      }
    } catch {
      // silently fail, keep item visible
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-body text-apple-secondary">{error || '加载失败'}</p>
      </div>
    );
  }

  const overdue = data.items.filter((i) => i.nextFollowUp && new Date(i.nextFollowUp) < new Date(new Date().setHours(0, 0, 0, 0)));
  const today = data.items.filter((i) => i.nextFollowUp && new Date(i.nextFollowUp).toDateString() === new Date().toDateString());
  const upcoming = data.items.filter((i) => i.nextFollowUp && new Date(i.nextFollowUp) > new Date());

  const sections: { title: string; items: ReminderItem[]; icon: typeof AlertTriangle; color: string; bg: string; textColor: string }[] = [
    { title: '已逾期', items: overdue, icon: AlertTriangle, color: '#FF3B30', bg: '#FBE9E7', textColor: 'text-apple-red' },
    { title: '今天', items: today, icon: Clock, color: '#FF9500', bg: '#FFF3E0', textColor: 'text-[#FF9500]' },
    { title: '即将到期', items: upcoming, icon: Calendar, color: '#007AFF', bg: '#E3F2FD', textColor: 'text-apple-blue' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-display text-apple-black">跟进提醒</h1>
        <p className="text-body text-apple-secondary mt-1">
          逾期 {data.overdue} · 今天 {data.today} · 即将到期 {data.upcoming}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-apple-red">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-apple-secondary">已逾期</p>
                <p className="text-display text-apple-red font-semibold">{data.overdue}</p>
              </div>
              <div className="p-3 rounded-[10px] bg-[#FBE9E7]">
                <AlertTriangle className="w-5 h-5 text-apple-red" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#FF9500]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-apple-secondary">今天到期</p>
                <p className="text-display text-[#FF9500] font-semibold">{data.today}</p>
              </div>
              <div className="p-3 rounded-[10px] bg-[#FFF3E0]">
                <Clock className="w-5 h-5 text-[#FF9500]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-apple-blue">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-apple-secondary">即将到期</p>
                <p className="text-display text-apple-blue font-semibold">{data.upcoming}</p>
              </div>
              <div className="p-3 rounded-[10px] bg-[#E3F2FD]">
                <Calendar className="w-5 h-5 text-apple-blue" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {data.total === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#34C759]" />
            </div>
            <h3 className="text-[17px] font-semibold text-apple-black mb-1">暂无待跟进客户</h3>
            <p className="text-body text-apple-secondary mb-4">
              所有客户的跟进计划都在日程中
            </p>
            <Button variant="secondary" onClick={() => navigate('/customers')}>
              <Users className="w-4 h-4 mr-2" />前往客户列表
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {data.total > 0 && sections.map((section) => {
        if (section.items.length === 0) return null;
        return (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={`w-5 h-5 ${section.textColor}`} />
              <h2 className={`text-[17px] font-semibold ${section.textColor}`}>
                {section.title}
                <span className="text-caption text-apple-secondary ml-2 font-normal">
                  {section.items.length} 个客户
                </span>
              </h2>
            </div>

            <div className="space-y-2">
              {section.items.map((item) => {
                const rel = item.nextFollowUp ? formatRelative(item.nextFollowUp) : { label: '', urgent: false };
                const statusStyle = statusChipStyles[item.status] || { bg: '#F5F5F7', color: '#86868B' };
                const isLoading = actionLoading.has(item.id);
                const days = followUpDays[item.id] || 7;

                return (
                  <Card
                    key={item.id}
                    className="group hover:shadow-apple-sm transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/customers/${item.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Status dot */}
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: section.color }}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-subheading font-semibold text-apple-black truncate">
                              {item.company || '未命名客户'}
                            </h3>
                            <span
                              className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium leading-none rounded-[4px]"
                              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                            >
                              {statusLabels[item.status] || item.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-caption text-apple-secondary">
                            {item.country && <span>{item.country}</span>}
                            <span className={rel.urgent ? 'text-apple-red font-medium' : ''}>
                              {rel.label}
                            </span>
                            <span>{formatDate(item.nextFollowUp)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Day selector */}
                          <select
                            value={days}
                            onChange={(e) =>
                              setFollowUpDays((prev) => ({ ...prev, [item.id]: parseInt(e.target.value) }))
                            }
                            className="h-8 px-2 rounded-[6px] text-caption border border-apple-border/50 bg-white text-apple-black opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <option value={3}>3天</option>
                            <option value={5}>5天</option>
                            <option value={7}>7天</option>
                            <option value={14}>14天</option>
                            <option value={30}>30天</option>
                          </select>

                          {/* Followed up button */}
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleFollowedUp(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-caption h-8 px-3"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                已跟进
                              </>
                            )}
                          </Button>
                        </div>

                        <ChevronRight className="w-4 h-4 text-apple-secondary/30 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
