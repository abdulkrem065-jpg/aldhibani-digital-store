import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
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
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚠️</span>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">رصد خطأ غير متوقع | Runtime Exception Caught</h1>
            </div>
            
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              توقف واجهة المستخدم مؤقتاً بسبب استجابة غير معالجة أو تعارض في هيكل الصفحة (مثل ترجمة Google Chrome التلقائية لرموز المكونات). تم تسجيل تفاصيل الخطأ بدقة في لوحة وحدة التحكم لأغراض التشخيص والمطابقة التقنية.
            </p>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-red-400 overflow-auto max-h-60 mb-6 whitespace-pre-wrap select-all">
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
