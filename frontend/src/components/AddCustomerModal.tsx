import { useState, useEffect } from 'react';
import { Loader2, X, Plus, Search, Check } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Contact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  position?: string;
  isPrimary: boolean;
}

interface CustomerData {
  id: string;
  company?: string;
  country?: string;
  industry?: string;
  size?: string;
  website?: string;
  score: number;
  status: string;
  customerType?: string | null;
  tags: string[];
  source?: string | null;
  contacts: Contact[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (customerId: string, company: string) => void;
  customer?: CustomerData | null;
}

const countries = ['俄罗斯', '西班牙', '越南', '巴西', '墨西哥', '印度', '土耳其', '阿联酋', '沙特', '印尼', '泰国', '马来西亚'];
const sources = [
  { value: 'google_search', label: '谷歌搜索' },
  { value: 'customs_data', label: '海关数据' },
  { value: 'exhibition', label: '展会' },
  { value: 'referral', label: '转介绍' },
  { value: 'other', label: '其他' },
];
const grades = ['A', 'B', 'C', 'D'];

interface FormData {
  company: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactPosition: string;
  customerType: string;
  source: string;
  grade: string;
  tags: string[];
}

const defaultForm: FormData = {
  company: '',
  country: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactWhatsapp: '',
  contactPosition: '',
  customerType: 'end_user',
  source: '',
  grade: 'B',
  tags: [],
};

export default function AddCustomerModal({ open, onClose, onSuccess, customer }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quickMode, setQuickMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);

  const isEdit = !!customer;

  useEffect(() => {
    if (open) {
      if (customer) {
        const contact = customer.contacts[0] || {};
        setForm({
          company: customer.company || '',
          country: customer.country || '',
          contactName: contact.name || '',
          contactEmail: contact.email || '',
          contactPhone: contact.phone || '',
          contactWhatsapp: contact.whatsapp || '',
          contactPosition: contact.position || '',
          customerType: customer.customerType || 'end_user',
          source: customer.source || '',
          grade: customer.score >= 80 ? 'A' : customer.score >= 60 ? 'B' : customer.score >= 40 ? 'C' : 'D',
          tags: customer.tags || [],
        });
      } else {
        setForm(defaultForm);
      }
      setErrors({});
      setQuickMode(false);
      setTagInput('');
      setCountrySearch('');
      setCountryOpen(false);
    }
  }, [open, customer]);

  const setField = (key: keyof FormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.company.trim()) e.company = '请输入公司名称';
    if (!form.country) e.country = '请选择国家/地区';
    if (!form.contactName.trim()) e.contactName = '请输入联系人姓名';
    if (!form.contactEmail.trim()) {
      e.contactEmail = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      e.contactEmail = '邮箱格式不正确';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        company: form.company.trim(),
        country: form.country,
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        contactWhatsapp: form.contactWhatsapp.trim() || undefined,
        contactPosition: form.contactPosition.trim() || undefined,
        tags: form.tags,
        customerType: form.customerType || null,
        source: form.source || null,
      };

      if (!isEdit) {
        body.score = form.grade === 'A' ? 85 : form.grade === 'B' ? 65 : form.grade === 'C' ? 45 : 25;
      }

