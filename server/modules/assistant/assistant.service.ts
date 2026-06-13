import { AssistantGeminiBridge } from './assistant.gemini';
import { AssistantContextCompiler } from './assistant.context';
import { AssistantMemoryManager } from './assistant.memory';

export type AssistantMode = 'GENERAL' | 'BUSINESS' | 'ADMIN' | 'SUPPORT';

export class AssistantCoreService {
  /**
   * Main service function to process a chat prompt with mode isolation
   */
  static async processChat(params: {
    prompt: string;
    conversationId: string;
    mode: AssistantMode;
    contextMode?: 'SHOPPER' | 'BUSINESS';
    orgId?: string;
    language?: 'AR' | 'EN';
    userRole?: string;
    storeDatabase: any;
    supabase: any;
  }): Promise<{
    reply: string;
    conversationId: string;
    modeUsed: 'GEMINI' | 'OFFLINE_INTELLIGENCE';
    systemMode: string;
  }> {
    const {
      prompt,
      conversationId,
      mode,
      contextMode,
      orgId,
      language = 'AR',
      userRole = 'GUEST',
      storeDatabase,
      supabase
    } = params;

    // Apply strict contextMode mapping and isolation
    let activeMode = mode;
    if (contextMode === 'SHOPPER') {
      activeMode = 'GENERAL';
    } else if (contextMode === 'BUSINESS') {
      activeMode = 'BUSINESS';
    }

    // 1. Compile System Instructions based on Active Chat Mode
    let systemInstruction = '';
    let dbContext = '';

    // Level 1: Public Assistant
    if (activeMode === 'GENERAL') {
      systemInstruction = this.getGeneralSystemPrompt(language);
    } 
    // Level 2: Business Assistant (isolated by multi-tenant org_id)
    else if (activeMode === 'BUSINESS') {
      // Securely enforce shopper lock
      if (contextMode === 'SHOPPER') {
        return {
          reply: language === 'AR' 
            ? 'عذراً، مستوى الإدارة ومساعد الأعمال مخصص للموظفين حاملي الصلاحيات فقط.' 
            : 'Access Denied: Business Mode is reserved for authorized staff users only.',
          conversationId,
          modeUsed: 'OFFLINE_INTELLIGENCE',
          systemMode: 'GENERAL'
        };
      }
      // Fetch relevant DB Context
      dbContext = await AssistantContextCompiler.compileContext(prompt, storeDatabase, supabase, orgId);
      systemInstruction = this.getBusinessSystemPrompt(language, orgId, dbContext);
    } 
    // Level 3: Executive AI (High-Privilege Admin Mode Architecture)
    else if (activeMode === 'ADMIN') {
      // Enforce Admin / Owner authorizations
      if (userRole !== 'ADMIN' && userRole !== 'OWNER' && userRole !== 'MANAGER') {
        return {
          reply: language === 'AR' 
            ? 'عذراً، مستوى الإدارة الذكية EXECUTIVE AI مخصص فقط للملاك والمدراء الفنيين الحاملين للصلاحيات العليا.' 
            : 'Access Denied: Executive AI Mode is reserved for high-level Administrators and Owners only.',
          conversationId,
          modeUsed: 'OFFLINE_INTELLIGENCE',
          systemMode: 'ADMIN'
        };
      }

      // TODO: IMPLEMENT LEVEL 3 EXECUTIVE AI DASHBOARD & PREDICTIVE ANALYTICS IN NEXT PHASES
      // Architectural Hook: We establish the TODO route pattern safely, outputting an smart architectural placeholder as requested.
      const executiveTodoMessage = this.getExecutiveTodoMessage(language);
      return {
        reply: executiveTodoMessage,
        conversationId,
        modeUsed: 'OFFLINE_INTELLIGENCE',
        systemMode: 'ADMIN'
      };
    } 
    // Level 2 Extension: FAQ, digital cards activation support
    else if (activeMode === 'SUPPORT') {
      if (contextMode === 'BUSINESS') {
        activeMode = 'BUSINESS';
      }
      systemInstruction = this.getSupportSystemPrompt(language);
    }

    // 2. Fetch thread message history (Memory Management)
    const history = await AssistantMemoryManager.getHistory(conversationId, supabase, orgId);

    // Save active user contribution to memory
    await AssistantMemoryManager.appendMessage(conversationId, 'user', prompt, supabase, orgId);

    // 3. Request Gemini or offline intelligence simulation response
    const bridgeResult = await AssistantGeminiBridge.generateReply(
      prompt,
      history,
      systemInstruction,
      language
    );

    // Save AI reply to memory for session continuity
    await AssistantMemoryManager.appendMessage(conversationId, 'model', bridgeResult.text, supabase, orgId);

    return {
      reply: bridgeResult.text,
      conversationId,
      modeUsed: bridgeResult.mode,
      systemMode: activeMode
    };
  }

