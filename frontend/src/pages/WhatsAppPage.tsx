import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

export default function WhatsAppPage() {
  const [customerId, setCustomerId] = useState('');
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('en');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerate = async () => {
    if (!customerId) return;
    setGenerating(true);
    setError('');
    setGeneratedMessage('');

    try {
      const res = await fetch('/api/campaigns/whatsapp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ customerId, language }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedMessage(data.data.message);
        setMessage(data.data.message);
      } else {
        setError(data.message || '生成失败');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!customerId || !message) return;
    setSending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/campaigns/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ customerId, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('消息发送成功！');
      } else {
        setError(data.message || '发送失败');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-apple-black">WhatsApp消息</h1>
        <p className="text-body text-apple-secondary mt-1">AI消息生成、批量推送、对话管理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-apple-blue" />
              撰写消息
            </CardTitle>
            <CardDescription>AI自动生成商务洽谈消息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>客户ID</Label>
              <Input
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="输入客户ID"
              />
              <p className="text-caption text-apple-secondary">在"客户库"中可查看客户ID</p>
            </div>

            <div className="space-y-2">
              <Label>语言</Label>
              <select
                className="flex h-10 w-full rounded-[10px] border border-apple-border bg-white px-4 py-2 text-body"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ru">Русский</option>
                <option value="es">Español</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!customerId || generating}
              className="w-full"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI生成中...</>
              ) : (
                <><MessageSquare className="w-4 h-4 mr-2" />AI生成消息</>
              )}
            </Button>

            <div className="space-y-2">
              <Label>消息内容</Label>
              <textarea
                className="flex min-h-[160px] w-full rounded-[10px] border border-apple-border bg-white px-4 py-3 text-body resize-none focus-visible:outline-none focus-visible:border-apple-blue transition-all duration-300"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="AI生成的消息将显示在这里，您也可以手动编辑..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-apple-red/5 border border-apple-red/20 text-body text-apple-red">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#34C759]/5 border border-[#34C759]/20 text-body text-[#34C759]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={!message || sending}
              className="w-full"
              variant="primary"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />发送中...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />发送消息</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right: Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-apple-blue" />
              WhatsApp推送说明
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-[10px] bg-[#F5F5F7]">
              <h4 className="text-body font-medium text-apple-black mb-2">使用流程</h4>
              <ol className="space-y-2 text-body text-apple-secondary">
                <li>1. 在"系统设置"中配置WhatsApp API密钥</li>
                <li>2. 在"客户库"中确保客户有WhatsApp号码</li>
                <li>3. 输入客户ID，选择语言</li>
                <li>4. 点击"AI生成消息"自动创作</li>
                <li>5. 预览并编辑后点击发送</li>
              </ol>
            </div>

            <div className="p-4 rounded-[10px] bg-[#F5F5F7]">
              <h4 className="text-body font-medium text-apple-black mb-2">风控提示</h4>
              <ul className="space-y-1 text-body text-apple-secondary">
                <li>• 单日推送建议不超过50条</li>
                <li>• 消息间隔至少5秒</li>
                <li>• 避免发送含敏感词的内容</li>
                <li>• 尊重客户时区，避免非工作时间发送</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
