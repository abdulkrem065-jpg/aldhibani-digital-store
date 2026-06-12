interface LocalMessage {
  role: 'user' | 'model' | 'system';
  parts: Array<{ text: string }>;
  created_at?: string;
}

interface ThreadMemory {
  messages: LocalMessage[];
  updatedAt: Date;
}

export class AssistantMemoryManager {
  // In-memory cache fallback to guarantee 100% uptime even without DB setup
  private static localThreads: Map<string, ThreadMemory> = new Map();

  /**
   * Retrieves conversation history
   */
  static async getHistory(
    conversationId: string,
    supabase: any,
    orgId?: string
  ): Promise<LocalMessage[]> {
    try {
      if (supabase) {
        // Query database history
        const { data, error } = await supabase
          .from('ai_messages')
          .select('role, content, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.content }],
            created_at: msg.created_at
          }));
        }
      }
    } catch (e) {
      console.error('[MemoryManager] Database query failed, relying on fallback thread memory:', e);
    }

    // Default Fallback
    const thread = this.localThreads.get(conversationId);
    if (thread) {
      return thread.messages;
    }
    return [];
  }

  /**
   * Saves a message to history
   */
  static async appendMessage(
    conversationId: string,
    role: 'user' | 'model' | 'system',
    text: string,
    supabase: any,
    orgId?: string
  ) {
    const timestamp = new Date().toISOString();

    // 1. Save to in-memory fallback
    let thread = this.localThreads.get(conversationId);
    if (!thread) {
      thread = { messages: [], updatedAt: new Date() };
      this.localThreads.set(conversationId, thread);
    }
    thread.messages.push({
      role,
      parts: [{ text }],
      created_at: timestamp
    });
    thread.updatedAt = new Date();

    // Limit memory size in fallback to prevent leaks
    if (thread.messages.length > 100) {
      thread.messages = thread.messages.slice(-50);
    }

    // 2. Persist to Supabase if connected
    if (supabase) {
      try {
        // Check if conversation exists, if not list/insert it
        const { data: conv, error: convError } = await supabase
          .from('ai_conversations')
          .select('id')
          .eq('id', conversationId)
          .maybeSingle();

        if (convError || !conv) {
          // Insert conversation record
          await supabase.from('ai_conversations').insert({
            id: conversationId,
            org_id: orgId || null,
            title: text.slice(0, 50) + '...',
            created_at: timestamp,
            updated_at: timestamp
          });
        } else {
          // Update timestamp
          await supabase
            .from('ai_conversations')
            .update({ updated_at: timestamp })
            .eq('id', conversationId);
        }

        // Insert actual message
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role: role === 'model' ? 'assistant' : role,
          content: text,
          created_at: timestamp,
          org_id: orgId || null
        });
      } catch (err) {
        console.error('[MemoryManager] Failed to persist thread message in database:', err);
      }
    }
  }

  /**
   * Cleans old threads
   */
  static pruneOldThreads() {
    const cutoff = 1000 * 60 * 60 * 24; // 24 hours
    const now = Date.now();
    for (const [key, val] of this.localThreads.entries()) {
      if (now - val.updatedAt.getTime() > cutoff) {
        this.localThreads.delete(key);
      }
    }
  }
}

// Set continuous cleanup schedule
setInterval(() => {
  AssistantMemoryManager.pruneOldThreads();
}, 1000 * 60 * 60); // every hour
