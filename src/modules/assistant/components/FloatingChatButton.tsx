import React, { useState, Suspense } from 'react';
import { Sparkles, MessageCircle, X } from 'lucide-react';

// Use React.lazy to split Chunk and achieve actual lazy-loading of ChatWindow!
const ChatWindowLazy = React.lazy(() => 
  import('./ChatWindow').then(module => ({ default: module.ChatWindow }))
);

interface FloatingChatButtonProps {
  orgId?: string;
  userRole?: string;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ orgId, userRole }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div id="ai-smart-bot-widget-container" className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 select-none">
      
      {/* 1. LAZY MOUNTED CHAT WINDOW PANEL */}
      {isOpen && (
        <div className="animate-fade-in origin-bottom-right transition-all">
          <Suspense fallback={
            <div className="w-[325px] h-[400px] md:w-[450px] md:h-[500px] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-2xl">
              <div className="w-10 h-10 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-4" />
              <p className="text-xs text-cyan-400 font-bold">جاري تحميل مساعد الذكاء الاصطناعي VIP...</p>
              <p className="text-[10px] text-slate-500 mt-1">تجهيز بيئة الاتصال السحابي المؤمن</p>
            </div>
          }>
            <ChatWindowLazy 
              orgId={orgId} 
              userRole={userRole} 
              onClose={() => setIsOpen(false)} 
            />
          </Suspense>
        </div>
      )}

      {/* 2. CHAT TRIGGER FLOATING BUTTON */}
      <button
        type="button"
        id="assistant-trigger-fab"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 scale-100 hover:scale-105 active:scale-95 cursor-pointer border ${
          isOpen 
            ? 'bg-slate-900 border-slate-800 text-cyan-400' 
            : 'bg-cyan-500 border-cyan-400 text-slate-950 hover:bg-cyan-400 hover:shadow-cyan-400/20'
        }`}
        title={isOpen ? 'إغلاق المساعد' : 'مساعد الذيباني VIP الذكي'}
      >
        {isOpen ? (
          <X className="w-5 h-5 md:w-6 md:h-6 animate-spin-once" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-5.5 h-5.5 md:w-6.5 md:h-6.5" />
            <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-fuchsia-600 absolute -top-1.5 -right-1.5 animate-bounce" />
          </div>
        )}
      </button>

    </div>
  );
};
