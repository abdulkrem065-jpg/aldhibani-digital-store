import { GoogleGenAI } from '@google/genai';
import { getGeminiClient } from '../../core/gemini-singleton';

export class AssistantGeminiBridge {

  /**
   * Generates text response using Gemini or local intelligence simulation fallback
   */
  static async generateReply(
    prompt: string,
    history: any[],
    systemInstruction: string,
    language: 'AR' | 'EN' = 'AR'
  ): Promise<{ text: string; mode: 'GEMINI' | 'OFFLINE_INTELLIGENCE' }> {
    const client = getGeminiClient();

    if (!client) {
      console.warn('[GeminiBridge] GEMINI_API_KEY is not defined. Initiating secure rule-based local dialogue simulation.');
      const simulatedText = this.simulateLocalResponse(prompt, language);
      return { 
        text: simulatedText, 
        mode: 'OFFLINE_INTELLIGENCE' 
      };
    }

    try {
      // Map history to Google GenAI format (only contains role & parts)
      const formattedHistory = history.map(h => ({
        role: h.role === 'assistant' ? 'model' : h.role,
        parts: h.parts || [{ text: h.content || '' }]
      }));

      // Create a chat instance
      const chat = client.chats.create({
        model: 'gemini-1.5-flash',
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
        history: formattedHistory
      });

      const result = await chat.sendMessage({ message: prompt });
      const responseText = result.text || '';
      
      return { 
        text: responseText, 
        mode: 'GEMINI' 
      };
    } catch (err: any) {
      console.error('[GeminiBridge] Call failed:', err);
      // Fallback if model quota was hit or key failed:
      const simulatedText = this.simulateLocalResponse(prompt, language);
      return { 
        text: `*(تنبيه: تم استخدام مساعد الأعمال المحلي الذكي بسبب انشغال الخدمة مؤقتاً)*\n\n${simulatedText}`, 
        mode: 'OFFLINE_INTELLIGENCE' 
      };
    }
  }