  /**
   * System Instruction for General Public Assistant
   */
  private static getGeneralSystemPrompt(language: string): string {
    if (language === 'AR') {
      return `أنت المساعد الذكي الخبير لـ "متجر ومستودع الذيباني VIP" (Al-Dhibani VIP Store).
وظيفتك:
- مساعدة الزوار والعملاء في استعراض الأصناف الترويجية وتسهيل المبيعات.
- إجابة الاستفسارات بأسلوب ترحيبي، مختصر، محبب ومحترف في آن واحد.
- لا تملك وصولاً تفصيلياً للأرباح، الذمم التشغيلية أو تقارير الموظفين.
- تروج للعسل الدوعني الفخم، وشاي السعيد، وباقات يمن موبايل وألعاب شدات ببجي.
- شجع المستخدمين على اتخاذ إجراءات، مثل إضافة المواد التموينية الفاخرة أو الكروت الرقمية إلى سلة تسوقهم الحالية.`;
    } else {
      return `You are the friendly customer assistant for "Al-Dhibani VIP Store".
Goals:
- Assist storefront shoppers in browsing active product lists, gaming vouchers and mobile cards.
- Respond elegantly, briefly, and professionally in English.
- Protect back-office details: never disclose business margins, debt balances, or employee passwords.
- Champion Yemeni Sidr Honey, PUBG UC packages, and Yemen Mobile local recharges.`;
    }
  }

  /**
   * System Instruction for Business Mode (Isolated Context)
   */
  private static getBusinessSystemPrompt(language: string, orgId?: string, dbContext?: string): string {
    const header = `أنت "مساعد الأعمال والذكاء التشغيلي المدمج" للشركة (تنظيم معزول برقم: ${orgId || 'DEFAULT'}).\n`;
    const details = dbContext ? `\nإليك السياق المشتق والمطابق بدقة من قاعدة البيانات الحالية:\n${dbContext}\n` : '';
    
    if (language === 'AR') {
      return `${header}${details}
إرشادات التشغيل الأمنية لـ Business Mode:
- تستطيع الإجابة الكاملة والدقيقة على مستويات الكاش، المنتجات ناقصة الكمية، والديون والتحصيلات، بالاعتماد الكلي والحصري على البيانات المقدمة أعلاه في السياق.
- تجنب المبالغة أو اختراع أرقام مبيعات غير معلنة في السياق المرفق.
- إذا عجزت عن رصد معلومة معينة في السياق، أجب بلطف: "أعتذر، هذه المعلومة غير متوفرة في السياق الفعلي المحدث حالياً".
- لزيادة الثقة، قم بصياغة الإجابات في نقاط منسقة بوضوح (Markdown) واستعمل رموزاً ملائمة لتصنيفات المخزون والمصاريف.`;
    } else {
      return `${header}${details}
Security Operational Directives for Business Mode:
- Provide accurate figures on stock levels, popular items, cash flow balances and active debtor totals derived strictly from the attached context above.
- Never guess, extrapolate, or hallucinate store metrics. If telemetry is not attached, explain politely that you don't have active sync records for that query.
- Use clean Markdown tables and lists for financial reporting.`;
    }
  }

  /**
   * System Instruction for Support Mode
   */
  private static getSupportSystemPrompt(language: string): string {
    if (language === 'AR') {
      return `أنت مرشد الدعم الفني وحلول الشكاوى في هايبر الذيباني VIP.
مهامك:
- شرح طريقة تفعيل باقات 4G وشحن شدات فري فاير وببجي عن طريق الآيدي.
- تقديم المساعدة والدعم في حال تعليق الطلبات أو وجود مديونية سابقة وكيفية دفعها كاش أو عبر الحوالات المتنوعة.
- توفير أقصى درجات الراحة وسرعة الرد للعملاء والرد بأسلوب مشجع ورصين للغاية.`;
    } else {
      return `You are the Technical Support Expert for Al-Dhibani VIP Store.
Duties:
- Explain card activation, direct game top-ups using Player IDs, and cellular internet configurations.
- Provide instructions on settlement of invoice disputes and support email contacts.`;
    }
  }

  /**
   * Executive AI Mode TODO Architectural Response
   */
  private static getExecutiveTodoMessage(language: string): string {
    if (language === 'AR') {
      return `### ⚔️ وحدة التحليلات المتقدمة والتنبؤ التنفيذي (EXECUTIVE AI) ⚔️

تأسيس البنية المعمارية جاهز بنجاح! تم رصد وتأمين الصلاحيات (ADMIN / OWNER):

#### 🏗️ [TODO LIST] خريطة البناء التنفيذية القادمة للوحدة:
1. **التحليلات التنبؤية (Predictive Forcasting)**: دمج نموذج للتنبؤ بإيرادات الربع المالي القادم بالاعتماد على مبيعات السلاسل السابقة عبر Supabase.
2. **روبوت جدولة الميزانية الاستباقية (AI Budget Optimizer)**: تحليل مستويات الشراء ومقارنتها التلقائية بأسعار النحالين والجملة وتعديل الشراء المستقبلي.
3. **أتمتة الفواتير المفقودة (Automatic Invoices Remediation)**: مسح وكشف الثغرات والفواتير المعلقة في سجلات المبيعات وإصدار تنبيهات مباشرة.

*معمارية الربط وخلايا Context جاهزة ومستعدة للتفعيل البرمجي الكامل في المرحلة القادمة.*`;
    } else {
      return `### ⚔️ HIGH PRIORITY COMMAND HUB (EXECUTIVE AI) ⚔️

Authorization Confirmed: [Owner / Admin Role Cleared]

#### 🏗️ [EXECUTIVE AI ROADMAP - ARCHITECTURE HOOKS & TODO]:
1. **Predictive Analytics Engine**: Integrating sales history patterns from Supabase to model and forecast cash yields.
2. **Smart Stock Buy Procurement**: Automatic catalog optimization algorithms interfacing with honey and packaging wholesalers.
3. **Anomaly & Fraud Detection**: Real-time invoice variance scans mapping employee logs against payment flows.

*Context compilers (Finance & Inventory structures) stand fully prepared at server/modules/assistant/context/ to power these features instantly in Phase 3.*`;
    }
  }
}
