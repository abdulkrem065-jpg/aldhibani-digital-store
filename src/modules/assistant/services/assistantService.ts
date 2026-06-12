import { AssistantMode, AssistantMessage, FeedbackPayload } from '../types/assistant.types';

export class AssistantService {
  /**
   * Post message to the assistant backend proxy
   */
  static async sendMessage(params: {
    prompt: string;
    conversationId: string;
    mode: AssistantMode;
    language?: 'AR' | 'EN';
    userRole?: string;
    orgId?: string;
  }): Promise<{
    reply: string;
    conversationId: string;
    modeUsed: 'GEMINI' | 'OFFLINE_INTELLIGENCE';
    systemMode: string;
  }> {
    const response = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'عذراً، فشل المساعد الذكي في الرد على استفسارك في هذا الوقت.');
    }

    return response.json();
  }

  /**
   * Submit satisfaction feedback
   */
  static async submitFeedback(payload: FeedbackPayload): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/assistant/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'فشل إرسال التقييم لمخدم النظام.');
    }

    return response.json();
  }

  /**
   * Fetch conversation history from the backend
   */
  static async getHistory(conversationId: string, orgId?: string): Promise<{
    conversationId: string;
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }>; created_at?: string }>;
  }> {
    const url = `/api/assistant/history?conversationId=${encodeURIComponent(conversationId)}${orgId ? `&orgId=${encodeURIComponent(orgId)}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب وتصفح سجل المحادثة من مخدم السحابة.');
    }

    return response.json();
  }
}
