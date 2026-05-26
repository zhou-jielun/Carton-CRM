import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Loader2,
  AlertCircle,
  PieChart,
  LineChart,
  Globe,
  Activity,
  FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, LineChart as RLineChart, Line, Legend,
} from 'recharts';
import { STATUS_ORDER, statusLabels } from '@/lib/statusConfig';

interface AnalyticsData {
  statusBreakdown: Array<{ status: string; count: number }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
  monthlyCustomers: Array<{ month: string; count: number }>;
  campaignStats: { sent: number; opened: number; clicked: number; replied: number };
  interactionsByType: Array<{ type: string; count: number }>;
  countryBreakdown: Array<{ country: string; count: number }>;
  scoreDistribution: Array<{ range: string; count: number }>;
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#FF6482', '#00C7BE'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/analytics/overview', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type: 'weekly' | 'monthly') => {
    setReportGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          type,
          period: new Date().toISOString().split('T')[0],
          language: 'zh',
        }),
      });
      const result = await res.json();
      if (result.success) {
        loadData();
      }
    } catch {} finally {
      setReportGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <AlertCircle className="w-6 h-6 text-apple-red" />
        <span className="ml-2 text-body text-apple-secondary">{error || '加载失败'}</span>
      </div>
    );
  }

  const funnelData = STATUS_ORDER
    .filter((s) => s !== 'lost' && s !== 'dormant')
    .map((status) => ({
      name: statusLabels[status] || status,
      value: data.statusBreakdown.find((s) => s.status === status)?.count || 0,
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-apple-black">数据分析</h1>
          <p className="text-body text-apple-secondary mt-1">多维度数据统计、渠道效果对比、AI报告</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => handleGenerateReport('weekly')} disabled={reportGenerating}>
            <FileText className="w-4 h-4 mr-2" />生成周报
          </Button>
          <Button onClick={() => handleGenerateReport('monthly')} disabled={reportGenerating}>
            <FileText className="w-4 h-4 mr-2" />生成月报
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-caption text-apple-secondary mb-1">邮件发送</p>
            <p className="text-display font-semibold text-apple-black">{data.campaignStats.sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-caption text-apple-secondary mb-1">打开率</p>
            <p className="text-display font-semibold text-apple-black">
              {data.campaignStats.sent > 0
                ? ((data.campaignStats.opened / data.campaignStats.sent) * 100).toFixed(1) + '%'
                : '0%'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-caption text-apple-secondary mb-1">点击率</p>
            <p className="text-display font-semibold text-apple-black">
              {data.campaignStats.sent > 0
                ? ((data.campaignStats.clicked / data.campaignStats.sent) * 100).toFixed(1) + '%'
                : '0%'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-caption text-apple-secondary mb-1">回复率</p>
            <p className="text-display font-semibold text-apple-black">
              {data.campaignStats.sent > 0
                ? ((data.campaignStats.replied / data.campaignStats.sent) * 100).toFixed(1) + '%'
                : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Customer Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-apple-blue" />
              月度新增客户趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyCustomers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#86868B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#86868B' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#007AFF" radius={[4, 4, 0, 0]} name="新增客户" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-apple-blue" />
              客户状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie
                    data={funnelData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {funnelData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-apple-blue" />
              客户评分分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                  <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#86868B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#86868B' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#34C759" radius={[4, 4, 0, 0]} name="客户数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Country Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-apple-blue" />
              客户国家分布 Top 10
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.countryBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#86868B' }} />
                  <YAxis type="category" dataKey="country" tick={{ fontSize: 12, fill: '#86868B' }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF9500" radius={[0, 4, 4, 0]} name="客户数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-apple-blue" />
              获客渠道分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie
                    data={data.sourceBreakdown.map((s) => ({
                      name: s.source === 'google_search' ? '谷歌获客' : s.source === 'customs_data' ? '海关数据' : s.source,
                      value: s.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.sourceBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-apple-blue" />
              转化漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#86868B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#86868B' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#007AFF" radius={[4, 4, 0, 0]} name="客户数">
                    {funnelData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
