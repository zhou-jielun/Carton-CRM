import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { STATUS_ORDER, statusLabels } from '@/lib/statusConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Mail,
  TrendingUp,
  Target,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface DashboardData {
  customers: { total: number; newToday: number; newThisWeek: number; newThisMonth: number };
  campaigns: any[];
  highIntentCustomers: number;
  statusCounts: Record<string, number>;
}

// 漏斗阶段：按 STATUS_ORDER 顺序，排除已流失/休眠（终端状态）
const funnelColors: Record<string, string> = {
  lead: 'bg-[#86868B]',
  interested: 'bg-[#5C6BC0]',
  contacted: 'bg-[#007AFF]',
  following: 'bg-[#34C759]',
  quoted: 'bg-[#FF9500]',
  negotiating: 'bg-[#7B1FA2]',
  sampling: 'bg-[#00838F]',
  won: 'bg-apple-red',
  lost: 'bg-[#BF360C]',
  dormant: 'bg-[#9E9E9E]',
};

const funnelStages = STATUS_ORDER
  .filter((s) => s !== 'lost' && s !== 'dormant')
  .map((status) => ({
    status,
    label: statusLabels[status] || status,
    color: funnelColors[status] || 'bg-[#86868B]',
  }));

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
        <p className="text-body text-apple-secondary mt-1">半自动AI获客数据概览</p>
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
        {/* AI Lead Gen Quick Entry */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-apple-blue" />
              AI 获客
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-caption text-apple-secondary">
                半自动 AI 获客：输入目标市场 → AI 生成搜索关键词 → 手动搜索粘贴结果 → AI 分析提取客户 → 一键导入 CRM
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-apple-surface rounded-[10px] p-3 text-center">
                  <p className="text-display font-semibold text-apple-black">{formatNumber(data.customers.newToday)}</p>
                  <p className="text-caption text-apple-secondary">今日新增</p>
                </div>
                <div className="bg-apple-surface rounded-[10px] p-3 text-center">
                  <p className="text-display font-semibold text-apple-black">{formatNumber(data.customers.newThisWeek)}</p>
                  <p className="text-caption text-apple-secondary">本周新增</p>
                </div>
                <div className="bg-apple-surface rounded-[10px] p-3 text-center">
                  <p className="text-display font-semibold text-apple-black">{formatNumber(data.customers.total)}</p>
                  <p className="text-caption text-apple-secondary">客户总数</p>
                </div>
              </div>

              {/* CTA */}
              <a
                href="/acquisition"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-body font-medium text-white bg-apple-blue hover:bg-[#0066CC] transition-all duration-300 rounded-[10px] shadow-sm no-underline"
              >
                <Sparkles className="w-4 h-4" />
                前往 AI 获客
              </a>
            </div>
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {funnelStages.map((stage) => {
              const count = data.statusCounts[stage.status] || 0;
              const pct = data.customers.total > 0
                ? Math.round((count / data.customers.total) * 100)
                : 0;
              return (
                <div key={stage.status} className="text-center">
                  <div className="relative h-2 bg-[#F5F5F7] rounded-full mb-2 overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-display font-semibold text-apple-black">{formatNumber(count)}</p>
                  <p className="text-caption text-apple-secondary">{stage.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
