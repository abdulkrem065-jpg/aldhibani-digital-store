import { AssistantMessage, AssistantMode } from '../../assistant/types/assistant.types';
import { AssistantService } from '../../assistant/services/assistantService';
import { SessionManager } from './SessionManager';
import { MessageStore } from './MessageStore';
import { ContextManager } from './ContextManager';

interface StateListener {
  loading: boolean;
  error: string | null;
}

export class ConversationManager {
  private static instance: ConversationManager;

  private loading: boolean = false;
  private error: string | null = null;
  private activeRequestPromise: Promise<void> | null = null;

  private sessionManager = SessionManager.getInstance();
  private messageStore = MessageStore.getInstance();
  private contextManager = ContextManager.getInstance();

  private listeners: Set<(state: StateListener) => void> = new Set();

  private constructor() {}

  public static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public getError(): string | null {
    return this.error;
  }

  public subscribe(listener: (state: StateListener) => void): () => void {
    this.listeners.add(listener);
    // Emit initial status
    listener({ loading: this.loading, error: this.error });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ loading: this.loading, error: this.error }));
  }

  private updateState(loading: boolean, error: string | null) {
    this.loading = loading;
    this.error = error;
    this.notify();
  }

  /**
   * Orchestrates sending a user prompt to the AI backend.
   * Guarantees that duplicate requests are completely blocked
   * and only ONE request executes even if clicked multiple times.
   */
  public async sendMessage(
    prompt: string,
    userRole: string = 'GUEST',
    orgId?: string,
    forceLanguage: 'AR' | 'EN' = 'AR'
  ): Promise<void> {
    if (!prompt.trim()) return;

    // Direct guard: if there is an active outstanding request, return or wait for it.
    // This strictly prevents duplicate REST API requests even if users hit enter on multiple views.
    if (this.loading || this.activeRequestPromise) {
      console.warn('AI Core: An active request is already processing. Rejecting duplicate send.');
      return this.activeRequestPromise || Promise.resolve();
    }

    this.updateState(true, null);

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

    // Commit user and pending messages immediately to the shared MessageStore
    this.messageStore.addMessage(userMessage);
    this.messageStore.addMessage(pendingBotMessage);

    const conversationId = this.sessionManager.getConversationId();
    const mode = this.contextManager.getMode();

    // Store the active promise inside the instance to allow synchronization of concurrent calls
    this.activeRequestPromise = (async () => {
      try {
        const result = await AssistantService.sendMessage({
          prompt,
          conversationId,
          mode,
          language: forceLanguage,
          userRole,
          orgId
        });

        // Replace pending bubble in shared store with genuine payload
        const realBotMessage: AssistantMessage = {
          id: `bot_${Date.now()}`,
          role: 'model',
          content: result.reply,
          timestamp: new Date().toISOString(),
          modeUsed: result.modeUsed
        };

        this.messageStore.updatePendingMessage(pendingBotId, realBotMessage);
        this.updateState(false, null);
      } catch (err: any) {
        console.error('AI Core Network Error:', err);
        const errorText = err.message || 'فشل الاتصال بمخدم المساعد الذكي.';
        this.updateState(false, errorText);

        const errorBotMessage: AssistantMessage = {
          id: `bot_err_${Date.now()}`,
          role: 'model',
          content: `⚠️ للأسف، تعذر إتمام طلبك بنجاح بسبب وجود خطأ في الاتصال بالسيرفر. يرجى إعادة المحاولة لاحقاً.\n\n*تفاصيل الخطأ: ${errorText}*`,
          timestamp: new Date().toISOString()
        };

        this.messageStore.updatePendingMessage(pendingBotId, errorBotMessage);
      } finally {
        this.activeRequestPromise = null;
      }
    })();

    return this.activeRequestPromise;
  }

  /**
   * Proxies satisfaction feedback submission
   */
  public async submitFeedback(rating: number, comment?: string, orgId?: string): Promise<boolean> {
    try {
      const conversationId = this.sessionManager.getConversationId();
      await AssistantService.submitFeedback({
        conversationId,
        rating,
        comment,
        orgId
      });
      return true;
    } catch (e) {
      console.error('AI Core: Feedback submit fail:', e);
      return false;
    }
  }

  /**
   * Resets active session details cleanly
   */
  public clearSession() {
    const oldId = this.sessionManager.getConversationId();
    if (oldId) {
      localStorage.removeItem(`msgs_${oldId}`);
    }
    const newId = this.sessionManager.resetSession();
    
    // Seed new session with distinct welcome greeting
    const introMsg: AssistantMessage = {
      id: 'welcome',
      role: 'model',
      content: `أهلاً بك مجدداً! تم تصفير سجل الجلسة السابقة وتوليد جلسة مشفرة جديدة لخصوصيتك. 🤖✨

كيف يمكنني مساعدتك الآن؟`,
      timestamp: new Date().toISOString()
    };
    
    this.messageStore.setMessages([introMsg]);
    this.contextManager.setMode('GENERAL');
    this.updateState(false, null);
  }
}
