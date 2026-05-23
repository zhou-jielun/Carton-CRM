import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Key,
  Mail,
  MessageSquare,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [language, setLanguage] = useState('zh');

  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');

  const [whatsappApiKey, setWhatsappApiKey] = useState('');
  const [whatsappApiUrl, setWhatsappApiUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) {
        setName(data.user.name || '');
        setCompanyName(data.user.companyName || '');
        setTimezone(data.user.timezone || 'Asia/Shanghai');
        setLanguage(data.user.language || 'zh');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name, companyName, timezone, language }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('基本信息已保存');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKeys = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          claudeApiKey: claudeApiKey || undefined,
          smtpHost: smtpHost || undefined,
          smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
          smtpUser: smtpUser || undefined,
          smtpPass: smtpPass || undefined,
          smtpFromEmail: smtpFromEmail || undefined,
          smtpFromName: smtpFromName || undefined,
          whatsappApiKey: whatsappApiKey || undefined,
          whatsappApiUrl: whatsappApiUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) setSuccess('API配置已保存');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-display text-apple-black">系统设置</h1>
        <p className="text-body text-apple-secondary mt-1">AI密钥管理、SMTP邮箱配置、公司资料</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-[10px] bg-apple-red/5 border border-apple-red/20 text-body text-apple-red">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-[10px] bg-[#34C759]/5 border border-[#34C759]/20 text-body text-[#34C759]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-apple-blue" />
            基本信息
          </CardTitle>
          <CardDescription>公司信息和账号设置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="您的姓名" />
            </div>
            <div className="space-y-2">
              <Label>公司名称</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="公司英文名称" />
            </div>
            <div className="space-y-2">
              <Label>时区</Label>
              <select
                className="flex h-10 w-full rounded-[10px] border border-apple-border bg-white px-4 py-2 text-body"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Shanghai">亚洲/上海 (UTC+8)</option>
                <option value="America/New_York">美国/东部 (UTC-5)</option>
                <option value="Europe/London">欧洲/伦敦 (UTC+0)</option>
                <option value="Europe/Moscow">欧洲/莫斯科 (UTC+3)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>默认语言</Label>
              <select
                className="flex h-10 w-full rounded-[10px] border border-apple-border bg-white px-4 py-2 text-body"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="es">Español</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />保存基本信息
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-apple-blue" />
            AI密钥配置
          </CardTitle>
          <CardDescription>Claude API密钥用于AI内容生成和客户分析</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Claude API Key</Label>
            <Input
              type="password"
              value={claudeApiKey}
              onChange={(e) => setClaudeApiKey(e.target.value)}
              placeholder="sk-ant-..."
            />
            <p className="text-caption text-apple-secondary">从 console.anthropic.com 获取API密钥</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveKeys} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />保存密钥
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-apple-blue" />
            SMTP邮箱配置
          </CardTitle>
          <CardDescription>配置发信邮箱，用于AI开发信批量发送</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP服务器</Label>
              <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com" />
            </div>
            <div className="space-y-2">
              <Label>端口</Label>
              <Input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="SMTP密码" />
            </div>
            <div className="space-y-2">
              <Label>发件人邮箱</Label>
              <Input value={smtpFromEmail} onChange={(e) => setSmtpFromEmail(e.target.value)} placeholder="from@example.com" />
            </div>
            <div className="space-y-2">
              <Label>发件人名称</Label>
              <Input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="Company Name" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveKeys} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />保存SMTP配置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-apple-blue" />
            WhatsApp API配置
          </CardTitle>
          <CardDescription>WhatsApp消息推送接口配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API密钥</Label>
              <Input
                type="password"
                value={whatsappApiKey}
                onChange={(e) => setWhatsappApiKey(e.target.value)}
                placeholder="WhatsApp API Key"
              />
            </div>
            <div className="space-y-2">
              <Label>API地址</Label>
              <Input
                value={whatsappApiUrl}
                onChange={(e) => setWhatsappApiUrl(e.target.value)}
                placeholder="https://api.whatsapp.com/v1/messages"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveKeys} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />保存WhatsApp配置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
