import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Clock, AlertTriangle, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { statusLabels } from '@/lib/statusConfig';
import { useReminderRefresh } from '@/lib/reminderEvents';

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<RemindersData | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<RemindersData>('/customers/reminders');
      setData(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount for badge count + poll every 30s
  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  // Listen for real-time refresh events (from CustomerDetail save)
  useReminderRefresh(fetchReminders);

  const handleToggle = () => {
    if (!open && !data) {
      fetchReminders();
    }
    setOpen(!open);
  };

  const total = data?.total ?? 0;
  const urgentCount = (data?.overdue ?? 0) + (data?.today ?? 0);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-[10px] text-apple-secondary hover:text-apple-black dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-all duration-300"
        title="跟进提醒"
      >
        <Bell className="w-5 h-5" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-apple-red text-white text-[10px] font-semibold px-1 leading-none">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-apple-border/50 dark:border-white/10 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-apple-border/30 dark:border-white/5">
            <h3 className="text-[15px] font-semibold text-apple-black dark:text-white">
              跟进提醒
            </h3>
            {total > 0 && (
              <p className="text-caption text-apple-secondary mt-0.5">
                共 {total} 条待跟进，其中 {urgentCount} 条紧急
              </p>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-8 text-center text-apple-secondary text-caption">
                加载中...
              </div>
            ) : total === 0 ? (
              <div className="px-5 py-8 text-center">
                <Calendar className="w-8 h-8 text-apple-secondary/40 mx-auto mb-2" />
                <p className="text-caption text-apple-secondary">暂无待跟进客户</p>
                <p className="text-[12px] text-apple-secondary/50 mt-1">设置下次跟进日期后会显示在这里</p>
              </div>
            ) : (
              <div className="py-1">
                {data?.items.map((item) => {
                  const rel = item.nextFollowUp ? formatRelative(item.nextFollowUp) : { label: '', urgent: false };
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(`/customers/${item.id}`);
                        setOpen(false);
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-colors duration-150 flex items-center gap-3 group"
                    >
                      {/* Status indicator dot */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          rel.urgent ? 'bg-apple-red animate-pulse' : 'bg-amber-400'
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-apple-black dark:text-white truncate">
                          {item.company || '未命名客户'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[11px] font-medium ${
                              rel.urgent ? 'text-apple-red' : 'text-apple-secondary'
                            }`}
                          >
                            {rel.label}
                          </span>
                          {item.country && (
                            <span className="text-[11px] text-apple-secondary/50">
                              {item.country}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] text-apple-secondary/40 bg-[#F5F5F7] dark:bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">
                        {statusLabels[item.status] || item.status}
                      </span>

                      <ChevronRight className="w-3.5 h-3.5 text-apple-secondary/30 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {total > 0 && (
            <div className="px-5 py-3 border-t border-apple-border/30 dark:border-white/5 bg-[#FAFAFA] dark:bg-[#161618]">
              <button
                onClick={() => {
                  navigate('/customers');
                  setOpen(false);
                }}
                className="w-full text-center text-[12px] font-medium text-apple-blue hover:text-apple-blue/80 transition-colors"
              >
                查看全部客户
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
