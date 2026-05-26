import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  Loader2,
  Search,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Globe,
  MapPin,
  Building2,
  Link,
  Mail,
  Phone,
  ExternalLink,
  RefreshCw,
  UserPlus,
} from 'lucide-react';

type Step = 1 | 2 | 3;

interface Lead {
  company: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  description: string;
  industry: string;
  confidence: 'high' | 'medium' | 'low';
}

interface KeywordsData {
  googleSearchTerms: string[];
  googleMapsQueries: string[];
  linkedinFilters: string;
  explanation: string;
}

const countries = [
  '俄罗斯', '西班牙', '越南', '巴西', '墨西哥', '印度',
  '土耳其', '阿联酋', '沙特', '印尼', '泰国', '马来西亚',
  '波兰', '埃及', '尼日利亚', '哥伦比亚', '智利', '秘鲁',
  '菲律宾', '乌克兰', '孟加拉国', '巴基斯坦', '伊朗', '伊拉克',
];

const SESSION_KEY = 'acquisition_state';

function saveToSession(
  step: Step,
  keywordsData: KeywordsData | null,
  rawText: string,
  leads: Lead[],
  selectedIds: Set<number>,
  targetCountry?: string,
  productCategory?: string,
  targetCustomerType?: string,
  additionalNotes?: string,
) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      step,
      targetCountry: targetCountry ?? '',
      productCategory: productCategory ?? '',
      targetCustomerType: targetCustomerType ?? '',
      additionalNotes: additionalNotes ?? '',
      keywordsData,
      rawText,
      leads,
      selectedIds: Array.from(selectedIds),
    }));
  } catch { /* ignore */ }
}

