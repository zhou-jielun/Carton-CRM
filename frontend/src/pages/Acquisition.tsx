import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
  Database,
  FileText,
} from 'lucide-react';

export default function AcquisitionPage() {
  const [keywords, setKeywords] = useState('');
  const [maxPerKeyword, setMaxPerKeyword] = useState(10);
  const [aiScore, setAiScore] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [csvData, setCsvData] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<number | null>(null);

  const handleGoogleSearch = async () => {
    if (!keywords.trim()) return;
    setRunning(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/acquisition/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          keywords: keywords.split('\n').filter((k) => k.trim()),
          maxPerKeyword,
          aiScore,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || '搜索任务提交失败');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvData.trim()) return;
    setCsvImporting(true);
    setError('');

    try {
      const res = await fetch('/api/acquisition/import-customs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ csvData }),
      });
      const data = await res.json();
      if (data.success) {
        setCsvResult(data.data.imported);
      } else {
        setError(data.message || '导入失败');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-display text-apple-black">AI获客</h1>
        <p className="text-body text-apple-secondary mt-1">谷歌全网搜客、联系方式挖掘、海关数据智能解析</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-[10px] bg-apple-red/5 border border-apple-red/20 text-body text-apple-red">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Search Acquisition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-apple-blue" />
              AI谷歌全网获客
            </CardTitle>
            <CardDescription>
              输入产品关键词，AI自动搜索匹配的采购商和贸易公司
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>关键词（每行一个）</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-[10px] border border-apple-border bg-white px-4 py-3 text-body resize-none focus-visible:outline-none focus-visible:border-apple-blue transition-all duration-300"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={`packaging machinery buyer
carton box importer
packaging material distributor`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>每关键词结果数</Label>
                <Input
                  type="number"
                  value={maxPerKeyword}
                  onChange={(e) => setMaxPerKeyword(parseInt(e.target.value) || 10)}
                  min={5}
                  max={50}
                />
              </div>
              <div className="space-y-2">
                <Label>AI智能评分</Label>
                <div className="flex items-center h-10">
                  <button
                    className={`px-4 py-2 rounded-[10px] text-body font-medium transition-all ${aiScore ? 'bg-apple-blue text-white' : 'bg-[#F5F5F7] text-apple-secondary'}`}
                    onClick={() => setAiScore(true)}
                  >
                    开启
                  </button>
                  <button
                    className={`px-4 py-2 rounded-[10px] text-body font-medium transition-all ${!aiScore ? 'bg-apple-blue text-white' : 'bg-[#F5F5F7] text-apple-secondary'}`}
                    onClick={() => setAiScore(false)}
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={handleGoogleSearch} disabled={!keywords.trim() || running} className="w-full">
              {running ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />任务提交中...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />启动AI全网获客</>
              )}
            </Button>

            {result && (
              <div className="p-4 rounded-[10px] bg-[#34C759]/5 border border-[#34C759]/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                  <span className="text-body font-medium text-[#34C759]">任务已提交</span>
                </div>
                <p className="text-caption text-apple-secondary">
                  任务ID: {result.taskId} · 后台自动执行中，完成后将在客户库中展示
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customs Data Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-apple-blue" />
              海关数据智能解析
            </CardTitle>
            <CardDescription>
              粘贴CSV格式海关数据，AI自动分析采购商、采购频次和体量
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>CSV数据（含表头）</Label>
              <textarea
                className="flex min-h-[180px] w-full rounded-[10px] border border-apple-border bg-white px-4 py-3 text-body resize-none focus-visible:outline-none focus-visible:border-apple-blue transition-all duration-300"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder={`company,buyer,country,product,hs_code,frequency
Acme Corp,Acme,US,packaging machine,8441,12
Global Trade Ltd,Global,DE,carton box,4819,8`}
              />
            </div>

            <Button onClick={handleCsvImport} disabled={!csvData.trim() || csvImporting} className="w-full" variant="secondary">
              {csvImporting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />导入中...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />导入并分析海关数据</>
              )}
            </Button>

            {csvResult !== null && (
              <div className="p-4 rounded-[10px] bg-[#34C759]/5 border border-[#34C759]/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                  <span className="text-body font-medium text-[#34C759]">成功导入 {csvResult} 条客户记录</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[8px] bg-apple-blue/5">
                <Search className="w-4 h-4 text-apple-blue" />
              </div>
              <div>
                <h4 className="text-body font-medium text-apple-black mb-1">搜索技巧</h4>
                <p className="text-caption text-apple-secondary">使用"产品关键词 + buyer/importer/distributor"组合，如"packaging machinery buyer"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[8px] bg-[#34C759]/5">
                <Globe className="w-4 h-4 text-[#34C759]" />
              </div>
              <div>
                <h4 className="text-body font-medium text-apple-black mb-1">多国市场</h4>
                <p className="text-caption text-apple-secondary">添加国家限定词可精准定向市场，如"Germany packaging buyer"</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[8px] bg-[#FF9500]/5">
                <FileText className="w-4 h-4 text-[#FF9500]" />
              </div>
              <div>
                <h4 className="text-body font-medium text-apple-black mb-1">数据合规</h4>
                <p className="text-caption text-apple-secondary">请遵守目标网站robots.txt和当地数据法规，合理控制采集频次</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