      const url = isEdit ? `/api/customers/${customer!.id}` : '/api/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        const cid = data.customer?.id || customer?.id || '';
        const cname = data.customer?.company || form.company;
        onSuccess(cid, cname);
        onClose();
      } else {
        toast('error', data.message || '操作失败');
      }
    } catch {
      toast('error', '网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) { setTagInput(''); return; }
    setField('tags', [...form.tags, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => {
    setField('tags', form.tags.filter((x) => x !== t));
  };

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const inputClass = (field: string) =>
    `w-full h-10 px-3 rounded-[8px] border text-body text-apple-black bg-white placeholder:text-apple-tetriary focus:outline-none focus:ring-2 focus:ring-apple-blue/40 transition-all duration-300 ${
      errors[field] ? 'border-apple-red focus:ring-apple-red/40' : 'border-apple-border'
    }`;

  if (!open) return null;

  const fields = quickMode
    ? ['company', 'contactName', 'contactEmail', 'country']
    : ['company', 'country', 'contactName', 'contactEmail', 'contactPhone', 'contactWhatsapp', 'contactPosition', 'customerType', 'source', 'grade', 'tags'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-apple-card rounded-[16px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] w-[600px] max-h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-apple-border">
          <h2 className="text-[20px] font-semibold text-apple-black">
            {isEdit ? '编辑客户' : '新建客户'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-apple-secondary hover:text-apple-black hover:bg-apple-surface transition-all duration-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick mode toggle */}
        {!isEdit && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-apple-border bg-apple-surface/50">
            <span className="text-body text-apple-secondary">快速创建</span>
            <button
              onClick={() => setQuickMode(!quickMode)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                quickMode ? 'bg-apple-blue' : 'bg-apple-tetriary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                  quickMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {!quickMode || isEdit ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                {/* Company */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">
                    公司名称 <span className="text-apple-red">*</span>
                  </label>
                  <input
                    className={inputClass('company')}
                    value={form.company}
                    onChange={(e) => setField('company', e.target.value)}
                    placeholder="例如：PaperPack Co., Ltd."
                  />
                  {errors.company && <p className="text-[11px] text-apple-red mt-1">{errors.company}</p>}
                </div>

                {/* Contact Name */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">
                    联系人姓名 <span className="text-apple-red">*</span>
                  </label>
                  <input
                    className={inputClass('contactName')}
                    value={form.contactName}
                    onChange={(e) => setField('contactName', e.target.value)}
                    placeholder="例如：John Smith"
                  />
                  {errors.contactName && <p className="text-[11px] text-apple-red mt-1">{errors.contactName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">
                    邮箱 <span className="text-apple-red">*</span>
                  </label>
                  <input
                    className={inputClass('contactEmail')}
                    value={form.contactEmail}
                    onChange={(e) => setField('contactEmail', e.target.value)}
                    placeholder="john@paperpack.com"
                    type="email"
                  />
                  {errors.contactEmail && <p className="text-[11px] text-apple-red mt-1">{errors.contactEmail}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">电话</label>
                  <input
                    className={inputClass('contactPhone')}
                    value={form.contactPhone}
                    onChange={(e) => setField('contactPhone', e.target.value)}
                    placeholder="+7 999 123-45-67"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">WhatsApp</label>
                  <input
                    className={inputClass('contactWhatsapp')}
                    value={form.contactWhatsapp}
                    onChange={(e) => setField('contactWhatsapp', e.target.value)}
                    placeholder="+7 999 123-45-67"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Country */}
                <div className="relative">
                  <label className="block text-caption font-medium text-apple-black mb-1.5">
                    国家/地区 <span className="text-apple-red">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-apple-secondary pointer-events-none" />
                    <input
                      className={`${inputClass('country')} pl-9`}
                      value={countryOpen ? countrySearch : form.country}
                      onChange={(e) => {
                        setCountrySearch(e.target.value);
                        setCountryOpen(true);
                      }}
                      onFocus={() => {
                        setCountrySearch(form.country);
                        setCountryOpen(true);
                      }}
                      placeholder="搜索国家..."
                      readOnly={false}
                    />
                    {countryOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-apple-border rounded-[8px] shadow-apple-lg max-h-44 overflow-y-auto py-1">
                        {filteredCountries.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setField('country', c);
                              setCountrySearch('');
                              setCountryOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-body hover:bg-apple-surface transition-colors duration-200 ${
                              form.country === c ? 'text-apple-blue font-medium' : 'text-apple-black'
                            }`}
                          >
                            {c}
                            {form.country === c && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.country && <p className="text-[11px] text-apple-red mt-1">{errors.country}</p>}
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">客户类型</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'end_user', label: '终端用户' },
                      { value: 'distributor', label: '经销商' },
                      { value: 'other', label: '其他' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setField('customerType', opt.value)}
                        className={`px-3 py-1.5 rounded-full text-caption font-medium transition-all duration-300 ${
                          form.customerType === opt.value
                            ? 'bg-apple-blue text-white shadow-sm'
                            : 'bg-apple-surface text-apple-secondary hover:bg-[#E8E8ED]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">客户来源</label>
                  <select
                    className={inputClass('source')}
                    value={form.source}
                    onChange={(e) => setField('source', e.target.value)}
                  >
                    <option value="">选择来源</option>
                    {sources.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">客户等级</label>
                  <div className="flex gap-1.5">
                    {grades.map((g) => {
                      const colors: Record<string, string> = {
                        A: '#388E3C', B: '#1976D2', C: '#E65100', D: '#757575',
                      };
                      const bgs: Record<string, string> = {
                        A: '#E8F5E9', B: '#E3F2FD', C: '#FFF3E0', D: '#F5F5F5',
                      };
                      return (
                        <button
                          key={g}
                          onClick={() => setField('grade', g)}
                          className="w-9 h-9 rounded-full text-[13px] font-bold transition-all duration-300"
                          style={{
                            backgroundColor: form.grade === g ? bgs[g] : '#F5F5F7',
                            color: form.grade === g ? colors[g] : '#C7C7CC',
                            border: form.grade === g ? `2px solid ${colors[g]}` : '2px solid transparent',
                          }}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Position */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">联系人职位</label>
                  <input
                    className={inputClass('contactPosition')}
                    value={form.contactPosition}
                    onChange={(e) => setField('contactPosition', e.target.value)}
                    placeholder="采购经理"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-caption font-medium text-apple-black mb-1.5">标签</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption bg-apple-surface text-apple-secondary"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-apple-red transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className={inputClass('tags')}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="输入标签按回车添加"
                    />
                    <button
                      onClick={addTag}
                      className="w-10 h-10 flex items-center justify-center rounded-[8px] bg-apple-surface text-apple-secondary hover:bg-[#E8E8ED] hover:text-apple-black transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Quick mode: single column, 4 fields only */
            <div className="space-y-4">
              <div>
                <label className="block text-caption font-medium text-apple-black mb-1.5">
                  公司名称 <span className="text-apple-red">*</span>
                </label>
                <input
                  className={inputClass('company')}
                  value={form.company}
                  onChange={(e) => setField('company', e.target.value)}
                  placeholder="例如：PaperPack Co., Ltd."
                />
                {errors.company && <p className="text-[11px] text-apple-red mt-1">{errors.company}</p>}
              </div>
              <div>
                <label className="block text-caption font-medium text-apple-black mb-1.5">
                  联系人姓名 <span className="text-apple-red">*</span>
                </label>
                <input
                  className={inputClass('contactName')}
                  value={form.contactName}
                  onChange={(e) => setField('contactName', e.target.value)}
                  placeholder="例如：John Smith"
                />
                {errors.contactName && <p className="text-[11px] text-apple-red mt-1">{errors.contactName}</p>}
              </div>
              <div>
                <label className="block text-caption font-medium text-apple-black mb-1.5">
                  邮箱 <span className="text-apple-red">*</span>
                </label>
                <input
                  className={inputClass('contactEmail')}
                  value={form.contactEmail}
                  onChange={(e) => setField('contactEmail', e.target.value)}
                  placeholder="john@paperpack.com"
                  type="email"
                />
                {errors.contactEmail && <p className="text-[11px] text-apple-red mt-1">{errors.contactEmail}</p>}
              </div>
              <div className="relative">
                <label className="block text-caption font-medium text-apple-black mb-1.5">
                  国家/地区 <span className="text-apple-red">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-apple-secondary pointer-events-none" />
                  <input
                    className={`${inputClass('country')} pl-9`}
                    value={countryOpen ? countrySearch : form.country}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setCountryOpen(true);
                    }}
                    onFocus={() => {
                      setCountrySearch(form.country);
                      setCountryOpen(true);
                    }}
                    placeholder="搜索国家..."
                  />
                  {countryOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-apple-border rounded-[8px] shadow-apple-lg max-h-44 overflow-y-auto py-1">
                      {filteredCountries.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setField('country', c);
                            setCountrySearch('');
                            setCountryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-body hover:bg-apple-surface transition-colors duration-200 ${
                            form.country === c ? 'text-apple-blue font-medium' : 'text-apple-black'
                          }`}
                        >
                          {c}
                          {form.country === c && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.country && <p className="text-[11px] text-apple-red mt-1">{errors.country}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-apple-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-body font-medium text-apple-secondary hover:text-apple-black transition-colors duration-300 rounded-[8px]"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-body font-medium text-white bg-apple-blue hover:bg-[#0066CC] disabled:opacity-50 transition-all duration-300 rounded-[10px] shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEdit ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}
