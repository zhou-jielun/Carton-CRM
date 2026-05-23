import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, X, CheckCircle2, AlertCircle, Table2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export default function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setResult(null);
    setImporting(false);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSet(f);
  };

  const validateAndSet = (f: File) => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!['.json', '.xlsx', '.xls'].includes(ext)) {
      toast('error', '仅支持 .json / .xlsx / .xls 文件');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast('error', '文件大小不能超过 10MB');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/customers/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        toast('success', `成功导入 ${data.imported} 条客户数据`);
      } else {
        toast('error', data.message || '导入失败');
      }
    } catch (err: any) {
      toast('error', err.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 animate-fade-in">
        <div className="bg-apple-card rounded-[12px] border border-apple-border/50 shadow-apple-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-heading text-apple-black">导入客户数据</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-apple-background transition-colors">
              <X className="w-5 h-5 text-apple-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4">
            {result ? (
              /* Result view */
              <div className="space-y-4">
                <div className={`p-4 rounded-[10px] flex items-start gap-3 ${
                  result.imported > 0
                    ? 'bg-[#34C759]/5 border border-[#34C759]/20'
                    : 'bg-apple-orange/5 border border-apple-orange/20'
                }`}>
                  {result.imported > 0
                    ? <CheckCircle2 className="w-5 h-5 text-apple-green mt-0.5 shrink-0" />
                    : <AlertCircle className="w-5 h-5 text-apple-orange mt-0.5 shrink-0" />
                  }
                  <div className="text-body">
                    <p className={result.imported > 0 ? 'text-apple-green' : 'text-apple-orange'}>
                      导入完成
                    </p>
                    <p className="text-apple-secondary mt-1">
                      成功 {result.imported} 条{result.skipped > 0 ? `，跳过 ${result.skipped} 条（已存在或无数据）` : ''}
                    </p>
                    <p className="text-caption text-apple-secondary mt-0.5">共处理 {result.total} 条记录</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => { reset(); onClose(); }}>
                    关闭
                  </Button>
                  <Button className="flex-1" onClick={reset}>
                    继续导入
                  </Button>
                </div>
              </div>
            ) : (
              /* Upload area */
              <div className="space-y-4">
                {!file ? (
                  <div
                    className={`border-2 border-dashed rounded-[10px] p-10 text-center cursor-pointer transition-all duration-300 ${
                      dragging
                        ? 'border-apple-blue bg-apple-blue/5'
                        : 'border-apple-border hover:border-apple-blue/50 hover:bg-apple-background'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-apple-secondary mx-auto mb-3" />
                    <p className="text-body text-apple-black mb-1">拖拽文件到此处，或点击上传</p>
                    <p className="text-caption text-apple-secondary">支持 JSON / Excel (.xlsx / .xls) 格式</p>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".json,.xlsx,.xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-[10px] bg-apple-background">
                    {file.name.endsWith('.json')
                      ? <FileText className="w-8 h-8 text-apple-blue" />
                      : <Table2 className="w-8 h-8 text-apple-green" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-apple-black truncate">{file.name}</p>
                      <p className="text-caption text-apple-secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="p-1 rounded-full hover:bg-apple-card transition-colors"
                    >
                      <X className="w-4 h-4 text-apple-secondary" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={onClose}>
                    取消
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!file || importing}
                    onClick={handleImport}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        导入中...
                      </>
                    ) : (
                      '开始导入'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
