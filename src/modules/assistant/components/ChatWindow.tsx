import React, { useState, useRef, useEffect } from 'react';
import { useAssistant } from '../hooks/useAssistant';
import { AssistantMode } from '../types/assistant.types';
import { Sparkles, Trash2, Send, Bot, User, ThumbsUp, ThumbsDown, Star, X, Check } from 'lucide-react';

interface ChatWindowProps {
  onClose?: () => void;
  orgId?: string;
  userRole?: string;
  embedded?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  onClose, 
  orgId = 'DEFAULT_VIP', 
  userRole = 'GUEST',
  embedded = false 
}) => {
  const {
    mode,
    messages,
    loading,
    error,
    setMode,
    sendMessage,
    submitFeedback,
    clearSession
  } = useAssistant();

  const [input, setInput] = useState<string>('');
  const [feedbackMsgId, setFeedbackMsgId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages list size changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const promptText = textToSend || input;
    if (!promptText.trim() || loading) return;

    if (!textToSend) {
      setInput('');
    }
    await sendMessage(promptText, userRole, orgId);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackMsgId) return;
    const success = await submitFeedback(rating, feedbackComment, orgId);
    if (success) {
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setFeedbackMsgId(null);
        setFeedbackSubmitted(false);
        setFeedbackComment('');
        setRating(5);
      }, 1800);
    }
  };

  // Suggestion pills depending on user role
  const getSuggestionPills = () => {
    const commonPills = [
      { text: 'باقات يمن موبايل', icon: '📱' },
      { text: 'أسعار شدات ببجي', icon: '🎮' },
      { text: 'عسل سدر دوعني', icon: '🍯' }
    ];

    const managementPills = [
      { text: 'ملخص مبيعات المتجر اليوم', icon: '📊' },
      { text: 'ما هي الكميات الناقصة بالمخزون؟', icon: '⚠️' },
      { text: 'من هم أكثر العملاء مديونية؟', icon: '💸' },
      { text: 'الوضع المالي الموحد للمؤسسة', icon: '🏦' }
    ];

    if (userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'MANAGER') {
      return [...commonPills, ...managementPills];
    }
    return commonPills;
  };

  // Custom JSX rich-text formatter to render headers, bold, linebreaks, and bullets 100% safely online
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // 1. Headers Check
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-cyan-400 mt-3 mb-1.5 border-b border-slate-800 pb-1 font-sans">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} className="text-xs font-semibold text-fuchsia-400 mt-2 mb-1 font-sans">
            {line.replace('#### ', '')}
          </h5>
        );
      }

      // 2. Bullet list line check
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const lineContent = line.replace(/^[\s]*[-*]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-1 pb-1 text-slate-200">
            <span className="text-cyan-500 mt-1 select-none text-[10px]">●</span>
            <span className="flex-1">{parseBoldText(lineContent)}</span>
          </div>
        );
      }

      // 3. Regular lines, parse bold tags
      return (
        <p key={idx} className="min-h-[1rem] leading-relaxed text-slate-200 mb-1.5 text-xs md:text-sm">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Internal helper to parse **bold text** securely
  const parseBoldText = (str: string) => {
    const parts = str.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-extrabold bg-slate-900/40 px-1 rounded border border-slate-800">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div 
      id="assistant-chat-panel" 
      className={`flex flex-col bg-slate-950 text-slate-100 ${
        embedded ? 'w-full h-full' : 'w-full md:w-[480px] h-[600px] md:h-[650px] rounded-2xl shadow-2xl border border-slate-800'
      } overflow-hidden font-sans`}
    >
      {/* 1. CHAT HEADER with localized indicators */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 px-4 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/50 border border-cyan-800/30 flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="font-extrabold text-xs md:text-sm text-cyan-400 flex items-center gap-1.5">
              <span>مساعد الذيباني VIP الذكي</span>
              <span className="text-[9px] bg-cyan-950/80 text-cyan-400 px-1.5 py-0.5 rounded-full border border-cyan-800/20 uppercase tracking-widest font-mono">V1</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>سحابة سياقية منعزلة</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            title="تفريغ المحادثة"
            onClick={clearSession}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MODE SELECTOR HEADER (GENERAL, BUSINESS, SUPPORT, ADMIN) */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-2 py-1.5 flex gap-1 justify-around text-[10px] font-bold overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setMode('GENERAL')}
          className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 shrink-0 ${
            mode === 'GENERAL' ? 'bg-cyan-500/25 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <span>🌐</span>
          <span>مساعد عام</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('BUSINESS')}
          className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 shrink-0 ${
            mode === 'BUSINESS' ? 'bg-purple-500/25 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <span>💼</span>
          <span>نمط الأعمال</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('SUPPORT')}
          className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 shrink-0 ${
            mode === 'SUPPORT' ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <span>💬</span>
          <span>الدعم الفني</span>
        </button>

        {(userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'MANAGER') && (
          <button
            type="button"
            onClick={() => setMode('ADMIN')}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 shrink-0 ${
              mode === 'ADMIN' ? 'bg-rose-500/25 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>🛡️</span>
            <span>النمط التنفيذي</span>
          </button>
        )}
      </div>

      {/* 3. CONVERSATION VIEWPORT */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 custom-scrollbar min-h-0 bg-slate-[950]">
        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="text-center py-2 px-4 rounded-xl bg-slate-900/40 border border-slate-800/40 text-[10px] text-cyan-400 max-w-[90%] mx-auto font-medium leading-relaxed font-sans select-none">
                {msg.content}
              </div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/30 flex items-center justify-center shrink-0 mt-1 select-none">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              <div className="max-w-[82%] flex flex-col">
                <div className={`p-3 rounded-2xl text-right leading-relaxed ${
                  isUser 
                    ? 'bg-gradient-to-b from-cyan-600 to-cyan-700 text-white rounded-tr-sm shadow-md' 
                    : 'bg-slate-900 border border-slate-850 text-slate-100 rounded-tl-sm shadow-sm'
                }`}>
                  {isUser ? (
                    <p className="text-xs md:text-sm font-medium">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderFormattedText(msg.content)}
                    </div>
                  )}

                  {/* Operational indicators */}
                  {!isUser && msg.modeUsed && (
                    <div className="mt-2 pt-1 border-t border-slate-800/50 flex items-center justify-between select-none">
                      <span className="text-[8px] tracking-wider text-slate-400 uppercase font-mono font-bold">
                        {msg.modeUsed === 'GEMINI' ? '✨ GEMINI AI 3.5' : '🛡️ OFFLINE SYSTEM'}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Micro satisfaction feedback mechanism */}
                {!isUser && !msg.isPending && (
                  <div className="flex items-center gap-2 mt-1 px-1 justify-start">
                    <button 
                      type="button"
                      onClick={() => setFeedbackMsgId(msg.id)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                      title="تقييم الإجابة"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFeedbackMsgId(msg.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="تقرير عن خطأ"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1 select-none">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 4. FEEDBACK DIALOG (POPUP OVER CHAT) */}
      {feedbackMsgId && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl w-full max-w-sm shadow-2xl relative text-right">
            <button 
              type="button"
              onClick={() => setFeedbackMsgId(null)}
              className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {feedbackSubmitted ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-500/25 flex items-center justify-center text-green-400 animate-bounce">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-white">نشكرك للتقييم والملاحظة!</h4>
                <p className="text-xs text-slate-400">تساعدنا تقييماتك في صياغة ذكاء اصطناعي أدق للأعمال.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs">
                  <Star className="w-4 h-4 shrink-0 fill-cyan-400/20" />
                  <span>تقييم جودة الرد للذكاء الاصطناعي</span>
                </div>
                
                <p className="text-xs text-slate-300 font-medium">ما مدى دقة وموثوقية الإجابة التي صاغها المساعد؟</p>

                {/* Stars select */}
                <div className="flex items-center gap-1.5 justify-center py-2 flex-row-reverse">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">تعليق أو ملاحظة تحسين (اختياري)</label>
                  <textarea
                    rows={2}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="مثال: الخدمة رصيد يمن موبايل ممتازة، ولكن يرجى تحديث أسعار الصرف..."
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleFeedbackSubmit}
                  className="w-full text-xs font-black bg-cyan-500 text-slate-950 py-2.5 rounded-xl hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 transition-all font-sans"
                >
                  حفظ وإرسال التقييم السري
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. SUGGESTION PILLS AND CHAT BOX INPUT */}
      <div className="border-t border-slate-900 bg-slate-900/30 p-3 shrink-0 space-y-2.5">
        
        {/* Horizontal scroll suggestion pills */}
        <div className="flex gap-1.5 overflow-x-auto justify-start py-0.5 whitespace-nowrap scrollbar-none select-none">
          {getSuggestionPills().map((pill, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSend(pill.text)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/30 hover:text-white transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
            >
              <span>{pill.icon}</span>
              <span>{pill.text}</span>
            </button>
          ))}
        </div>

        {/* Input Text Box Bar */}
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            placeholder={
              mode === 'BUSINESS' 
                ? 'اسأل عن مبيعات، مخزون، حسابات، ديون...' 
                : 'اسألني عن أسعار الشبكات، باقات الرصيد، عسل سدر...'
            }
            className="flex-1 bg-slate-950 text-xs md:text-sm border border-slate-850 rounded-xl px-3 py-3 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/55 focus:shadow-md focus:shadow-cyan-500/5 disabled:opacity-50 font-sans"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="bg-cyan-500 hover:bg-cyan-405 text-slate-950 p-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:shadow-cyan-500/10 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 scale-x-[-1]" />
          </button>
        </div>
      </div>
    </div>
  );
};
