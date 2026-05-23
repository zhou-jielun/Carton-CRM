import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Loader2,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Send,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface Task {
  id: string;
  name: string;
  type: string;
  status: string;
  schedule?: string;
  config: any;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  taskLogs: TaskLog[];
}

interface TaskLog {
  id: string;
  status: string;
  message?: string;
  startedAt: string;
  completedAt?: string;
}

const typeLabels: Record<string, string> = {
  google_scrape: '谷歌获客',
  email_send: '邮件发送',
  whatsapp_send: 'WhatsApp推送',
  data_analysis: '数据分析',
  report: '自动报告',
  followup: '自动跟进',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  idle: { label: '待机', variant: 'secondary' },
  running: { label: '运行中', variant: 'default' },
  completed: { label: '已完成', variant: 'success' },
  failed: { label: '失败', variant: 'destructive' },
  paused: { label: '已暂停', variant: 'warning' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', type: 'google_scrape', config: '{}', schedule: '' });
  const [creating, setCreating] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [followUpResult, setFollowUpResult] = useState<any>(null);
  const [followUpRunning, setFollowUpRunning] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setTasks(data.data);
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
      let config = {};
      try { config = JSON.parse(newTask.config); } catch {}
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: newTask.name,
          type: newTask.type,
          schedule: newTask.schedule || undefined,
          config,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks([data.task, ...tasks]);
        setShowCreate(false);
        setNewTask({ name: '', type: 'google_scrape', config: '{}', schedule: '' });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRun = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) loadTasks();
    } catch {}
  };

  const handleToggle = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) loadTasks();
    } catch {}
  };

  const handleDelete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) loadTasks();
    } catch {}
  };

  const handleRunFollowUp = async () => {
    setFollowUpRunning(true);
    setFollowUpResult(null);
    try {
      const res = await fetch('/api/tasks/followup/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setFollowUpResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFollowUpRunning(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-apple-black">自动任务中心</h1>
          <p className="text-body text-apple-secondary mt-1">定时AI获客、周期发信、自动化跟进策略</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleRunFollowUp} disabled={followUpRunning}>
            {followUpRunning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />运行中</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />执行自动跟进</>
            )}
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />新建任务
          </Button>
        </div>
      </div>

      {followUpResult && (
        <div className="p-4 rounded-[10px] bg-[#34C759]/5 border border-[#34C759]/20 text-body text-[#34C759]">
          自动跟进完成：共 {followUpResult.total} 个待跟进客户，成功发送 {followUpResult.sent} 封，失败 {followUpResult.failed}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-[10px] bg-apple-red/5 border border-apple-red/20 text-body text-apple-red">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Create dialog */}
      {showCreate && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-heading">新建自动化任务</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>任务名称</Label>
                <Input
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="例如：每日谷歌获客"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>任务类型</Label>
                  <select
                    className="flex h-10 w-full rounded-[10px] border border-apple-border bg-white px-4 py-2 text-body"
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                  >
                    <option value="google_scrape">谷歌获客</option>
                    <option value="email_send">邮件发送</option>
                    <option value="whatsapp_send">WhatsApp推送</option>
                    <option value="data_analysis">数据分析</option>
                    <option value="report">自动报告</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Cron表达式（可选）</Label>
                  <Input
                    value={newTask.schedule}
                    onChange={(e) => setNewTask({ ...newTask, schedule: e.target.value })}
                    placeholder="0 9 * * 1 (每周一9点)"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>配置JSON</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-[10px] border border-apple-border bg-white px-4 py-3 text-body resize-none focus-visible:outline-none focus-visible:border-apple-blue transition-all duration-300"
                  value={newTask.config}
                  onChange={(e) => setNewTask({ ...newTask, config: e.target.value })}
                  placeholder='{"keywords": ["packaging buyer"], "maxPerKeyword": 10}'
                />
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

      {/* Task list */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Clock className="w-12 h-12 text-apple-secondary mb-4" />
            <p className="text-body text-apple-secondary mb-2">暂无自动任务</p>
            <p className="text-caption text-apple-secondary">创建定时任务实现全自动获客</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="animate-fade-in">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-[10px] ${task.status === 'running' ? 'bg-apple-blue/10' : 'bg-[#F5F5F7]'}`}>
                      <Clock className={`w-5 h-5 ${task.status === 'running' ? 'text-apple-blue animate-pulse' : 'text-apple-secondary'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-body font-medium text-apple-black">{task.name}</h3>
                        <Badge variant={statusLabels[task.status]?.variant || 'secondary'}>
                          {statusLabels[task.status]?.label || task.status}
                        </Badge>
                        <Badge variant="outline">{typeLabels[task.type] || task.type}</Badge>
                      </div>
                      <p className="text-caption text-apple-secondary">
                        {task.lastRunAt ? `上次运行: ${timeAgo(task.lastRunAt)}` : '尚未运行'}
                        {task.schedule && ` · 定时: ${task.schedule}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRun(task.id)}
                      disabled={task.status === 'running'}
                      title="立即运行"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggle(task.id)}
                      title={task.status === 'paused' ? '恢复' : '暂停'}
                    >
                      {task.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(task.id)}
                      className="text-apple-red hover:text-apple-red"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedTask === task.id ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Task logs */}
                {expandedTask === task.id && task.taskLogs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-apple-border/50 space-y-2">
                    {task.taskLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-[8px] bg-[#F5F5F7]">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${log.status === 'success' ? 'bg-[#34C759]' : log.status === 'failed' ? 'bg-apple-red' : 'bg-apple-blue'}`} />
                        <div className="flex-1">
                          <p className="text-caption text-apple-black">{log.message || 'No message'}</p>
                          <p className="text-caption text-apple-secondary mt-0.5">{timeAgo(log.startedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
