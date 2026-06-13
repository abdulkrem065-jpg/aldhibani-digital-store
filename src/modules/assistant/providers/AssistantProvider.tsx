import React, { createContext, useContext, useState, useEffect } from 'react';
import { AssistantMode, AssistantMessage } from '../types/assistant.types';
import { AssistantService } from '../services/assistantService';

interface AssistantContextType {
  mode: AssistantMode;
  messages: AssistantMessage[];
  loading: boolean;
  error: string | null;
  setMode: (mode: AssistantMode) => void;
  sendMessage: (prompt: string, userRole?: string, orgId?: string, forceLanguage?: 'AR' | 'EN') => Promise<void>;
  submitFeedback: (rating: number, comment?: string, orgId?: string) => Promise<boolean>;
  clearSession: () => void;
  conversationId: string;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AssistantMode>('GENERAL');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize unique session or load it from local storage
    let savedId = localStorage.getItem('smart_assistant_session_id');
    if (!savedId) {
      savedId = `session_ss_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem('smart_assistant_session_id', savedId);
    }
    setConversationId(savedId);

    // Fetch history from local storage or API
    const loadInitialHistory = async () => {
      try {
        setLoading(true);
        const savedMsgs = localStorage.getItem(`msgs_${savedId}`);
        if (savedMsgs) {
          try {
            setMessages(JSON.parse(savedMsgs));
          } catch (err) {
            console.error('Failed to parse saved chat messages:', err);
            setDefaultWelcome();
          }
        } else {
          setDefaultWelcome();
        }
      } catch (e) {
        console.error('Failed to load initial history:', e);
      } finally {
        setLoading(false);
      }
    };

    const setDefaultWelcome = () => {
      const introMsg: AssistantMessage = {
        id: 'welcome',
        role: 'model',
        content: `أهلاً بك في البوابة الذكية لـ الذيباني VIP! 🤖🛡️

أنا مساعدك السحابي المتكامل المدعوم بذكاء Google Gemini الاصطناعي المعزول. يسعدني مساعدتك في:
- تفقد أسعار العسل الدوعني الفاخر والمنتجات والمواد الغذائية التموينية.
- شحن الرصيد والشبكات (يمن موبايل، سبأفون، يو YOU) وباقات الـ 4G الفورية.
- شحن شدات ببجي وجواهر فري فاير بالآيدي مباشرة وسحب كروت الألعاب.
- مراجعة إحصائيات المبيعات، والديون والعملاء، والمركبات المالية حسب حسابك الحاصل ومزامنته بآمان كامل.

اختر نمط التشغيل المفضل لديك من الأعلى، كيف يمكنني مساعدتك التشغيلية اليوم؟`,
        timestamp: new Date().toISOString()
      };
      setMessages([introMsg]);
    };

    if (savedId) {
      loadInitialHistory();
    }
  }, []);

  const getModeAlertContent = (m: AssistantMode): string => {
    switch (m) {
      case 'BUSINESS':
        return '🔄 تم تنشيط نمط الأعمال (Business Mode) - يملك النظام الآن صلاحية قراءة السياق التشغيلي للمنتجات، الجرد والديون والمبيعات المحدثة سحابياً بشكل معزول.';
      case 'ADMIN':
        return '🛡️ تم تنشيط النمط التنفيذي (Executive Admin Mode) - مخصص لمالك المتجر والتحليل المستقبلي الذكي.';
      case 'SUPPORT':
        return '💬 تم تنشيط نمط الدعم الفني المباشر (Customer Support Mode) - مخصص لأسئلة تفعيل الباقات، حلول المشاكل وطرق تحويل المبالغ.';
      default:
        return '🌐 تم التبديل إلى النمط العام (General Mode) - للمحادثات والاستفسارات العامة دون سياق الحسابات الداخلي.';
    }
  };

  const setMode = (newMode: AssistantMode) => {
    setModeState(newMode);
    
    const alertMsg: AssistantMessage = {
      id: `alert_${Date.now()}`,
      role: 'system',
      content: getModeAlertContent(newMode),
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => {
      const updated = [...prev, alertMsg];
      localStorage.setItem(`msgs_${conversationId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const sendMessage = async (
    prompt: string,
    userRole: string = 'GUEST',
    orgId?: string,
    forceLanguage: 'AR' | 'EN' = 'AR'
  ) => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    const userMessage: AssistantMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };

    const pendingBotId = `bot_pending_${Date.now()}`;
    const pendingBotMessage: AssistantMessage = {
      id: pendingBotId,
      role: 'model',
      content: 'جاري مراجعة طلبك وصياغة الرد...',
      timestamp: new Date().toISOString(),
      isPending: true
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage, pendingBotMessage];
      localStorage.setItem(`msgs_${conversationId}`, JSON.stringify(updated));
      return updated;
    });

    try {
      const result = await AssistantService.sendMessage({
        prompt,
        conversationId,
        mode,
        language: forceLanguage,
        userRole,
        orgId
      });

      const realBotMessage: AssistantMessage = {
        id: `bot_${Date.now()}`,
        role: 'model',
        content: result.reply,
        timestamp: new Date().toISOString(),
        modeUsed: result.modeUsed
      };

      setMessages((prev) => {
        const updated = prev.map((m) => m.id === pendingBotId ? realBotMessage : m);
        localStorage.setItem(`msgs_${conversationId}`, JSON.stringify(updated));
        return updated;
      });
      setLoading(false);
    } catch (err: any) {
      console.error('AI Service Error:', err);
      const errorText = err.message || 'فشل الاتصال بمخدم المساعد الذكي.';
      setError(errorText);

      const errorBotMessage: AssistantMessage = {
        id: `bot_err_${Date.now()}`,
        role: 'model',
        content: `⚠️ للأسف، تعذر إتمام طلبك بنجاح بسبب وجود خطأ في الاتصال بالسيرفر. يرجى إعادة المحاولة لاحقاً.\n\n*تفاصيل الخطأ: ${errorText}*`,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => {
        const updated = prev.map((m) => m.id === pendingBotId ? errorBotMessage : m);
        localStorage.setItem(`msgs_${conversationId}`, JSON.stringify(updated));
        return updated;
      });
      setLoading(false);
    }
  };

  const submitFeedback = async (rating: number, comment?: string, orgId?: string): Promise<boolean> => {
    try {
      await AssistantService.submitFeedback({
        conversationId,
        rating,
        comment,
        orgId
      });
      return true;
    } catch (e) {
      console.error('Feedback submit fail:', e);
      return false;
    }
  };

  const clearSession = () => {
    if (conversationId) {
      localStorage.removeItem(`msgs_${conversationId}`);
    }
    const newId = `session_ss_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    setConversationId(newId);
    localStorage.setItem('smart_assistant_session_id', newId);

    const introMsg: AssistantMessage = {
      id: 'welcome',
      role: 'model',
      content: `أهلاً بك مجدداً! تم تصفير سجل الجلسة السابقة وتوليد جلسة مشفرة جديدة لخصوصيتك. 🤖✨

كيف يمكنني مساعدتك الآن؟`,
      timestamp: new Date().toISOString()
    };
    setMessages([introMsg]);
    setModeState('GENERAL');
    setError(null);
  };

  return (
    <AssistantContext.Provider value={{
      mode,
      messages,
      loading,
      error,
      setMode,
      sendMessage,
      submitFeedback,
      clearSession,
      conversationId
    }}>
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
};
