import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatNumber, timeAgo } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Mail,
  TrendingUp,
  Target,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface DashboardData {
  customers: { total: number; newToday: number; newThisWeek: number; newThisMonth: number };
  campaigns: any[];
  tasks: any[];
  highIntentCustomers: number;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  idle: { label: '待机', variant: 'secondary' },
  running: { label: '运行中', variant: 'default' },
  completed: { label: '已完成', variant: 'success' },
  failed: { label: '失败', variant: 'destructive' },
  paused: { label: '已暂停', variant: 'warning' },
};

const taskTypeLabels: Record<string, string> = {
  google_scrape: '谷歌获客',
  email_send: '邮件发送',
  whatsapp_send: 'WhatsApp推送',
  data_analysis: '数据分析',
  report: '自动报告',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getDashboardStats();
      setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <AlertCircle className="w-8 h-8 text-apple-red" />
        <p className="text-body text-apple-secondary">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      title: '总客户数',
      value: formatNumber(data.customers.total),
      change: `今日 +${data.customers.newToday}`,
      icon: Users,
      color: 'text-apple-blue',
      bg: 'bg-apple-blue/5',
    },
    {
      title: '高意向客户',
      value: formatNumber(data.highIntentCustomers),
      change: '评分≥70分',
      icon: Target,
      color: 'text-[#34C759]',
      bg: 'bg-[#34C759]/5',
    },
    {
      title: '本月新增',
      value: formatNumber(data.customers.newThisMonth),
      change: `本周 +${data.customers.newThisWeek}`,
      icon: TrendingUp,
      color: 'text-[#FF9500]',
      bg: 'bg-[#FF9500]/5',
    },
    {
      title: '邮件Campaign',
      value: data.campaigns.length.toString(),
      change: '进行中',
      icon: Mail,
      color: 'text-apple-blue',
      bg: 'bg-apple-blue/5',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-display text-apple-black">仪表盘</h1>
        <p className="text-body text-apple-secondary mt-1">AI全自动外贸获客数据概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-caption text-apple-secondary mb-1">{stat.title}</p>
                  <p className="text-display text-apple-black font-semibold">{stat.value}</p>
                  <p className="text-caption text-apple-secondary mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-[10px] ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Task Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-apple-blue" />
              AI任务运行状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-10 h-10 text-apple-secondary mb-3" />
                <p className="text-body text-apple-secondary">暂无自动任务</p>
                <p className="text-caption text-apple-secondary mt-1">在"自动任务"中创建您的第一个AI获客任务</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-[10px] bg-[#F5F5F7]"
                  >
                    <div>
                      <p className="text-body font-medium text-apple-black">{task.name}</p>
                      <p className="text-caption text-apple-secondary mt-0.5">
                        {taskTypeLabels[task.type] || task.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.lastRunAt && (
                        <span className="text-caption text-apple-secondary">
                          {timeAgo(task.lastRunAt)}
                        </span>
                      )}
                      <Badge variant={statusLabels[task.status]?.variant || 'secondary'}>
                        {statusLabels[task.status]?.label || task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-apple-blue" />
              最近Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="w-10 h-10 text-apple-secondary mb-3" />
                <p className="text-body text-apple-secondary">暂无Campaign</p>
                <p className="text-caption text-apple-secondary mt-1">创建邮件营销活动开始获客</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.campaigns.map((camp: any) => (
                  <div
                    key={camp.id}
                    className="flex items-center justify-between p-3 rounded-[10px] bg-[#F5F5F7]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-apple-black truncate">{camp.name}</p>
                      <p className="text-caption text-apple-secondary mt-0.5">
                        发送 {camp.totalSent} 封
                      </p>
                    </div>
                    <Badge variant={camp.status === 'sent' ? 'success' : camp.status === 'sending' ? 'default' : 'secondary'}>
                      {camp.status === 'sent' ? '已发送' : camp.status === 'sending' ? '发送中' : '草稿'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Funnel Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-apple-blue" />
            客户转化漏斗
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { label: '线索', count: data.customers.total, color: 'bg-apple-blue', pct: 100 },
              { label: '已触达', count: Math.floor(data.customers.total * 0.6), color: 'bg-[#007AFF]/80', pct: 60 },
              { label: '跟进中', count: data.highIntentCustomers, color: 'bg-[#34C759]', pct: 30 },
              { label: '已报价', count: Math.floor(data.highIntentCustomers * 0.5), color: 'bg-[#FF9500]', pct: 15 },
              { label: '已成交', count: Math.floor(data.highIntentCustomers * 0.2), color: 'bg-apple-red', pct: 5 },
            ].map((stage) => (
              <div key={stage.label} className="text-center">
                <div className="relative h-2 bg-[#F5F5F7] rounded-full mb-2 overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
                <p className="text-display font-semibold text-apple-black">{formatNumber(stage.count)}</p>
                <p className="text-caption text-apple-secondary">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