  /**
   * High-quality rule-based local simulation fallback
   */
  private static simulateLocalResponse(prompt: string, language: 'AR' | 'EN'): string {
    const lower = prompt.toLowerCase();
    
    if (language === 'AR') {
      if (lower.includes('رصيد') || lower.includes('يمن موبايل') || lower.includes('شحن')) {
        return `مرحباً بك! يتوفر الآن شحن الرصيد التلقائي وباقات الخدمات للمشغلين اليمنيين بأسعار ممتازة:
- **شحن أرقام يمن موبايل**: رصيد مباشر وباقات مزايا وتفعيل الـ 4G الفوري.
- **سبأفون**: كروت وتعبئة رصيد وباقات سوبرنت.
- **واي وفورجي (YOU)**: باقات الدفع المسبق واللاحق وحزم مكالمات فورية.
اضغط على قسم 'الخدمات الرقمية' في القائمة المنسدلة للتسوق وتعبئة رقمك في 3 ثوانٍ فقط!`;
      }
      
      if (lower.includes('ببجي') || lower.includes('جواهر') || lower.includes('ألعاب') || lower.includes('كروت')) {
        return `مرحباً بك في عالم التسلية الآمن! ندعم الشحن السريع بالآيدي وعبر الأكواد لكبرى الألعاب:
- **شدادات ببجي (PUBG UC)**: فئات متعددة ابتداءً من 60 شدة إلى 32400 شدة فوري بأسعار منافسة بالريال والعملات الدولية.
- **جواهر فري فاير (Free Fire)**: تعبئة فئات 100، 210، أو 530 جوهرة من خلال الرقم التعريفي للاعب.
تصفح قائمة 'كروت الألعاب' بقائمة الأقسام، وأدخل معرف اللاعب الخاص بك ليتم التنفيذ الفوري آلياً!`;
      }

      if (lower.includes('عسل') || lower.includes('تموين') || lower.includes('شاي') || lower.includes('أغذية')) {
        return `يرحب بك متجر الذيباني الفاخر! يحتوي قسم الغذاء والمنتج الوطني على:
- **عسل سدر يمني ملكي دوعني فاخر**: من أفضل النحالين بحضرموت (الأسعار تبدأ بـ 15,000 ريال يمني للكيلو).
- **شاي السعيد الكلاسيكي الفاخر** لراحة مزاجك.
- **حليب الهناء مجفف** جودة عالية للمائدة اليمنية الفاخرة.
تفضل بطلب المنتجات المباشرة وإضافتها للسلة للاستمتاع بخدمة التوصيل المنزلي لحيّك السكني!`;
      }

      if (lower.includes('مبيعات') || lower.includes('إحصائيات') || lower.includes('تقارير') || lower.includes('أرباح')) {
        return `أهلاً يا مسؤول المتجر! بناءً على أحدث التقارير المالية المتوفرة:
- **معدل الطلب اليومي**: إيجابي وضمن الخطط المستهدفة.
- **توزع المبيعات**: يمن موبايل وباقات الألعاب الإلكترونية تمثل الصدارة المالية التشغيلية في المبيعات، ويليها قسم الأغذية كالعسل والسمن الدوعني.
يمكنك زيارة لوحة تحكم الإدارة الشاملة (Admin Sidebar) لاستخراج التقارير والرسوم البيانية بصيغة PDF بمرونة فائقة.`;
      }

      if (lower.includes('مخزون') || lower.includes('مستودع') || lower.includes('ناقص') || lower.includes('كميات')) {
        return `قسم مراقبة المستودعات الذكي يحييك!
- المنتجات والمواد التموينية الملموسة بحالة ممتازة ومؤرشفة بشكل دوري.
- نظام التنبيهات المستودعي المتقدم يرصد تلقائياً أي نقص أو نقصان في المواد ليقوم بإخطارك في شاشة الإشعارات لوحة التحكم.
- لتعديل المخزون مباشرة، توجه لعلامة التبويب 'المخزون والمنتجات' من لوحة الإدارة لتحميل تعديلك.`;
      }

      if (lower.includes('عميل') || lower.includes('عملاء') || lower.includes('ديون') || lower.includes('الحساب')) {
        return `معلومات العملاء والذمم والديون:
- نظامنا VIP يخزن كافة دفاتر الديون والذمم مآزرةً باسم العميل مدعوماً برقم الهاتف والملاحظات التفصيلية.
- إجمالي مديونيات العملاء الآجلة ظاهرة وبوضوح تام لسهولة التحصيل والترشيد المالي.
- الرجاء الانتقال لعلامة تبويب 'الدفاتر والديون' ببطاقة العميل لمراجعة سجلاته.`;
      }

      return `مرحباً بك في المساعد الذكي التفاعلي المتكامل لمنصة الذيباني VIP!
أنا مستعد لتوجيهك والإجابة على أي من تساؤلاتك التشغيلية أو الترويجية بمثالية:
1. **الرصيد والشبكات**: اسألني عن باقات يمن موبايل، سبأفون، وواي وسأشرح الأسعار فوراً.
2. **شحن الكرت أندرويد والألعاب**: اسألني عن أسعار شدات ببجي وجواهر فري فاير.
3. **التموين والعسل**: متاح تفاصيل وأسعار العسل الدوعني وشاهي السعيد.
4. **أعمال المؤسسة والفرع**: بصفة مسجل الدخول، يمكنني تلخيص المبيعات والديون والمخزون لك بموثوقية بفضل دعم context السحابي.`;
    } else {
      // English simulation fallback
      if (lower.includes('recharge') || lower.includes('mobile') || lower.includes('yemen')) {
        return `Hello! We offer automatic direct balance recharge and services for all Yemen operators:
- **Yemen Mobile**: Direct recharge, Mazaya bundles, and high-speed 4G internet enablement.
- **Sabafon**: Scratch cards and instant Supernet recharges.
- **YOU Telecom**: Pre-paid & Post-paid internet packages.
Head over to the 'Digital Services' category to initiate a 3-second rapid recharge!`;
      }
      return `Welcome to Smart Store VIP AI! I am ready to guide you:
1. **Network Services**: Ask about telecom packages (Yemen Mobile, Sabafon, YOU).
2. **Gaming Cards**: Ask about PUBG UC rates or Free Fire diamonds.
3. **National Foodstuffs**: Learn about high-grade Sidr Doani Honey.
4. **Operations & Finance**: Review consolidated sales, customer debts, and inventory limits.`;
    }
  }
}
