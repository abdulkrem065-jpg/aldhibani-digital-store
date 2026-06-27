import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { getGeminiClient } from './core/gemini-singleton';

// Retrieve direct environment secrets for Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let serverSupabase: any = null;
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE') {
  try {
    serverSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    // Suppress console.error in initializer to avoid infinite recursion
    process.stderr.write('AI Error Processor: Failed to initialize Supabase: ' + String(error) + '\n');
  }
}


// 5. Add AI Error Processor: analyzeError
export function getLocalHeuristicDiagnostics(errorMsg: string, code: string, details: string, hint: string) {
  const normMsg = (errorMsg + ' ' + details + ' ' + hint).toLowerCase();
  const errorCode = String(code || '').toUpperCase();

  // 1. PGRST204 / Missing column
  if (
    errorCode === 'PGRST204' || 
    normMsg.includes('human_readable') || 
    normMsg.includes('could not find the') || 
    (normMsg.includes('column') && normMsg.includes('schema cache')) ||
    normMsg.includes('column') && normMsg.includes('does not exist') && normMsg.includes('system_errors')
  ) {
    return {
      explanation: "لقد حدث تعارض بين بنية قاعدة البيانات في Supabase وطلب الحفظ، حيث تفتقر التوزيعة الافتراضية للجدول 'system_errors' لبعض الأعمدة الفرعية مثل 'human_readable'. تم حل هذا الخلل تلقائياً عبر مواءمة وحفظ البيانات ضمن مصفوفة الـ Payload البديلة.",
      rootCause: "عدم تطابق مخطط الأعمدة الصريحة لـ system_errors مع بنية الإدخال المباشر. يقوم كود المعالجة لدينا باكتشاف هذا التعارض والتحويل الآمن فوراً إلى schema mapping متوافق.",
      patch: `-- لتسوية هيكل الجدول يدوياً في Supabase SQL Command Editor:\nALTER TABLE system_errors ADD COLUMN IF NOT EXISTS human_readable TEXT;\nALTER TABLE system_errors ADD COLUMN IF NOT EXISTS root_cause TEXT;\nALTER TABLE system_errors ADD COLUMN IF NOT EXISTS suggested_patch TEXT;`
    };
  }

  // 2. 42703 (Undefined column)
  if (errorCode === '42703' || (normMsg.includes('column') && normMsg.includes('does not exist'))) {
    return {
      explanation: "يحاول التطبيق الوصول أو تعديل عمود بقاعدة البيانات غير مدرج ضمن تعريفات الجدول الحالي.",
      rootCause: "تحديثات الكود البرمجي تسبق تحديثات الجداول بقاعدة البيانات أو عدم تشغيل SQL migrations.",
      patch: `-- لتعديل وإضافة العمود المفقود بالجدول المعني:\nALTER TABLE <table_name> ADD COLUMN <column_name> TEXT;`
    };
  }

  // 3. 42501 (RLS Insufficient Permissions)
  if (errorCode === '42501' || normMsg.includes('row-level security') || normMsg.includes('violates row-level security') || normMsg.includes('permission denied')) {
    return {
      explanation: "تم حظر العملية بواسطة سياسات أمان قاعدة البيانات (Row-Level Security) في Supabase، مما يمنع الطلبات العامة غير المصادق عليها من الكتابة أو القراءة.",
      rootCause: "تفعيل RLS على لجدول دون إضافة سياسة سماح (Permissive Policy) صريحة للطلبات المجهولة (anon/authenticated).",
      patch: `-- لإنشاء سياسات سماح آمنة ومفتوحة لجدول السجلات:\nALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Allow public insert" ON system_errors FOR INSERT WITH CHECK (true);\nCREATE POLICY "Allow public select" ON system_errors FOR SELECT USING (true);`
    };
  }

  // 4. React Translation / DOM manipulation crash
  if (normMsg.includes('translation') || normMsg.includes('translate') || normMsg.includes('removechild') || (normMsg.includes('node') && normMsg.includes('parent'))) {
    return {
      explanation: "توقف غير متوقع لشجرة مكونات React بسبب محاولة إضافة أو إزالة عناصر من شجرة الـ DOM بواسطة أداة خارجية (مثل ميزة الترجمة التلقائية لـ Google Chrome).",
      rootCause: "تغيير شجرة العناصر الخارجية يدمر الإشارات الفوقية (Virtual DOM markers) لـ React مما يتسبب في حادث خطأ فادح غير معالج.",
      patch: `// للوقاية التامة من مشاكل الترجمة التلقائية بمتصفح Chrome، أضف السمة translate="no" في وسم المكون الرئيسي في index.html:\n<div id="root" translate="no"></div>`
    };
  }

  // 5. Unconfigured database or network timeouts
  if (normMsg.includes('supabase') || normMsg.includes('fetch') || normMsg.includes('network') || normMsg.includes('apikey')) {
    return {
      explanation: "فشل في تسجيل البيانات سحابياً بسبب عدم اكتمال إعداد الربط بقاعدة بيانات Supabase، أو انقطاع في الشبكة المحلية.",
      rootCause: "عدم تزويد التطبيق بمفاتيح الربط الأساسية VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY بشكل صحيح.",
      patch: "// يرجى مراجعة إعدادات مفاتيح المشروع وسرعة الاتصال بالخادم."
    };
  }

  return null;
}

