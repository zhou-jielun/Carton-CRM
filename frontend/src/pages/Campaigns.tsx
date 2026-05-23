import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  Plus,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  language: string;
  subject?: string;
  content?: string;
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  sending: { label: '发送中', variant: 'default' },
  sent: { label: '已发送', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
};

const typeLabels: Record<string, string> = {
  outreach: '开发信',
  followup: '跟进邮件',
  newsletter: '新闻简报',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'outreach', language: 'en' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setCampaigns(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newCampaign),
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns([data.campaign, ...campaigns]);
        setShowCreate(false);
        setNewCampaign({ name: '', type: 'outreach', language: 'en' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 text-apple-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-apple-black">邮件营销</h1>
          <p className="text-body text-apple-secondary mt-1">AI开发信生成、批量发送、全链路追踪</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建Campaign
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-[10px] bg-apple-red/5 border border-apple-red/20 text-body text-apple-red">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Create Campaign Dialog */}
      {showCreate && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-heading">新建邮件Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign名称</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="例如：2024 Q1 开发信"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>类型</Label>
                  <select
                    className="flex h-10 w-full rounded-[10px] border border-apple-border bg-white px-4 py-2 text-body"
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                  >
                    <option value="outreach">开发信</option>
                    <option value="followup">跟进邮件</option>
                    <option value="newsletter">新闻简报</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>语言</Label>
                  <select
                    className="flex h-10 w-full rounded-[10px] border border-apple-border bg-white px-4 py-2 text-body"
                    value={newCampaign.language}
                    onChange={(e) => setNewCampaign({ ...newCampaign, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ru">Русский</option>
                    <option value="es">Español</option>
                    <option value="vi">Tiếng Việt</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>取消</Button>
                <Button type="submit" disabled={creating}>
                  {creating ? '创建中...' : '创建'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Campaign List */}
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="w-12 h-12 text-apple-secondary mb-4" />
              <p className="text-body text-apple-secondary mb-2">暂无Campaign</p>
              <p className="text-caption text-apple-secondary mb-6">创建您的第一个邮件营销活动，AI将自动生成个性化开发信</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((camp) => (
            <Card key={camp.id} className="animate-fade-in hover:shadow-apple-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-[10px] bg-apple-blue/5">
                      <FileText className="w-5 h-5 text-apple-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-body font-medium text-apple-black">{camp.name}</h3>
                        <Badge variant={statusLabels[camp.status]?.variant || 'secondary'}>
                          {statusLabels[camp.status]?.label || camp.status}
                        </Badge>
                        <Badge variant="outline">{typeLabels[camp.type] || camp.type}</Badge>
                      </div>
                      <p className="text-caption text-apple-secondary">
                        {camp.totalSent > 0
                          ? `发送 ${camp.totalSent} 封 · 打开 ${camp.totalOpened} 次 · 回复 ${camp.totalReplied} 次`
                          : '尚未发送'}
                        {camp.subject && ` · 主题: ${camp.subject}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {camp.status === 'draft' && (
                      <Button size="sm">
                        <Send className="w-4 h-4 mr-1" />
                        发送
                      </Button>
                    )}
                    <ChevronRight className="w-5 h-5 text-apple-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
