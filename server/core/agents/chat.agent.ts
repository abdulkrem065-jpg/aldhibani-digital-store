import { registerAgent } from '../ai-core';
import { storeDatabase } from '../../../server';

const mapProduct = (p: any): any => {
  if (!p) return null;
  return {
    id: p.id,
    nameAR: p.name_ar || '',
    nameEN: p.name_en || '',
    descriptionAR: p.description_ar || '',
    descriptionEN: p.description_en || '',
    category: p.category || '',
    brand: p.brand || '',
    priceYER: Number(p.price_yer || 0),
    imageUrl: p.image_url || '',
    isAvailable: p.is_available !== undefined ? Boolean(p.is_available) : true,
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : undefined
  };
};

registerAgent('chat', async (context, input) => {
    const { userId, message, prompt, conversationId, language } = input;
    const rawMessage = message || prompt || '';
    let convId = conversationId;

    if (!convId) {
        const { data, error } = await context.createConversation(userId || 'anonymous_user', 'محادثة ذكية جديدة');
        if (error) throw error;
        convId = data.id;
    }

    await context.addMessage(convId, 'user', rawMessage);

    // Fetch live catalog products
    let productsList: any[] = [];
    try {
        const { data, error } = await context.supabase.from('products').select('*');
        if (!error && data) {
            productsList = data.map(mapProduct);
        }
    } catch (e) {
        console.error('Agent context catalog fetch error:', e);
    }

    // Generate dynamic catalog instructions
    const catalogString = productsList
        .filter(p => p.isAvailable)
        .map(p => `- [ID: ${p.id}] ${p.nameAR} / ${p.nameEN} (${p.priceYER} YER) - Category: ${p.category}`)
        .join('\n');

    const usdRate = storeDatabase?.config?.exchangeRateUSD || 530;
    const sarRate = storeDatabase?.config?.exchangeRateSAR || 140;
    const currentLang = language || 'AR';

    const systemPromptMessage = `أنت المساعد الذكي والموظف الافتراضي الفخم والموثق والرفيق الشخصي لـ "هايبر ماركت الطيب الهجين".
هذا المتجر يجمع بين خدمات الاتصالات الرقمية اليمنية (يمن موبايل، سبأفون، يو YOU، واي) وشحن الألعاب الإلكترونية الفوري (ببجي ويوسي PUBG UC، جواهر فري فاير Free Fire Diamonds)، بالإضافة إلى السلع الملموسة عالية الجودة كالعسل الحضرمي والتموين والأجهزة الذكية.

هنا قائمة كتالوج المنتجات الفعلية المتوفرة للبيع بالريال اليمني الموثق:
${catalogString}

إرشادات هامة للاستجابة:
1. يرجى التواصل باللغة التي يبادر بها العميل (العربية أو الإنجليزية، اللغة الحالية: ${currentLang}).
2. إذا طلب العميل منتجاً معيناً، يمكنك الإجابة عن سعره بالريال اليمني، وتحويله للدولار (بصرف ${usdRate} ريال يمني لكل دولار) والريال السعودي (بصرف ${sarRate} ريال يمني لكل ريال سعودي) عند الطلب لمساعدته على تعدد العملات.
3. ميزة "الأوامر الذكية": إذا طلب العميل شراء أو إضافة منتج إلى سلة المشتريات (مثال: "أضف عسل يمني ملكي للسلة"، "أريد شراء باقة يمن موبايل فوري"، "add pubg to my cart")، يجب أن تحلل الجملة وتصيغ ردك لتطابق صنفاً من الكتالوج وتحزم استجابة JSON تحتوي على معلومات الصنف ومحرك التحويل الإداري.
4. حافظ على نبرة فخمة، مهذبة وودودة جداً تليق بمرتبة المتجر الرفيعة.
5. لا تقم بتخيل أو اختراع باقات غير موجودة في الكتالوج الحالي أعلاه لضمان المصداقية والأمان.

صيغة الإخراج للغة البرمجية:
إذا كانت هناك نية لإضافة منتج لسلة التسوق، قم بتضمين وسم في نهاية إجابتك أو بطريقة كشف مخصصة كـ JSON:
[ACTION: {"type": "ADD_TO_CART", "productId": "MATCHED_PRODUCT_ID"}] 
تأكد من كتابة اسم المنتج ومعرفه الصحيح من كتالوج الأمان.`;

    const { data: messages, error: fetchError } = await context.supabase
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

    if (fetchError || !messages) throw new Error(`فشل استرجاع تاريخ المحادثة: ${fetchError?.message}`);

    const formattedContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : m.role, 
        parts: [{ text: m.content }]
    }));

    let responseText = "";
    let responseMetadata: any = null;
    const chatModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"];

    for (const modelName of chatModels) {
        try {
            const resp = await context.gemini.models.generateContent({
                model: modelName,
                contents: formattedContents,
                config: {
                    systemInstruction: systemPromptMessage,
                    temperature: 0.7
                }
            });
            if (resp && resp.text) {
                responseText = resp.text;
                responseMetadata = resp;
                break;
            }
        } catch (mErr: any) {
            console.log(`[ChatAgent Fallback] Model ${modelName} is busy or returned:`, mErr.message || mErr);
        }
    }

    const aiTextResponse = responseText || "عذراً، لم أستطع توليد رد مناسب حالياً من خادم الذكاء الاصطناعي بسبب الضغط المرتفع.";

    // Parse actions out of response
    let clientAction = null;
    let cleanText = aiTextResponse;
    const actionRegex = /\[ACTION:\s*({.*?})\]/;
    const match = aiTextResponse.match(actionRegex);
    if (match && match[1]) {
        try {
            const parsedAction = JSON.parse(match[1]);
            if (parsedAction.productId) {
                const prod = productsList.find(p => p.id === parsedAction.productId);
                if (prod) {
                    clientAction = { type: 'ADD_TO_CART', product: prod };
                }
            }
            cleanText = aiTextResponse.replace(actionRegex, '').trim();
        } catch (e) {
            console.error("Agent parsedAction error:", e);
        }
    }

    await context.addMessage(convId, 'assistant', cleanText);

    const tokensUsed = responseMetadata?.usageMetadata?.totalTokenCount || 0;
    await context.logUsage('chat', tokensUsed);

    return { 
        response: cleanText, 
        text: cleanText,
        action: clientAction,
        conversationId: convId,
        tokensUsed 
    };
});
