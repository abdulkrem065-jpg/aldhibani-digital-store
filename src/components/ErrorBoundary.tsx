import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isLoadingAI: boolean;
  aiResponse: {
    explanation: string;
    rootCause: string;
    patch: string;
  } | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isLoadingAI: false,
    aiResponse: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, isLoadingAI: false, aiResponse: null };
  }

  private async fetchAIAnalysis(error: Error) {
    this.setState({ isLoadingAI: true });
    try {
      const res = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            code: (error as any).code || (error as any).status || 'REACT_CRASH'
          },
          context: 'React Real-Time ErrorBoundary Crash Interceptor'
        })
      });
      if (res.ok) {
        const data = await res.json();
        this.setState({ aiResponse: data });
      }
    } catch (e) {
      console.warn("[ErrorBoundary] Could not load AI analysis: ", e);
    } finally {
      this.setState({ isLoadingAI: false });
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("=== GLOBAL REACT ERROR BOUNDARY METADATA ===");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("Component Stack Info:", errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Asynchronously call backend AI diagnostics engine
    this.fetchAIAnalysis(error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-2xl w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚠️</span>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">رصد خطأ غير متوقع | Runtime Exception Caught</h1>
            </div>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              توقف واجهة المستخدم مؤقتاً بسبب استجابة غير معالجة أو تعارض في هيكل الصفحة (مثل ترجمة Google Chrome التلقائية لرموز المكونات). تم تسجيل تفاصيل الخطأ بدقة في لوحة وحدة التحكم لأغراض التشخيص والمطابقة التقنية.
            </p>

            {/* AI Debugging Analytics Engine Block */}
            <div className="mb-6 border border-amber-500/20 bg-amber-500/5 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">حالة التشخيص الذكي | Central AI Analysis Report</span>
                </div>
                {this.state.isLoadingAI && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 font-mono px-2 py-0.5 rounded animate-pulse">
                    Generating Patch...
                  </span>
                )}
              </div>

              {this.state.isLoadingAI && !this.state.aiResponse && (
                <div className="text-xs text-slate-400 flex items-center gap-2 py-2">
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>يرجى الانتظار، يقوم نظام الذكاء الاصطناعي الآن بتحليل أسباب الخطأ وإنتاج باتش برمجية تلقائية...</span>
                </div>
              )}

              {!this.state.isLoadingAI && !this.state.aiResponse && (
                <div className="text-xs text-slate-500 italic">
                  Could not retrieve automated AI advice. Ensure backend server is responsive.
                </div>
              )}

              {this.state.aiResponse && (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-200 mb-1 flex items-center gap-1">
                      <span>📌</span> الشرح المبسط | Explanation:
                    </h4>
                    <p className="text-slate-300 font-sans leading-relaxed pl-5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                      {this.state.aiResponse.explanation}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-amber-400 mb-1 flex items-center gap-1">
                      <span>🕵️‍♂️</span> السبب الجذري | Root Cause:
                    </h4>
                    <p className="text-slate-300 font-mono leading-relaxed pl-5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 select-all">
                      {this.state.aiResponse.rootCause}
                    </p>
                  </div>

                  {this.state.aiResponse.patch && (
                    <div>
                      <h4 className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                        <span>🛠️</span> الحل المقترح | Suggested Correction:
                      </h4>
                      <pre className="text-emerald-300 font-mono text-[11px] leading-relaxed pl-5 bg-slate-950 p-3 rounded-lg border border-emerald-950 overflow-auto max-h-48 whitespace-pre select-all">
                        {this.state.aiResponse.patch}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-red-400 overflow-auto max-h-48 mb-6 whitespace-pre-wrap select-all">
              <div className="font-bold border-b border-slate-800 pb-2 mb-2 text-slate-500">
                Exception Stack Trace:
              </div>
              {this.state.error?.stack || this.state.error?.toString()}
              {this.state.errorInfo?.componentStack && (
                <div className="mt-4 text-slate-500 border-t border-slate-800 pt-2">
                  <div className="font-bold mb-1">Component Stack:</div>
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                id="reload-page-btn"
                onClick={() => window.location.reload()}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                إعادة تحميل الصفحة | Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
