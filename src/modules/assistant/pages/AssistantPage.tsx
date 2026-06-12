import React, { useState } from 'react';
import { ChatWindow } from '../components/ChatWindow';
import { Sparkles, BarChart2, ShieldAlert, Cpu, Heart, CheckCircle2 } from 'lucide-react';

interface AssistantPageProps {
  orgId?: string;
  userRole?: string;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ orgId = 'DEFAULT_VIP', userRole = 'ADMIN' }) => {
  const [latency] = useState<number>(145);
  const [tokens] = useState<number>(3124);

  return (
    <div id="smart-assistant-page" className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        
        {/* TOP WELCOME BAR */}
        <div className="bg-slate-900/30 border border-slate-800/60 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 text-right md:order-2">
            <h1 className="text-xl md:text-2xl font-black text-cyan-400 flex items-center gap-2 justify-end">
              <span>لوحة التجربة والمساعد الذكي السحابي</span>
              <Sparkles className="w-5 h-5 text-fuchsia-400" />
            </h1>
            <p className="text-xs text-slate-400">
              مساعد أعمال مدعم بالجيل القادم من نماذج Gemini لـ هايبر الذيباني VIP
            </p>
          </div>
          
          <div className="flex gap-2.5 flex-wrap md:order-1">
            <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850 flex items-center gap-2 text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-slate-400 font-medium">سحابي متصِّل</span>
            </div>
            <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850 flex items-center gap-2 text-xs">
              <span className="text-cyan-400 font-mono font-bold">{latency}ms</span>
              <span className="text-slate-500">زمن الاستجابة</span>
            </div>
            <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-850 flex items-center gap-2 text-xs">
              <span className="text-fuchsia-400 font-mono font-bold">100%</span>
              <span className="text-slate-500">دقة العزل السحابي</span>
            </div>
          </div>
        </div>

        {/* WORKSPACE DUAL GRID */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[550px] md:min-h-[620px]">
          
          {/* LEFT SIDEBAR: INTELLIGENCE TELEMETRY */}
          <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
            
            {/* 1. STATUS & CAPABILITIES */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-4 text-right">
              <h3 className="text-sm font-extrabold text-cyan-400 border-b border-slate-850 pb-2 flex items-center justify-end gap-1.5">
                <span>الصلاحيات وحالة الاتصال البيئية</span>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-900">
                  <span className="bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded text-[10px]">
                    {userRole}
                  </span>
                  <span className="text-slate-400">مستوى صلاحيات الحساب</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-900">
                  <span className="bg-cyan-950/50 text-cyan-400 px-2.5 py-0.5 rounded text-[10px] font-mono border border-cyan-800/30">
                    {orgId}
                  </span>
                  <span className="text-slate-400">تنظيم المؤسسة النشط</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-900">
                  <span className="text-slate-200 font-bold">ريد-أونلي (سياقي آمن)</span>
                  <span className="text-slate-400">قواعد حماية قاعدة البيانات</span>
                </div>
              </div>
            </div>

            {/* 2. CHAT USECASES */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-4 text-right flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-fuchsia-400 border-b border-slate-850 pb-2 flex items-center justify-end gap-1.5">
                  <span>تطبيقات المساعد في شؤون الأعمال</span>
                  <BarChart2 className="w-4 h-4 text-fuchsia-400" />
                </h3>
                
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  يتكامل المساعد مع سحابة متجر الذيباني ليحلل الأصناف وجدول المبيعات والذمم. تفضل بتجربة الأسئلة الحية التالية في الشات المساعد:
                </p>

                <div className="space-y-2 mt-4 text-xs font-medium">
                  <div className="flex items-center gap-2 justify-end text-slate-300 bg-slate-950/30 hover:bg-slate-950/80 p-2 rounded-xl transition-all border border-slate-900">
                    <span>"أريد الاطلاع على قائمة النقص بالمستودع"</span>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 justify-end text-slate-300 bg-slate-950/30 hover:bg-slate-950/80 p-2 rounded-xl transition-all border border-slate-900">
                    <span>"كم تبلغ ديون العملاء الإجمالية؟"</span>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 justify-end text-slate-300 bg-slate-950/30 hover:bg-slate-950/80 p-2 rounded-xl transition-all border border-slate-900">
                    <span>"تفاصيل باقات شبكة يمن موبايل وأسعارها"</span>
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* SECURITY DIRECTIVE ALERTS */}
              <div className="bg-rose-950/30 border border-rose-900/30 p-3 rounded-xl flex gap-2.5 items-start mt-4 text-right">
                <div className="flex-1 text-[11px] text-rose-300 leading-relaxed">
                  <span className="font-extrabold block text-rose-200 mb-0.5">ضوابط العزل السحابي (Multi-Tenant isolation)</span>
                  بصفتك مستخدماً مسجلاً، ذكاء المساعد معزول ومخصّص لك ولفرعك فقط. لا يمكن للذكاء الاصطناعي كشف مبيعات أي مؤسسة أو فرع آخر بالفرونت أند.
                </div>
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              </div>
            </div>

            {/* 3. SIGNATURE */}
            <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <span>تطوير الذيباني VIP مع مهندسي الذكاء الاصطناعي</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </div>

          </div>

          {/* RIGHT VIEWPORT: FULL FRAME CHAT */}
          <div className="lg:col-span-8 flex flex-col order-1 lg:order-2">
            <ChatWindow 
              embedded={true} 
              orgId={orgId} 
              userRole={userRole} 
            />
          </div>

        </div>

      </div>
    </div>
  );
};
