import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Upload, Play, CheckCircle2, AlertTriangle, Loader2, 
  ChevronRight, Info, FileJson, Users, ShoppingBag, Boxes, 
  Layers, Settings2, Activity, XCircle, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DataMigrationProps {
  language?: 'AR' | 'EN';
}

export default function DataMigration({ language = 'AR' }: DataMigrationProps) {
  // Input settings
  const [orgId, setOrgId] = useState('org_vip_dhibani');
  const [branchId, setBranchId] = useState('branch_01');
  
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload and Analysis state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileStats, setFileStats] = useState<{ fileSize: number; tablesCount: number; tables: any[] } | null>(null);
  
  // Analysis pre-flight
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  
  // Mapped Preview state  
  const [activePreviewTab, setActivePreviewTab] = useState<'products' | 'categories' | 'customers' | 'orders'>('products');
  const [previewData, setPreviewData] = useState<any | null>(null);

  // Core Import Job Tracking State
  const [isImporting, setIsImporting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobStatus, setJobStatus] = useState<'pending' | 'processing' | 'success' | 'failed' | null>(null);
  const [jobInfo, setJobInfo] = useState<string>('');
  const [jobReport, setJobReport] = useState<any | null>(null);

  // Supabase live status diagnostics hook
  const [dbStatus, setDbStatus] = useState<{
    supabaseInitialized: boolean;
    supabaseResponseOk: boolean;
    tables: Record<string, string>;
    supabaseError?: string;
    details?: { supabaseUrl?: string };
  } | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<any>(null);

  const [isRollingBack, setIsRollingBack] = useState(false);

  const triggerRollback = async () => {
    if (!jobId) return;
    if (!window.confirm(language === 'AR' ? 'هل أنت متأكد من رغبتك في حذف كافة السجلات التي تم استيرادها في هذه العملية؟' : 'Are you sure you want to delete all imported records from this operation?')) {
      return;
    }
    
    setIsRollingBack(true);
    setUploadError(null);
    try {
      const response = await fetch('/api/import/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, operator: 'SUPER_ADMIN' })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'فشلت عملية التراجع.');
      }
      
      const resData = await response.json();
      // Fetch latest job report to reflect rolled_back status
      await fetchFinalReport(jobId);
    } catch (err: any) {
      setUploadError(err.message || 'خطأ أثناء التراجع عن عملية الاستيراد.');
    } finally {
      setIsRollingBack(false);
    }
  };

  // Status check logic
  const checkSupabaseConnectivity = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/diagnostics');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (e) {
      console.error('Failed to probe Supabase diagnostics:', e);
    } finally {
      setIsCheckingDb(false);
    }
  };

  // Cleanup and initial hooks
  useEffect(() => {
    checkSupabaseConnectivity();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Format File Size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.name.endsWith('.sqlite') || selectedFile.name.endsWith('.db')) {
        setFile(selectedFile);
        resetStates();
      } else {
        setUploadError('الملف المحدد ليس ملف قاعدة بيانات SQLite صالح. يجب أن ينتهي الملحق بـ .sqlite أو .db');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      resetStates();
    }
  };

  const resetStates = () => {
    setUploadError(null);
    setUploadSuccess(false);
    setFileStats(null);
    setAnalysisResult(null);
    setPreviewData(null);
    setJobId(null);
    setJobProgress(0);
    setJobStatus(null);
    setIsImporting(false);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  // Upload file pipeline
  const triggerUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      // 1. Create drafts storage bucket safely if not existing
      try {
        await supabase.storage.createBucket('backups', { public: true });
      } catch (bucketErr) {
        console.warn('Bucket backup creation ignored/already exists:', bucketErr);
      }

      // 2. Upload SQLite file directly to backups/ bucket in Supabase Storage
      const fileExt = file.name.split('.').pop() || 'sqlite';
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
      
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('backups')
        .upload(uniqueFileName, file, { cacheControl: '3600', upsert: true });

      if (uploadErr) {
        throw new Error(`تعذر رفع الملف إلى Supabase Storage: ${uploadErr.message}`);
      }

      // 3. Obtain the public URL
      const { data: urlData } = supabase.storage
        .from('backups')
        .getPublicUrl(uniqueFileName);

      const fileUrl = urlData?.publicUrl;
      if (!fileUrl) {
        throw new Error('فشل الحصول على الرابط العام للملف المرفوع.');
      }

      console.log('File uploaded to storage URL:', fileUrl);
      setUploadSuccess(true);

      // 4. Send layout context and start-from-storage background job to Backend
      setIsImporting(true);
      setJobStatus('pending');
      setJobProgress(0);
      setJobInfo('تم الرفع للـ Bucket. جاري إطلاق ترحيل وتحويل البيانات تلقائياً على السيرفر...');

      const response = await fetch('/api/import/start-from-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileUrl,
          orgId,
          branchId,
          operator: 'SUPER_ADMIN'
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'فشل تشغيل عملية الاستيراد من السيرفر.');
      }

      const resData = await response.json();
      setFileStats(resData.fileStats);
      setJobId(resData.jobId);
      
      // Start polling status in real-time
      startPolling(resData.jobId);

    } catch (err: any) {
      setUploadError(err.message || 'فشل الاتصال ميكانيكياً للخادم لرفع وبدء ترحيل السجلات.');
      setIsImporting(false);
      setJobStatus('failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Run Pre-flight analysis check
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: 'SYSTEM_ADMIN' })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'فشلت عملية تحليل الملف.');
      }

      const resData = await response.json();
      setAnalysisResult(resData);

      // Trigger automatic previews fetch
      fetchPreview();
    } catch (err: any) {
      setUploadError(err.message || 'خطأ فني أثناء تشغيل التحليلات المتقدمة.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch Mapped previews
  const fetchPreview = async () => {
    try {
      const response = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 })
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.preview);
      }
    } catch (err) {
      console.warn('Failed preview fetch:', err);
    }
  };

  // Start Background ETL migration
  const startMigration = async () => {
    setIsImporting(true);
    setJobStatus('pending');
    setJobProgress(0);
    setJobInfo('جاري إطلاق محرك ترحيل وتحويل البيانات المتقدم...');
    
    try {
      const response = await fetch('/api/import/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          branchId,
          operator: 'SUPER_ADMIN'
        })
      });

      if (!response.ok) {
        const errJs = await response.json();
        throw new Error(errJs.error || 'فشل إشعال محرك الخدمة.');
      }

      const resData = await response.json();
      setJobId(resData.jobId);
      
      // Start polling status
      startPolling(resData.jobId);
    } catch (err: any) {
      setJobStatus('failed');
      setJobInfo(`خطأ في تهيئة التشغيل: ${err.message}`);
      setIsImporting(false);
    }
  };

  const startPolling = (id: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/import/status/${id}`);
        if (!response.ok) return;

        const job = await response.json();
        setJobProgress(job.progress);
        setJobStatus(job.status);
        setJobInfo(job.info);

        if (job.status === 'success' || job.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setIsImporting(false);
          // Fetch final job report
          fetchFinalReport(id);
        }
      } catch (err) {
        console.warn('Polling status error:', err);
      }
    }, 1000);
  };

  const fetchFinalReport = async (id: string) => {
    try {
      const response = await fetch(`/api/import/report/${id}`);
      if (response.ok) {
        const report = await response.json();
        setJobReport(report);
      }
    } catch (err) {
      console.warn('Failed to fetch report:', err);
    }
  };

  return (
    <div className="p-6 text-slate-100 bg-slate-900 rounded-2xl border border-slate-800 space-y-8" id="sqlite-import-engine-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-cyan-400 flex items-center gap-2 font-sans tracking-tight">
            <Database className="w-7 h-7 animate-pulse" />
            محرك الاستيراد الذكي (Backup Import Engine)
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            محرك ETL آمن لاستخراج وتحويل وترحيل السجلات وقوائم المبيعات من قواعد البيانات القديمة (SQLite) التابعة للأنظمة المكتبية السابقة ودمجها مباشرة في بيئة فروع Smart Store VIP الحالية.
          </p>
        </div>
        
        {/* Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {dbStatus ? (
            <button 
              onClick={checkSupabaseConnectivity}
              disabled={isCheckingDb}
              className={`px-3 py-1 flex items-center gap-1.5 border rounded-full text-[10px] font-black transition-all ${
                dbStatus.supabaseResponseOk 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/20' 
                  : 'bg-rose-950/40 text-rose-400 border-rose-800 hover:bg-rose-900/20'
              }`}
              title="انقر لإعادة فحص الاتصال بقاعدة البيانات"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.supabaseResponseOk ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-ping'}`} />
              {dbStatus.supabaseResponseOk ? 'قناة Supabase نشطة ⚡' : 'وضع الاتصال المحلي المبرمج ⚠️'}
            </button>
          ) : (
            <span className="px-3 py-1 bg-slate-950/40 text-slate-400 border border-slate-805 rounded-full text-[10px] font-black flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
              جاري اختبار قناة سوبابيس...
            </span>
          )}
          <span className="px-3 py-1 bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 rounded-full text-[10px] font-black font-mono">
            V2.0 STABLE ENGINE
          </span>
          <span className="px-3 py-1 bg-teal-950/40 text-teal-400 border border-teal-800/50 rounded-full text-[10px] font-black">
            SUPER ADMIN AUTHORIZED
          </span>
        </div>
      </div>

      {/* Grid: Context & Upload Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Integration settings */}
        <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/40 space-y-5">
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Settings2 className="w-4 h-4 text-cyan-400" />
              تكوين معايير الأمان والهوية (Context Injector)
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  رقم هوية المنظمة الحالية (Organization UUID)
                </label>
                <input 
                  type="text" 
                  value={orgId} 
                  onChange={(e) => setOrgId(e.target.value)}
                  disabled={isImporting}
                  className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  رمز تعريف الفرع المستهدف (Branch Identifier)
                </label>
                <input 
                  type="text" 
                  value={branchId} 
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={isImporting}
                  className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="p-3 bg-cyan-950/10 border border-cyan-900/20 rounded-lg text-[10px] text-cyan-400/80 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  يقوم المحرك آلياً بحقن معرّفات الهوية هذه في كل المنتجات والعملاء والطلبيات الواردة، مما يحمي الخادم من أي تسريبات للمستأجرين المتعددين (Tenant Isolation Enforcement).
                </span>
              </div>
            </div>
          </div>

          {/* Database Diagnostics Checklist Panel */}
          <div className="pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              مطابقة قنوات الارتباط السحابية (Supabase Live Link)
            </h3>

            {dbStatus ? (
              <div className="space-y-2.5">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 font-bold">بوابة سوبابيس (Supabase Gateway)</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${dbStatus.supabaseInitialized ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-450'}`}>
                      {dbStatus.supabaseInitialized ? 'مُعدّة ومكتملة' : 'لم تُهجر بعد'}
                    </span>
                  </div>
                  <div className="text-[9.5px] text-slate-500 truncate font-mono">{dbStatus.details?.supabaseUrl}</div>
                </div>

                <div className="space-y-1.5 p-2 bg-slate-900/40 rounded-lg border border-slate-850">
                  <div className="text-[10px] text-slate-400 font-bold mb-1 px-1">سلامة فهارس الجداول السحابية:</div>
                  {Object.entries(dbStatus.tables || {}).map(([table, result]) => (
                    <div key={table} className="flex justify-between items-center text-[10px] py-0.5 px-1 font-mono">
                      <span className="text-slate-450">{table}</span>
                      <span className="font-bold text-slate-350">{result}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={checkSupabaseConnectivity}
                  disabled={isCheckingDb}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded text-[10px] font-black transition-all flex items-center justify-center gap-1"
                >
                  {isCheckingDb ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      جاري فحص سلامة الديجيتال...
                    </>
                  ) : (
                    'تحديث واختبار توافق البيانات السحابية 🔄'
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 text-center bg-slate-900/30 border border-slate-850 rounded-lg text-slate-500 text-[10px]">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-cyan-400" />
                جاري تتبع قنوات الإرسال وتأمين قواعد البيانات...
              </div>
            )}
          </div>
        </div>

        {/* Binary drag & drop area */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-slate-950/40 p-5 rounded-xl border border-slate-800 border-dashed">
          <div>
            <h2 className="text-sm font-black text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800 mb-4">
              <Upload className="w-4 h-4 text-cyan-400" />
              رفع وتحميل ملف قاعدة البيانات المحلية (Ingestion Area)
            </h2>

            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging 
                  ? 'border-cyan-500 bg-cyan-950/10' 
                  : file 
                    ? 'border-emerald-800 bg-emerald-950/5' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/60'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".sqlite,.db"
                className="hidden" 
              />
              
              <Database className={`w-12 h-12 mx-auto mb-3 transition-colors ${file ? 'text-emerald-500' : 'text-slate-600'}`} />
              
              {file ? (
                <div>
                  <h4 className="text-xs font-bold text-slate-100">{file.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{formatBytes(file.size)}</p>
                  <p className="text-[10px] text-emerald-400 font-bold mt-2">انقر أو اسحب لتعديل الملف المستهدف 🟢</p>
                </div>
              ) : (
                <div>
                  <h4 className="text-xs font-bold text-slate-300">قم بسحب وإفلات ملف SQLite القديم هنا</h4>
                  <p className="text-[10px] text-slate-500 mt-1">يدعم امتدادات الملفات .sqlite و .db المأخوذة من الكاش كنسخة احتياطية</p>
                  <button className="mt-4 px-4 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-[10px] font-black rounded-lg transition-all">
                    تصفح الملفات المحلية
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-800/50">
            {file && !uploadSuccess && (
              <button 
                onClick={triggerUpload}
                disabled={isUploading}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جاري رفع وتحليل بنية الملف...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    رفع وفهرسة الملف 🚀
                  </>
                )}
              </button>
            )}

            {uploadSuccess && fileStats && (
              <div className="w-full flex justify-between items-center bg-slate-900/60 p-2 px-3 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  تم رفع وتجهيز الملف بنجاح!
                </span>
                
                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      جاري فحص الجداول...
                    </span>
                  ) : 'بدء الفحص المعملي للملف (Pre-flight Scan)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Errors display box */}
      {uploadError && (
        <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-rose-400">فشل في استكمال عمليات التحليل ورفع الملف:</h4>
            <p className="text-[11px] text-slate-400 mt-1">{uploadError}</p>
          </div>
        </div>
      )}

      {/* File statistics metadata segment */}
      {fileStats && (
        <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold font-mono text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            جرد الهيكل الأصلي ومجموعات البيانات (Ingested SQLite Catalog)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/50">
              <span className="block text-[10px] text-slate-500 font-bold mb-1">حجم الملف</span>
              <span className="font-mono text-sm font-black text-cyan-400">{formatBytes(fileStats.fileSize)}</span>
            </div>
            <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/50">
              <span className="block text-[10px] text-slate-500 font-bold mb-1">عدد جداول البيانات</span>
              <span className="font-mono text-sm font-black text-cyan-400">{fileStats.tablesCount} جدولا</span>
            </div>
            {/* Display important table records directly if present */}
            {fileStats.tables.filter((t: any) => ['items', 'customers', 'bills', 'item_type', 'bill_transactions'].includes(t.name)).map((tbl: any) => (
              <div key={tbl.name} className="p-3 bg-slate-900/70 rounded-lg border border-slate-800/50">
                <span className="block text-[10px] text-slate-500 font-bold mb-0.5">سجلات جدول: `{tbl.name}`</span>
                <span className="font-mono text-xs font-bold text-slate-300">{tbl.rows} صفاً</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Result Box with Validation Report */}
      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-300 mb-3 pb-2 border-b border-slate-850">
                تقرير المراجعة والتكامل
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-900/90 rounded-lg flex items-center justify-between border border-slate-850">
                  <span className="text-[10.5px] text-slate-400 font-bold">فحص السلامة الهيكلية</span>
                  <span className="text-[10px] bg-emerald-950/40 text-emerald-400 px-2 py-0.5 border border-emerald-800/40 rounded-full font-black">
                    سليم وعامل 🟢
                  </span>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg flex items-center justify-between border border-slate-850">
                  <span className="text-[10.5px] text-slate-400 font-bold">الأخطاء الحرجة المكتشفة</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${analysisResult.validation.totalErrors > 0 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-950 text-slate-500'}`}>
                    {analysisResult.validation.totalErrors} صفوف
                  </span>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg flex items-center justify-between border border-slate-850">
                  <span className="text-[10.5px] text-slate-400 font-bold">تنبيهات مكررة ومفقودة</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${analysisResult.validation.totalWarnings > 0 ? 'bg-amber-950 text-amber-400 border border-amber-800 font-mono' : 'bg-slate-950 text-slate-500'}`}>
                    {analysisResult.validation.totalWarnings} تنبيهات
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={startMigration}
                disabled={isImporting || analysisResult.validation.totalErrors > 15}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40"
              >
                <Play className="w-4 h-4 shrink-0 fill-current" />
                تثبيت وإطلاق عملية ترحيل البيانات المجمّعة المباشرة 🚀
              </button>
              {analysisResult.validation.totalErrors > 15 && (
                <p className="text-[9.5px] text-rose-400 text-center mt-2 leading-relaxed font-bold">
                  ⚠️ لا يمكن الاستيراد التلقائي بسبب وجود أخطاء صياغة حرجة كبيرة. يرجى تصفية الملف محلياً أولاً.
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-950/30 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-300 mb-3 pb-2 border-b border-slate-850">
                سجل الملاحظات الأمنية وقوائم التحقق (Audits & Pre-Flight Warnings)
              </h3>
              
              <div className="max-h-[190px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {analysisResult.validation.errors.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 text-xs">
                    لم يتم العثور على أي مشاكل هيكلية أو تعارضات باركود! الملف متماسك وجاهز تماماً بنسبة 100%.
                  </div>
                ) : (
                  analysisResult.validation.errors.map((err: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-lg text-[11px] leading-relaxed flex items-start gap-2 border ${
                        err.severity === 'error' 
                          ? 'bg-rose-950/20 border-rose-900/30 text-rose-300' 
                          : 'bg-amber-950/10 border-amber-900/20 text-amber-300'
                      }`}
                    >
                      {err.severity === 'error' ? (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold underline">[{err.entity.toUpperCase()}]</span> {err.message}
                        {err.legacyId && <span className="text-[9.5px] font-mono text-slate-400 select-all block mt-0.5">legacy schema ref: #{err.legacyId}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mt-4 p-2.5 bg-slate-900/40 rounded-lg text-[9.5px] text-slate-400 leading-normal border border-slate-850">
              تنبيهات الترافق ومرجعية الباركود المكرر لا تمنع الاستيراد؛ سيقوم النظام تلقائياً بدمج المنتجات أو توليد باركودات عشوائية سليمة لتجنب تصادم قواعد البيانات.
            </div>
          </div>
        </div>
      )}

      {/* Grid: Preview transformed entities */}
      {previewData && (
        <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-300 flex items-center gap-2">
              <FileJson className="w-4 h-4 text-cyan-400" />
              معاينة عينات النقل وتعديل الصياغة (Transform mapping preview)
            </h3>
            
            {/* Tabs selector */}
            <div className="flex gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[10px]">
              {(['products', 'categories', 'customers', 'orders'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActivePreviewTab(tab)}
                  className={`px-3 py-1 rounded-md font-bold transition-all ${
                    activePreviewTab === tab ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'products' ? 'المنتجات' : tab === 'categories' ? 'الفئات' : tab === 'customers' ? 'العملاء' : 'الفواتير'}
                </button>
              ))}
            </div>
          </div>

          {/* Render samples */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {previewData[activePreviewTab] && previewData[activePreviewTab].length === 0 ? (
              <div className="text-center py-12 text-slate-550 text-xs">لا توجد سجلات متاحة للمعاينة في هذه الفئة.</div>
            ) : (
              previewData[activePreviewTab]?.map((item: any, index: number) => (
                <div key={index} className="p-3 bg-slate-900 rounded-lg border border-slate-850 text-xs flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1.5">
                    {/* Display based on entity type */}
                    {activePreviewTab === 'products' && (
                      <>
                        <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                          <Boxes className="w-4 h-4 text-cyan-500" />
                          {item.nameAR}
                        </div>
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>القسم: <strong className="text-slate-300">{item.category}</strong></span>
                          <span>السعر: <strong className="text-cyan-400 font-mono">{item.priceYER} YER</strong></span>
                          <span>المخزون القديم: <strong className="text-slate-300 font-mono">{item.stock} حبة</strong></span>
                          {item.barcode && <span>الباركود: <strong className="text-slate-300 font-mono">{item.barcode}</strong></span>}
                        </div>
                      </>
                    )}

                    {activePreviewTab === 'categories' && (
                      <>
                        <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-500" />
                          {item.nameAR}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          <span>الاسم الإنجليزي: <strong className="font-mono text-slate-300">{item.nameEN}</strong></span>
                        </div>
                      </>
                    )}

                    {activePreviewTab === 'customers' && (
                      <>
                        <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-500" />
                          {item.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-4">
                          <span>الهاتف: <strong className="text-slate-300 font-mono">{item.customerPhone || 'بدون رقم'}</strong></span>
                          {item.address && <span>العنوان: <strong className="text-slate-300">{item.address}</strong></span>}
                        </div>
                      </>
                    )}

                    {activePreviewTab === 'orders' && (
                      <>
                        <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-cyan-500" />
                          {item.order_number}
                        </div>
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>المبلغ الإجمالي: <strong className="text-cyan-400 font-mono">{item.total_yer} YER</strong></span>
                          <span>تاريخ الفاتورة: <strong className="text-slate-300 font-mono">{new Date(item.created_at).toLocaleDateString()}</strong></span>
                          <span>حالة الدفع: <strong className="text-emerald-400 font-black">{item.status}</strong></span>
                          <span>عدد البنود المترابطة: <strong className="text-cyan-300 font-mono">{item.items_json?.length || 0} بنود</strong></span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ID mapped tracking badge */}
                  <div className="flex flex-col items-start md:items-end justify-center shrink-0 border-t md:border-t-0 border-slate-800 md:pt-0 pt-2 font-mono">
                    <span className="text-[9px] text-slate-500 font-bold">المعرف القديم (ID)</span>
                    <span className="text-[10px] text-slate-400 font-bold">#{item.legacy_id || 'LOCAL-SIM'}</span>
                    <span className="text-[8px] text-slate-500 font-bold mt-1.5">المعرف الفريد الجديد (UUID)</span>
                    <span className="text-[9px] text-cyan-500 font-mono max-w-[140px] truncate select-all">{item.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Progress monitoring box */}
      {isImporting && (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-700 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="text-sm font-black text-slate-200 flex items-center gap-1.5">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              مراقبة عملية التحويل وحقن الفهارس (ETL Job In Progress...)
            </h3>
            <span className="text-xs text-cyan-400 font-mono font-black">{jobProgress}%</span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-3 select-none overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${jobProgress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>الحالة: <strong className="text-cyan-300">{jobInfo}</strong></span>
            <span className="font-mono text-[10px]">مهمة: <strong className="select-all block text-slate-500 uppercase">{jobId?.substring(0, 8)}...</strong></span>
          </div>
        </div>
      )}

      {/* Final Job Report Summary Dashboard */}
      {jobReport && (jobReport.status === 'success' || jobReport.status === 'rolled_back') && (
        <div className={`p-6 rounded-xl border space-y-4 ${
          jobReport.status === 'rolled_back'
            ? 'bg-rose-950/20 border-rose-900/30'
            : 'bg-gradient-to-br from-emerald-950/20 to-teal-950/10 border-emerald-900/30'
        }`}>
          <div className="flex items-center gap-3">
            {jobReport.status === 'rolled_back' ? (
              <XCircle className="w-8 h-8 text-rose-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            )}
            <div>
              <h2 className={`text-base font-black leading-snug ${jobReport.status === 'rolled_back' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {jobReport.status === 'rolled_back' 
                  ? 'تم التراجع عن عملية ترحيل قواعد البيانات!' 
                  : 'اكتملت عملية ترحيل قواعد البيانات بنجاح تام!'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {jobReport.status === 'rolled_back'
                  ? 'تم التراجع وسحب جميع السجلات المجدولة المدرجة وتنظيف قواعد البيانات بنجاح لمنع أي تداخل.'
                  : 'تم فك شفرة قاعدة البيانات القديمة، دمج الجداول، معالجة العلاقات، وحقن فهارس الأمان متعدد الموظفين بنجاح 100%.'}
              </p>
            </div>
          </div>

          {jobReport.status !== 'rolled_back' && jobReport.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-emerald-950/50">
              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-850/60">
                <span className="block text-[10px] text-slate-500 font-bold">الفئات المستوردة</span>
                <span className="font-mono text-lg font-black text-emerald-400">+{jobReport.summary.categories}</span>
              </div>
              
              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-850/60">
                <span className="block text-[10px] text-slate-500 font-bold">المنتجات المرحّلة</span>
                <span className="font-mono text-lg font-black text-emerald-400">+{jobReport.summary.products}</span>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-850/60">
                <span className="block text-[10px] text-slate-500 font-bold">ملفات العملاء المحدثة</span>
                <span className="font-mono text-lg font-black text-emerald-400">+{jobReport.summary.customers}</span>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-lg border border-slate-850/60">
                <span className="block text-[10px] text-slate-500 font-bold">الفواتير المدفوعة المحولة</span>
                <span className="font-mono text-lg font-black text-emerald-400">+{jobReport.summary.orders}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            {jobReport.status === 'success' && (
              <button
                onClick={triggerRollback}
                disabled={isRollingBack}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white border border-rose-700 font-black text-xs rounded-lg shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isRollingBack ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    جاري التراجع وسحب السجلات...
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-200" />
                    تراجع وسحب كافة البيانات المدرجة (Rollback) 🔴
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-black text-xs rounded-lg shadow"
            >
              إعادة تحميل لوحة التحكم لمشاهدة البيانات المستوردة 🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