export async function analyzeError(error: any): Promise<{
  explanation: string;
  rootCause: string;
  patch: string;
}> {
  const errorDetails = {
    message: error?.message || String(error),
    stack: error?.stack || '',
    code: error?.code || error?.status || '',
    details: error?.details || '',
    hint: error?.hint || ''
  };

  const ai = getGeminiClient();
  if (!ai) {
    // Return precise heuristic solution immediately if AI is unconfigured
    const localHeuristic = getLocalHeuristicDiagnostics(errorDetails.message, String(errorDetails.code), errorDetails.details, errorDetails.hint);
    if (localHeuristic) {
      return localHeuristic;
    }
    return {
      explanation: "Gemini API key is not configured in Settings > Secrets. Technical message: " + errorDetails.message,
      rootCause: "GEMINI_API_KEY has not been provided in the server environment variables.",
      patch: "Please go to Settings > Secrets and configure GEMINI_API_KEY with a valid Google Gemini key."
    };
  }

  const errorString = typeof error === 'object' ? JSON.stringify(error) : String(error);
  const prompt = `You are a world-class principal system reliability engineer and developer.
We need to debug a runtime exception from our application.
Analyze this error and determine:
1. What went wrong (friendly, clear explanation for humans)
2. The fundamental root cause (code logic, database, permissions, or inputs)
3. A suggested code patch, SQL command, or mitigation system to resolve this.

ERROR DATA:
Message: ${errorDetails.message}
Stack Trace: ${errorDetails.stack}
Error Code/Status: ${errorDetails.code}
Details: ${errorDetails.details}
Hint: ${errorDetails.hint}
Raw error dumps: ${errorString.substring(0, 500)}

Your output must be structured as valid JSON matching the schema of explanation, rootCause, and patch. Keep explanation conversational and simple. Make sure the suggested code patch is in cohesive Git diff/patch formatting, TypeScript, or plain SQL statements where appropriate.`;

  // Cascading fallback strategy through multiple model classes to secure maximum uptime
  const modelsToTry = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"];
  
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING, description: "Plain language explanation" },
              rootCause: { type: Type.STRING, description: "Detailed technical root cause" },
              patch: { type: Type.STRING, description: "Suggested fix, code diff, patch, or SQL command" }
            },
            required: ["explanation", "rootCause", "patch"]
          }
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        return {
          explanation: parsed.explanation || 'No explanation provided by AI.',
          rootCause: parsed.rootCause || 'No root cause identified.',
          patch: parsed.patch || ''
        };
      }
    } catch (err: any) {
      console.log(`[AI Error Processor] Model ${modelName} call failed or busy: ${err.message || err}`);
    }
  }

  // Fallback to beautiful local heuristic rule-based engine if all models are busy/503/429
  const localHeuristic = getLocalHeuristicDiagnostics(errorDetails.message, String(errorDetails.code), errorDetails.details, errorDetails.hint);
  if (localHeuristic) {
    return localHeuristic;
  }

  // Robust final safety layout
  const readableCode = errorDetails.code ? `رمز الاستثناء: ${errorDetails.code}` : "استثناء برمجي غير محدد";
  return {
    explanation: `لقد واجه النظام خطأً فنياً: ${errorDetails.message}`,
    rootCause: `حدث خلل في معالجة إحدى العمليات للنواة البرمجية. (${readableCode})`,
    patch: `// كود تصحيحي عام:\n// في الغالب يرجع السبب إلى عدم مطابقة البيانات أو فقد دالة تشغيلية.\n// تتبع رسالة الاستثناء لمعالجة مواضع المتغيرات.`
  };
}