export default function AcquisitionPage() {
  const { toast } = useToast();

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Step 1: Input
  const [targetCountry, setTargetCountry] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [targetCustomerType, setTargetCustomerType] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Step 2: Generated keywords
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [keywordsData, setKeywordsData] = useState<KeywordsData | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Step 3: Paste results + analyze
  const [rawText, setRawText] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Import
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  // ---- sessionStorage persistence ----
  // Restore state on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
        if (parsed.targetCountry) setTargetCountry(parsed.targetCountry);
        if (parsed.productCategory) setProductCategory(parsed.productCategory);
        if (parsed.targetCustomerType) setTargetCustomerType(parsed.targetCustomerType);
        if (parsed.additionalNotes) setAdditionalNotes(parsed.additionalNotes);
        if (parsed.keywordsData) setKeywordsData(parsed.keywordsData);
        if (parsed.rawText) setRawText(parsed.rawText);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.selectedIds) setSelectedIds(new Set(parsed.selectedIds));
      }
    } catch { /* ignore parse errors */ }
  }, []);

  // Save state on changes
  useEffect(() => {
    const state = {
      step,
      targetCountry,
      productCategory,
      targetCustomerType,
      additionalNotes,
      keywordsData,
      rawText,
      leads,
      selectedIds: Array.from(selectedIds),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [step, targetCountry, productCategory, targetCustomerType, additionalNotes, keywordsData, rawText, leads, selectedIds]);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleGenerateKeywords = async () => {
    if (!targetCountry || !productCategory) {
      toast('error', '请填写目标国家和产品类别');
      return;
    }
    setKeywordsLoading(true);
    try {
      const res = await fetch('/api/ai-leads/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ targetCountry, productCategory, targetCustomerType, additionalNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setKeywordsData(data.data);
        setStep(2);
        // Save immediately for persistence across page switches
        saveToSession(2, data.data, rawText, leads, selectedIds, targetCountry, productCategory, targetCustomerType, additionalNotes);
      } else {
        toast('error', data.message || '生成关键词失败');
      }
    } catch {
      toast('error', '网络错误，请重试');
    } finally {
      setKeywordsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!rawText.trim() || rawText.trim().length < 10) {
      toast('error', '请先粘贴搜索结果文本');
      return;
    }
    setAnalyzeLoading(true);
    try {
      const res = await fetch('/api/ai-leads/analyze-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ rawText: rawText.trim(), targetCountry, productCategory }),
      });
      const data = await res.json();
      if (data.success) {
        const newLeads = data.data.leads as Lead[];
        const newSelected = new Set(newLeads.map((_: Lead, i: number) => i));
        setLeads(newLeads);
        setSelectedIds(newSelected);
        setStep(3);
        // Save immediately for persistence across page switches
        saveToSession(3, keywordsData, rawText, newLeads, newSelected, targetCountry, productCategory, targetCustomerType, additionalNotes);
      } else {
        toast('error', data.message || '分析失败');
      }
    } catch {
      toast('error', '网络错误，请重试');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      toast('error', '请至少选择一个客户');
      return;
    }
    setImporting(true);
    const selectedLeads = Array.from(selectedIds).map((i) => leads[i]);
    try {
      const res = await fetch('/api/ai-leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ leads: selectedLeads }),
      });
      const data = await res.json();
      if (data.success) {
        toast('success', `成功导入 ${data.data.imported} 个客户${data.data.skipped > 0 ? `，跳过 ${data.data.skipped} 个已存在` : ''}`);
        // Reset
        setStep(1);
        setKeywordsData(null);
        setRawText('');
        setLeads([]);
        setSelectedIds(new Set());
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        toast('error', data.message || '导入失败');
      }
    } catch {
      toast('error', '网络错误，请重试');
    } finally {
      setImporting(false);
    }
  };

  const inputClass = 'w-full h-10 px-3 rounded-[8px] border border-apple-border text-body text-apple-black bg-white placeholder:text-apple-tetriary focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all duration-300';
  const textareaClass = 'w-full px-3 py-2.5 rounded-[8px] border border-apple-border text-body text-apple-black bg-white placeholder:text-apple-tetriary focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all duration-300 resize-none';

  const confidenceConfig: Record<string, { bg: string; color: string; label: string }> = {
    high: { bg: '#E8F5E9', color: '#2E7D32', label: '高匹配' },
    medium: { bg: '#FFF3E0', color: '#E65100', label: '中匹配' },
    low: { bg: '#F5F5F5', color: '#757575', label: '低匹配' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold text-apple-black dark:text-white">AI 获客</h1>
        <p className="text-body text-apple-secondary mt-1">
          输入目标市场和产品 → AI 生成搜索关键词 → 你手动搜索并粘贴结果 → AI 分析提取客户 → 一键导入 CRM
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                step > s ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                step === s ? 'bg-apple-blue text-white shadow-sm' :
                'bg-apple-surface text-apple-tetriary'
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={`text-caption font-medium hidden sm:inline ${
              step >= s ? 'text-apple-black' : 'text-apple-tetriary'
            }`}>
              {s === 1 ? '输入需求' : s === 2 ? '生成关键词' : '分析导入'}
            </span>
            {s < 3 && <div className={`w-8 h-0.5 hidden sm:block ${step > s ? 'bg-[#E8F5E9]' : 'bg-apple-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Input */}
      {step === 1 && (
        <div className="bg-apple-card rounded-[16px] border border-apple-border p-6 space-y-5">
          <div className="flex items-center gap-2 text-apple-black">
            <Search className="w-5 h-5 text-apple-blue" />
            <h2 className="text-[18px] font-semibold">输入你的获客需求</h2>
          </div>
          <p className="text-caption text-apple-secondary -mt-3">
            AI 会分析你的需求，生成最优的本地化 Google 搜索关键词
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-caption font-medium text-apple-black mb-1.5">
                目标国家 <span className="text-apple-red">*</span>
              </label>
              <select
                className={inputClass}
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
              >
                <option value="">选择国家...</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-caption font-medium text-apple-black mb-1.5">
                产品类别 <span className="text-apple-red">*</span>
              </label>
              <input
                className={inputClass}
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                placeholder="例如：瓦楞纸箱机械、纸板生产线"
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-apple-black mb-1.5">客户类型</label>
              <select
                className={inputClass}
                value={targetCustomerType}
                onChange={(e) => setTargetCustomerType(e.target.value)}
              >
                <option value="">不限</option>
                <option value="终端客户（纸箱厂）">终端客户（纸箱厂）</option>
                <option value="经销商/代理商">经销商/代理商</option>
                <option value="二级纸板厂">二级纸板厂</option>
              </select>
            </div>
            <div>
              <label className="block text-caption font-medium text-apple-black mb-1.5">补充说明</label>
              <input
                className={inputClass}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="例如：年产值500万美金以上的中大型工厂"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerateKeywords}
              disabled={keywordsLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-body font-medium text-white bg-apple-blue hover:bg-[#0066CC] disabled:opacity-50 transition-all duration-300 rounded-[10px] shadow-sm"
            >
              {keywordsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {keywordsLoading ? 'AI 正在生成关键词...' : 'AI 生成搜索关键词'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Keywords */}
      {step === 2 && keywordsData && (
        <div className="space-y-4">
          {/* Strategy explanation */}
          <div className="bg-[#EDE7F6] dark:bg-[#311B92]/20 border border-[#D1C4E9] dark:border-[#4527A0]/30 rounded-[12px] p-4">
            <div className="flex items-center gap-2 text-[#4527A0] dark:text-[#B39DDB] mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-caption font-semibold">AI 搜索策略</span>
            </div>
            <p className="text-caption text-[#5E35B1] dark:text-[#CE93D8]">{keywordsData.explanation}</p>
          </div>

          {/* Google Search Keywords */}
          <div className="bg-apple-card rounded-[16px] border border-apple-border p-6 space-y-4">
            <div className="flex items-center gap-2 text-apple-black">
              <Search className="w-5 h-5 text-apple-blue" />
              <h3 className="text-[16px] font-semibold">Google 搜索关键词</h3>
            </div>
            <p className="text-caption text-apple-secondary -mt-3">
              复制关键词到 Google 搜索（建议用无痕窗口），搜索后将结果页的关键信息粘贴到第三步
            </p>
            <div className="space-y-2">
              {keywordsData.googleSearchTerms.map((term, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5 bg-apple-surface rounded-[8px] hover:bg-[#E8E8ED] transition-colors group"
                >
                  <span className="text-body text-apple-black font-medium">{term}</span>
                  <button
                    onClick={() => copyToClipboard(term, `search-${i}`)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-caption text-apple-blue hover:text-apple-blue/80 transition-all"
                  >
                    {copiedItem === `search-${i}` ? (
                      <><Check className="w-3.5 h-3.5" /> 已复制</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> 复制</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Google Maps Queries */}
          <div className="bg-apple-card rounded-[16px] border border-apple-border p-6 space-y-4">
            <div className="flex items-center gap-2 text-apple-black">
              <MapPin className="w-5 h-5 text-[#E65100]" />
              <h3 className="text-[16px] font-semibold">Google Maps 搜索词</h3>
            </div>
            <p className="text-caption text-apple-secondary -mt-3">
              在 Google Maps 中搜索这些词，可以直接找到工厂地址和联系方式
            </p>
            <div className="space-y-2">
              {keywordsData.googleMapsQueries.map((term, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5 bg-apple-surface rounded-[8px] hover:bg-[#E8E8ED] transition-colors group"
                >
                  <span className="text-body text-apple-black font-medium">{term}</span>
                  <button
                    onClick={() => copyToClipboard(term, `maps-${i}`)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-caption text-[#E65100] hover:text-[#E65100]/80 transition-all"
                  >
                    {copiedItem === `maps-${i}` ? (
                      <><Check className="w-3.5 h-3.5" /> 已复制</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> 复制</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* LinkedIn */}
          {keywordsData.linkedinFilters && (
            <div className="bg-apple-card rounded-[16px] border border-apple-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-apple-black">
                <Globe className="w-5 h-5 text-[#0A66C2]" />
                <h3 className="text-[16px] font-semibold">LinkedIn 搜索建议</h3>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-apple-surface rounded-[8px] group">
                <span className="text-body text-apple-black">{keywordsData.linkedinFilters}</span>
                <button
                  onClick={() => copyToClipboard(keywordsData.linkedinFilters, 'linkedin')}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-caption text-[#0A66C2] hover:text-[#0A66C2]/80 transition-all"
                >
                  {copiedItem === 'linkedin' ? (
                    <><Check className="w-3.5 h-3.5" /> 已复制</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> 复制</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-body text-apple-secondary hover:text-apple-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回修改
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2 text-body font-medium text-white bg-apple-blue hover:bg-[#0066CC] transition-all duration-300 rounded-[10px] shadow-sm"
            >
              已搜索完成，粘贴结果
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Paste & Analyze & Results */}
      {(step === 3 || (step === 2 && !keywordsData)) && (
        <div className="space-y-4">
          {/* Paste area (only if not yet analyzed) */}
          {leads.length === 0 && (
            <div className="bg-apple-card rounded-[16px] border border-apple-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-apple-blue text-white flex items-center justify-center text-sm font-semibold">3</span>
                <span className="text-[16px] font-semibold text-apple-black">
                  粘贴搜索结果 & AI 分析
                </span>
              </div>
              <p className="text-caption text-apple-secondary -mt-3 ml-10">
                复制 Google/Google Maps/LinkedIn 搜索结果中的关键信息（公司名、描述、联系方式等），粘贴到这里。<br />
                AI 会自动提取纸箱包装行业的真实客户。
              </p>

              <div className="ml-0">
                <textarea
                  className={textareaClass}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`粘贴你的搜索结果文本，例如：

"ABC Packaging Ltd. - www.abc-pack.ru - Corrugated box manufacturer in Moscow. Email: sales@abc-pack.ru
PackMaster Co. - Leading packaging solutions provider in Istanbul. www.packmaster.com.tr
..."
`}
                  rows={10}
                />
              </div>

              <div className="flex items-center gap-3 ml-10">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzeLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-body font-medium text-white bg-apple-blue hover:bg-[#0066CC] disabled:opacity-50 transition-all duration-300 rounded-[10px] shadow-sm"
                >
                  {analyzeLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {analyzeLoading ? 'AI 正在分析提取...' : 'AI 分析提取客户'}
                </button>
                <button
                  onClick={() => { setStep(2); setRawText(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-body text-apple-secondary hover:text-apple-black transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回
                </button>
              </div>
            </div>
          )}

          {/* Results table */}
          {leads.length > 0 && (
            <div className="space-y-4">
              {/* Results header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-semibold text-apple-black">
                    AI 提取到 {leads.length} 个潜在客户
                  </h3>
                  <p className="text-caption text-apple-secondary">勾选要导入的客户，然后点击「导入CRM」</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setLeads([]); setRawText(''); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-caption text-apple-secondary hover:text-apple-black transition-colors rounded-[8px]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重新分析
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-apple-card rounded-[16px] border border-apple-border overflow-hidden">
                {/* Select all bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-apple-border bg-apple-surface/50">
                  <label className="flex items-center gap-2 text-caption font-medium text-apple-secondary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === leads.length}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-apple-border text-apple-blue focus:ring-apple-blue/40"
                    />
                    {selectedIds.size === leads.length ? '取消全选' : `全选 (已选 ${selectedIds.size}/${leads.length})`}
                  </label>
                  <button
                    onClick={handleImport}
                    disabled={importing || selectedIds.size === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-caption font-medium text-white bg-apple-blue hover:bg-[#0066CC] disabled:opacity-50 transition-all duration-300 rounded-[8px]"
                  >
                    {importing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    {importing ? '导入中...' : `导入CRM (${selectedIds.size})`}
                  </button>
                </div>

                {/* Table body */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-apple-border bg-apple-surface/30">
                        <th className="w-10 px-4 py-2.5"></th>
                        <th className="text-left px-3 py-2.5 text-caption font-semibold text-apple-secondary">公司</th>
                        <th className="text-left px-3 py-2.5 text-caption font-semibold text-apple-secondary hidden sm:table-cell">行业</th>
                        <th className="text-left px-3 py-2.5 text-caption font-semibold text-apple-secondary hidden md:table-cell">网址</th>
                        <th className="text-left px-3 py-2.5 text-caption font-semibold text-apple-secondary hidden lg:table-cell">邮箱</th>
                        <th className="text-center px-3 py-2.5 text-caption font-semibold text-apple-secondary w-16">匹配度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => {
                        const conf = confidenceConfig[lead.confidence];
                        return (
                          <tr
                            key={i}
                            className={`border-b border-apple-border/50 hover:bg-apple-surface/50 transition-colors ${
                              selectedIds.has(i) ? 'bg-[#E3F2FD]/30' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(i)}
                                onChange={() => toggleSelect(i)}
                                className="w-4 h-4 rounded border-apple-border text-apple-blue focus:ring-apple-blue/40"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-start gap-2">
                                <Building2 className="w-4 h-4 text-apple-secondary mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-body font-medium text-apple-black">{lead.company}</div>
                                  <div className="text-caption text-apple-tetriary line-clamp-2 mt-0.5">{lead.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 hidden sm:table-cell">
                              <span className="text-caption text-apple-secondary">{lead.industry}</span>
                            </td>
                            <td className="px-3 py-3 hidden md:table-cell">
                              {lead.website ? (
                                <a
                                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-caption text-apple-blue hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link className="w-3 h-3" />
                                  {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 30)}
                                </a>
                              ) : (
                                <span className="text-caption text-apple-tetriary">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 hidden lg:table-cell">
                              {lead.email ? (
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="inline-flex items-center gap-1 text-caption text-apple-blue hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </a>
                              ) : lead.phone ? (
                                <span className="inline-flex items-center gap-1 text-caption text-apple-secondary">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </span>
                              ) : (
                                <span className="text-caption text-apple-tetriary">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium"
                                style={{ backgroundColor: conf.bg, color: conf.color }}
                              >
                                {conf.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Back button */}
              <button
                onClick={() => { setLeads([]); setRawText(''); setStep(2); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-body text-apple-secondary hover:text-apple-black transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回修改搜索
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
