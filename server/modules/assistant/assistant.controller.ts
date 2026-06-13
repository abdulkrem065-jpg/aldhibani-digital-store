import { Request, Response } from 'express';
import { AssistantCoreService, AssistantMode } from './assistant.service';
import { AssistantMemoryManager } from './assistant.memory';

export class AssistantController {
  
  /**
   * Post chat prompt
   * POST /api/assistant/chat
   */
  static async handleChat(req: Request, res: Response, storeDatabase: any, supabase: any) {
    try {
      const { 
        prompt, 
        conversationId = 'session_guest_default', 
        mode = 'GENERAL', 
        contextMode, // 'SHOPPER' | 'BUSINESS'
        language = 'AR',
        orgId,
        userRole = 'GUEST'
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({ error: 'الرجاء إدخال نص المحادثة بشكل صحيح.' });
      }

      // Enforce Multi-tenant org isolation
      // If we have a verified user payload or token on the request, prioritize it.
      // E.g. req.user?.orgId or fallback to the provided request parameters.
      const resolvedOrgId = orgId || storeDatabase.config?.orgId || null;

      const result = await AssistantCoreService.processChat({
        prompt: prompt.trim(),
        conversationId,
        mode: mode as AssistantMode,
        contextMode: contextMode as 'SHOPPER' | 'BUSINESS' | undefined,
        orgId: resolvedOrgId,
        language: language === 'EN' ? 'EN' : 'AR',
        userRole,
        storeDatabase,
        supabase
      });

      return res.json(result);
    } catch (error: any) {
      console.error('[AssistantController] Chat handler failed:', error);
      return res.status(500).json({ 
        error: error.message || 'فشل معالجة المحادثة الذكية في الوقت الحالي.' 
      });
    }
  }

  /**
   * Post feedback
   * POST /api/assistant/feedback
   */
  static async handleFeedback(req: Request, res: Response, supabase: any) {
    try {
      const { conversationId, rating, comment, orgId } = req.body;

      if (!conversationId || typeof rating !== 'number') {
        return res.status(400).json({ error: 'يرجى تقديم رقم المحادثة والتقييم العددي.' });
      }

      const timestamp = new Date().toISOString();

      if (supabase) {
        // Save to Supabase
        const { error } = await supabase.from('ai_feedback').insert({
          conversation_id: conversationId,
          rating,
          comment: comment || '',
          org_id: orgId || null,
          created_at: timestamp
        });

        if (error) {
          console.error('[AssistantController] Failed to persist feedback to database:', error);
        }
      }

      return res.json({ 
        success: true, 
        message: 'تم استقبال وتحميل تقييمك لمستوى الخدمة بنجاح، شكراً لك!' 
      });
    } catch (error: any) {
      console.error('[AssistantController] Feedback handler failed:', error);
      return res.status(500).json({ error: 'عذراً، فشل تسجيل التقييم.' });
    }
  }

  /**
   * Get historical messages for a session
   * GET /api/assistant/history
   */
  static async handleGetHistory(req: Request, res: Response, supabase: any) {
    try {
      const { conversationId, orgId } = req.query;

      if (!conversationId || typeof conversationId !== 'string') {
        return res.status(400).json({ error: 'الرجاء إدخال رقم المحادثة الصحيح.' });
      }

      const resolvedOrgId = orgId ? String(orgId) : undefined;
      const history = await AssistantMemoryManager.getHistory(conversationId, supabase, resolvedOrgId);

      return res.json({ conversationId, history });
    } catch (error: any) {
      console.error('[AssistantController] History fetch failed:', error);
      return res.status(500).json({ error: 'فشل جلب وتصفح سجلات المحادثة السابقة.' });
    }
  }

  /**
   * Get active compiled contexts (for troubleshooting/dashboard)
   * GET /api/assistant/context
   */
  static async handleGetContext(req: Request, res: Response, storeDatabase: any, supabase: any) {
    try {
      const { type = 'products', orgId } = req.query;
      const resolvedOrgId = orgId ? String(orgId) : undefined;

      let dummyPrompt = 'عرض تفاصيل المنتجات';
      if (type === 'sales') dummyPrompt = 'مبيعات وفواتير المتجر';
      else if (type === 'inventory') dummyPrompt = 'مخزون وكميات ناقصة';
      else if (type === 'customers') dummyPrompt = 'ديون العملاء الآجلة';
      else if (type === 'finance') dummyPrompt = 'حسابات وصرفيات مالية';
      else if (type === 'organization') dummyPrompt = 'تفاصيل فروع المؤسسة';

      const contextCompiler = require('./assistant.context').AssistantContextCompiler;
      const compiledString = await contextCompiler.compileContext(dummyPrompt, storeDatabase, supabase, resolvedOrgId);

      return res.json({
        type,
        orgId: resolvedOrgId || 'DEFAULT_VIP',
        compiled_length: compiledString.length,
        raw_text: compiledString
      });
    } catch (error: any) {
      console.error('[AssistantController] Context check failed:', error);
      return res.status(500).json({ error: 'فشل تفقد سجل الخلية البيئية للمساعد.' });
    }
  }
}
