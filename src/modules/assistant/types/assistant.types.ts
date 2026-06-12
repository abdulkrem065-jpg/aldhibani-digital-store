export type AssistantMode = 'GENERAL' | 'BUSINESS' | 'ADMIN' | 'SUPPORT';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  modeUsed?: 'GEMINI' | 'OFFLINE_INTELLIGENCE';
  isPending?: boolean;
}

export interface AssistantSession {
  conversationId: string;
  mode: AssistantMode;
  messages: AssistantMessage[];
  loading: boolean;
  error: string | null;
}

export interface FeedbackPayload {
  conversationId: string;
  rating: number;
  comment?: string;
  orgId?: string;
}