// 2. centralized function createAIErrorReport(error, context)
export const localSystemErrors: any[] = [];

export async function createAIErrorReport(error: any, context: string) {
  const errorMsg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
  const errorType = error?.type || (context?.includes('React') ? 'ReactRuntime' : context?.includes('Supabase') ? 'SupabaseAPI' : 'NodeJS');
  const errorStack = error?.stack || '';
  const errorCode = String(error?.code || error?.status || '');
  
  // Parse file and function names from call stack if available
  let fileName: string | null = null;
  let functionName: string | null = null;
  if (errorStack) {
    const lines = errorStack.split('\n');
    const firstTraceLine = lines.find((l: string) => l.includes('at ') && !l.includes('ai-error-processor'));
    if (firstTraceLine) {
      const matchFile = firstTraceLine.match(/\((.*):(\d+):(\d+)\)/) || firstTraceLine.match(/at\s+(.*):(\d+):(\d+)/);
      if (matchFile) {
        fileName = matchFile[1].split('/').pop() || null;
      }
      const matchFunc = firstTraceLine.match(/at\s+(.*?)\s+\(/) || firstTraceLine.match(/at\s+(.*?)$/);
      if (matchFunc) {
        functionName = matchFunc[1].trim();
      }
    }
  }

  const payload = {
    stack: errorStack,
    code: errorCode || null,
    details: error?.details || null,
    hint: error?.hint || null,
    contextName: context,
    timestamp: new Date().toISOString()
  };

  // Get AI Analysis
  const analysis = await analyzeError(error);

  // Print results nicely to console stdout (not stderr to prevent infinite loops)
  process.stdout.write(`\n====== 🤖 CENTRAL AI DEBUGGER ENGINE EXCEPTION RAPID REPORT ======\n`);
  process.stdout.write(`[Context]: ${context}\n`);
  process.stdout.write(`[Message]: ${errorMsg}\n`);
  process.stdout.write(`[Human-Friendly Explanation]:\n${analysis.explanation}\n\n`);
  process.stdout.write(`[Deep Root-Cause Identification]:\n${analysis.rootCause}\n\n`);
  if (analysis.patch) {
    process.stdout.write(`[Auto-Suggested Patch/Code Rectification]:\n${analysis.patch}\n`);
  }
  process.stdout.write(`==================================================================\n\n`);

  // Cache locally in-memory first to ensure we never lose error logs even if DB is offline or restricted
  const memoryLog = {
    id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: errorType,
    error_message: errorMsg,
    error_code: errorCode || 'UNSPECIFIED',
    file_name: fileName,
    function_name: functionName,
    stack_trace: errorStack || null,
    explanation: analysis.explanation,
    rootCause: analysis.rootCause,
    patch: analysis.patch,
    payload,
    created_at: new Date().toISOString()
  };
  localSystemErrors.push(memoryLog);
  // Cap at 200 items to avoid any memory leak
  if (localSystemErrors.length > 200) {
    localSystemErrors.shift();
  }

  // Store in system_errors table
  if (serverSupabase) {
    try {
      // First try inserting with the fallback columns we checked inside database
      const fallbackPayload = {
        ...payload,
        ...analysis
      };

      const { data, error: insertErr } = await serverSupabase.from('system_errors').insert({
        source: errorType,
        error_message: errorMsg,
        error_code: errorCode || 'UNSPECIFIED',
        file_name: fileName,
        function_name: functionName,
        stack_trace: errorStack || null,
        payload: fallbackPayload,
        created_at: new Date().toISOString()
      }).select();

      if (insertErr) {
        // Check if error is due to RLS. If so, do not attempt fallback write as it will also be blocked.
        const isRLSError = insertErr.code === '42501' || 
                           insertErr.message?.toLowerCase().includes('row-level security') || 
                           insertErr.message?.toLowerCase().includes('violates row-level security') || 
                           insertErr.message?.toLowerCase().includes('permission denied');

        if (isRLSError) {
          process.stdout.write(`[AI Error Processor Notice] Diagnostics saved in server memory (RLS policy active on system_errors table).\n`);
        } else {
          process.stdout.write(`[AI Error Processor] Supabase store update check: schema adjustment needed. Checking details...\n`);
          // Process schema mismatch fallback only when not blocked by RLS
          const { error: reqSchemaErr } = await serverSupabase.from('system_errors').insert({
            type: errorType,
            message: errorMsg,
            human_readable: analysis.explanation,
            root_cause: analysis.rootCause,
            suggested_patch: analysis.patch,
            payload: payload,
            created_at: new Date().toISOString()
          });

          if (reqSchemaErr) {
            process.stdout.write(`[AI Error Processor Notice] Diagnostics saved in server memory only (Table structure adjustment requested).\n`);
          } else {
            process.stdout.write(`[AI Error Processor] Persisted successfully using user requested table schema!\n`);
          }
        }
      } else {
        process.stdout.write(`[AI Error Processor] Persisted successfully using active database schema mapping!\n`);
      }
    } catch (insertException: any) {
      process.stdout.write(`[AI Error Processor Exception] Database insertion failure: ${insertException.message}\n`);
    }
  } else {
    process.stdout.write(`[AI Error Processor Notice] Supabase is unconfigured; skipping persistent write\n`);
  }

  return {
    type: errorType,
    message: errorMsg,
    ...analysis,
    payload
  };
}

// 6. Define AI Logger for the Node.js server
let isReportingInLogger = false;

export const aiLogger = {
  error: (...args: any[]) => {
    // Always delegate to standard string output so the developer still sees log traces in normal form
    const msg = args.map(arg => {
      if (arg instanceof Error) {
        return arg.stack || arg.message;
      }
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    }).join(' ');
    
    process.stderr.write(`[SERVER_ERROR] ${msg}\n`);

    // Prevent infinite recursion in case reports or database updates trigger errors
    if (isReportingInLogger) return;
    isReportingInLogger = true;

    // Convert args into a structured Error object or custom context
    const firstArg = args[0];
    let activeError: any;
    if (firstArg instanceof Error) {
      activeError = firstArg;
    } else {
      activeError = new Error(msg);
      // Attempt to check if we supplied special Supabase error keys
      if (typeof firstArg === 'object') {
        if (firstArg.code) activeError.code = firstArg.code;
        if (firstArg.details) activeError.details = firstArg.details;
        if (firstArg.hint) activeError.hint = firstArg.hint;
        if (firstArg.message) activeError.message = firstArg.message;
      }
    }

    // Capture context info
    let context = 'NodeJS Server Logger';
    if (msg.includes('SUPABASE')) {
      context = 'Supabase API Server Operations';
      activeError.type = 'SupabaseAPI';
    }

    createAIErrorReport(activeError, context)
      .finally(() => {
        isReportingInLogger = false;
      });
  }
};
