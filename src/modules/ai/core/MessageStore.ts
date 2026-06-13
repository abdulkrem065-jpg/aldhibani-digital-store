import { AssistantMessage } from '../../assistant/types/assistant.types';
import { SessionManager } from './SessionManager';

export class MessageStore {
  private static instance: MessageStore;
  private messages: AssistantMessage[] = [];
  private listeners: Set<(messages: AssistantMessage[]) => void> = new Set();
  private sessionManager = SessionManager.getInstance();

  private constructor() {
    this.loadFromCache(this.sessionManager.getConversationId());
    
    // Subscribe to session changes to reload cached messages
    this.sessionManager.subscribe((newId) => {
      this.loadFromCache(newId);
    });
  }

  public static getInstance(): MessageStore {
    if (!MessageStore.instance) {
      MessageStore.instance = new MessageStore();
    }
    return MessageStore.instance;
  }

  private loadFromCache(conversationId: string) {
    const savedMsgs = localStorage.getItem(`msgs_${conversationId}`);
    if (savedMsgs) {
      try {
        this.messages = JSON.parse(savedMsgs);
      } catch (e) {
        console.error('Failed to parse cached message store items:', e);
        this.messages = this.getWelcomeMessage();
      }
    } else {
      this.messages = this.getWelcomeMessage();
    }
    this.notify();
  }

  public getWelcomeMessage(): AssistantMessage[] {
    return [{
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
    }];
  }

  public getMessages(): AssistantMessage[] {
    return this.messages;
  }

  public setMessages(messages: AssistantMessage[]) {
    this.messages = messages;
    const conversationId = this.sessionManager.getConversationId();
    if (conversationId) {
      localStorage.setItem(`msgs_${conversationId}`, JSON.stringify(messages));
    }
    this.notify();
  }

  public addMessage(message: AssistantMessage) {
    const updated = [...this.messages, message];
    this.setMessages(updated);
  }

  public updatePendingMessage(pendingId: string, realMessage: AssistantMessage) {
    const updated = this.messages.map((m) => (m.id === pendingId ? realMessage : m));
    this.setMessages(updated);
  }

  public removeMessage(id: string) {
    const updated = this.messages.filter((m) => m.id !== id);
    this.setMessages(updated);
  }

  public clearMessages() {
    this.setMessages([]);
  }

  public subscribe(listener: (messages: AssistantMessage[]) => void): () => void {
    this.listeners.add(listener);
    // Emit initial value on subscribe
    listener(this.messages);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.messages]));
  }
}
