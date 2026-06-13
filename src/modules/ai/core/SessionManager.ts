import { AssistantMode } from '../../assistant/types/assistant.types';

export class SessionManager {
  private static instance: SessionManager;
  private conversationId: string = '';
  private listeners: Set<(conversationId: string) => void> = new Set();

  private constructor() {
    this.init();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private init() {
    let savedId = localStorage.getItem('smart_assistant_session_id');
    if (!savedId) {
      savedId = `session_ss_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem('smart_assistant_session_id', savedId);
    }
    this.conversationId = savedId;
  }

  public getConversationId(): string {
    return this.conversationId;
  }

  public setConversationId(id: string) {
    this.conversationId = id;
    localStorage.setItem('smart_assistant_session_id', id);
    this.notify();
  }

  public resetSession(): string {
    const newId = `session_ss_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    this.setConversationId(newId);
    return newId;
  }

  public subscribe(listener: (conversationId: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.conversationId));
  }
}
