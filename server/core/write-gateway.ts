import { GoogleGenAI, Type } from '@google/genai';
import { mapProductFromDB } from '../../src/lib/supabase';
import { getGeminiClient } from './gemini-singleton';

export class WriteGatewayError extends Error {
  public explanation?: string;
  public rootCause?: string;
  public patch?: string;

  constructor(message: string, explanation?: string, rootCause?: string, patch?: string) {
    super(message);
    this.name = 'WriteGatewayError';
    this.explanation = explanation;
    this.rootCause = rootCause;
    this.patch = patch;
  }
}


export function validatePayloadAgainstSchema(payload: any, isBatch: boolean = false): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const items = isBatch ? payload : [payload];

  for (let i = 0; i < items.length; i++) {
    const p = items[i];
    const prefix = isBatch ? `[Item at index ${i}] ` : '';

    if (!p || typeof p !== 'object') {
      errors.push(`${prefix}Payload is empty or not an object`);
      continue;
    }

    // ID is required
    const idVal = p.id;
    if (idVal === undefined || idVal === null || String(idVal).trim() === '') {
      errors.push(`${prefix}Field 'id' is required and must not be empty`);
    } else if (typeof idVal !== 'string') {
      errors.push(`${prefix}Field 'id' must be a string, got ${typeof idVal}`);
    }

    // name_ar or nameAR is required
    const nameAr = p.name_ar !== undefined ? p.name_ar : p.nameAR;
    if (nameAr === undefined || nameAr === null || String(nameAr).trim() === '') {
      errors.push(`${prefix}Field 'name_ar' (or nameAR) is required`);
    } else if (typeof nameAr !== 'string') {
      errors.push(`${prefix}Field 'name_ar' (or nameAR) must be a string, got ${typeof nameAr}`);
    }

    // price_yer or priceYER must be a valid number and >= 0
    const price = p.price_yer !== undefined ? p.price_yer : p.priceYER;
    if (price === undefined || price === null) {
      errors.push(`${prefix}Field 'price_yer' (or priceYER) is required`);
    } else {
      const numPrice = Number(price);
      if (isNaN(numPrice)) {
        errors.push(`${prefix}Field 'price_yer' (or priceYER) must be a valid number, got '${price}'`);
      } else if (numPrice < 0) {
        errors.push(`${prefix}Field 'price_yer' (or priceYER) must be non-negative, got ${price}`);
      }
    }

    // stock must be a number if defined
    const stock = p.stock !== undefined ? p.stock : (p.stock_count !== undefined ? p.stock_count : undefined);
    if (stock !== undefined && stock !== null) {
      const numStock = Number(stock);
      if (isNaN(numStock)) {
        errors.push(`${prefix}Field 'stock' must be a valid number, got '${stock}'`);
      }
    }

    // check booleans
    const isAvail = p.is_available !== undefined ? p.is_available : p.isAvailable;
    if (isAvail !== undefined && isAvail !== null && typeof isAvail !== 'boolean') {
      errors.push(`${prefix}Field 'is_available' (or isAvailable) must be a boolean, got ${typeof isAvail}`);
    }

    const isAiS = p.is_ai_suggested !== undefined ? p.is_ai_suggested : p.is_ai_suggested;
    if (isAiS !== undefined && isAiS !== null && typeof isAiS !== 'boolean') {
      errors.push(`${prefix}Field 'is_ai_suggested' must be a boolean, got ${typeof isAiS}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function analyzeWriteError(errorMessage: string, payload: any, details?: any): Promise<WriteGatewayError> {
  const isDebugMode = process.env.DEBUG_AI === 'true';

  // If debug mode is disabled, return a standard error but wrapped in WriteGatewayError
  if (!isDebugMode) {
    return new WriteGatewayError(
      errorMessage,
      `AI Debug mode is disabled. Enacted standard safeguards. Technical error: ${errorMessage}`,
      "Standard runtime database or payload validation check failure.",
      "// Enable DEBUG_AI=true in environment variables to receive AI diagnosis."
    );
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Local heuristic developer support
    const localExplanation = `فشل في كتابة البيانات: ${errorMessage}. لم يتم تفعيل مفتاح Gemini API في البيئة البرمجية.`;
    const localRootCause = `البيانات المرسلة غير متوافقة مع مخطط جدول المنتجات (Supabase 'products' table schema). التفاصيل: ${JSON.stringify(details || {})}`;
    const localPatch = `// اقتراح لتصحيح البيانات:\n// تأكد من تمرير الحقول الإلزامية مثل id و name_ar و price_yer بالصيغ الصحيحة.\n// مفتاح GEMINI_API_KEY غير موجود في إعدادات الأسرار.`;
    return new WriteGatewayError(errorMessage, localExplanation, localRootCause, localPatch);
  }

  const errorString = JSON.stringify(details || {});
  const payloadString = JSON.stringify(payload || {});

  const prompt = `You are a world-class principal reliability engineer and database systems expert.
An error or schema validation failure occurred when attempting to write data to the 'products' table.

TABLE SCHEMA CONSTRAINTS:
- id: string (required, primary key, unique)
- name_ar: string (required, non-empty, Arabic name)
- name_en: string (optional, English name)
- description_ar: string (optional, Arabic description)
- description_en: string (optional, English description)
- category: string (optional, category string e.g. PHYSICAL_GROCERY, CARDS...)
- brand: string (optional)
- price_yer: number (required, non-negative integer representation of price in Yemeni Riyal)
- image_url: string (optional, public accessible image URL)
- is_available: boolean (optional, default true, availability status)
- stock: number (optional, integer representation of stock)
- recharge_amount: number (optional, game recharge card amount value)
- organization_id: string (optional, ID tracking owner organization)
- product_image_url: string (optional, alternative image mapping link)
- is_ai_suggested: boolean (optional, true if created by Assistant suggestions)
- ai_suggested_url: string (optional, original image reference suggested by Gemini)

ERROR MESSAGE DETECTED:
${errorMessage}

RAW ERROR/CONTEXT DATA:
${errorString}

ATTEMPTED PAYLOAD SENT TO DATABASE:
${payloadString}

Task:
Perform a deep diagnostic analysis of this write operations failure.
Determine:
1. "explanation": A friendly, high-level, human-readable explanation of why this write failed or is invalid (written in Arabic, styled in a warm and polite way).
2. "rootCause": Identify the exact structural mismatch, database restriction, type violation, or logic flaw causing this error (written in Arabic).
3. "patch": Suggest a practical code patch, TypeScript mapper fix, or SQL script/schema modification snippet that mitigates this problem.

You MUST respond strictly with a valid JSON block conforming to the schema of explanation, rootCause, and patch. Keep it concise, professional, and practical. No markdown formatting wraps other than raw text keys.`;

  try {
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"];
    let responseText = "";

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
                explanation: { type: Type.STRING },
                rootCause: { type: Type.STRING },
                patch: { type: Type.STRING }
              },
              required: ["explanation", "rootCause", "patch"]
            }
          }
        });
        if (response && response.text) {
          responseText = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.log(`[WriteGateway AI Debug] Model ${modelName} failed or busy: ${err.message || err}`);
      }
    }

    if (responseText) {
      const parsed = JSON.parse(responseText);
      return new WriteGatewayError(
        errorMessage,
        parsed.explanation || 'تعذر الحصول على تفسير من الذكاء الاصطناعي.',
        parsed.rootCause || 'السبب الرئيسي غير محدد.',
        parsed.patch || ''
      );
    }
  } catch (err: any) {
    console.error(`[WriteGateway AI Debug] Failed to generate AI analysis:`, err);
  }

  // Fallback if AI call failed
  return new WriteGatewayError(
    errorMessage,
    `فشل فحص التحقق من البيانات: ${errorMessage}`,
    "البيانات المدخلة لا تتطابق برمجياً مع تفاصيل جدول المنتجات في قاعدة البيانات أو أن قاعدة البيانات غير مهيأة بالشكل الصحيح.",
    "// يرجى تصحيح قيم حقول المنتج المرسلة لتتوافق مع المخطط الهيكلي."
  );
}

// Enforce single-source mapping
export const mapProductToDB = (p: any): any => {
  if (!p) return p;
  return {
    id: p.id,
    name_ar: p.nameAR || p.name_ar,
    name_en: p.nameEN || p.name_en || p.nameAR || p.name_ar,
    description_ar: p.descriptionAR || p.description_ar,
    description_en: p.descriptionEN || p.description_en,
    category: p.category,
    brand: p.brand,
    price_yer: Number(p.priceYER !== undefined ? p.priceYER : (p.price_yer || 1000)),
    image_url: p.imageUrl || p.image_url,
    is_available: p.isAvailable !== undefined ? Boolean(p.isAvailable) : (p.is_available !== undefined ? Boolean(p.is_available) : true),
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : (p.stock_count !== undefined ? Number(p.stock_count) : null),
    recharge_amount: p.rechargeAmount || p.recharge_amount || null,
    organization_id: p.organization_id || null,
    product_image_url: p.product_image_url || null,
    is_ai_suggested: p.is_ai_suggested !== undefined ? Boolean(p.is_ai_suggested) : null,
    ai_suggested_url: p.ai_suggested_url || null,
  };
};

function checkWriteMode() {
  if (process.env.WRITE_MODE !== "server") {
    throw new Error("Direct DB write blocked");
  }
}

function validateProduct(p: any) {
  if (!p) {
    throw new Error("ValidationError: Product payload is empty");
  }
  if (!p.id) {
    throw new Error("ValidationError: Product is missing an ID");
  }
  const name = p.nameAR || p.name_ar || p.nameEN || p.name_en;
  if (!name || name.trim() === '') {
    throw new Error(`ValidationError: Product ${p.id} must have a name`);
  }
}

export class WriteGateway {
  /**
   * Performs an upsert of a single product to Supabase.
   */
  public static async upsertProduct(supabaseClient: any, product: any, storeDatabase?: any): Promise<any> {
    checkWriteMode();

    // Validate payload against schema before execution
    const check = validatePayloadAgainstSchema(product, false);
    if (!check.isValid) {
      const errMsg = `ValidationError: Schema mismatch. Errors: ${check.errors.join(', ')}`;
      console.error(`[WriteGateway Validation Fail] ${errMsg}`);
      const aiError = await analyzeWriteError(errMsg, product, { validationErrors: check.errors });
      throw aiError;
    }

    validateProduct(product);

    console.log(`[WriteGateway] Initiating upsert for single product ID: ${product.id}`);
    
    const dbPayload = mapProductToDB(product);
    
    if (!supabaseClient) {
      console.warn(`[WriteGateway Warning] Supabase client is not available or offline. Caching write locally only.`);
      this.syncLocalMemoryStore('products', [product], storeDatabase);
      return product;
    }

    try {
      const { data, error } = await supabaseClient.from('products').upsert(dbPayload).select();
      
      if (error) {
        console.error(`[WriteGateway Error] Database write failed for product ${product.id}:`, JSON.stringify(error, null, 2));
        const aiError = await analyzeWriteError(`Database write failed: ${error.message}`, product, error);
        throw aiError;
      }

      console.log(`[WriteGateway Success] Successfully upserted product ID: ${product.id}`);

      // Update the in-memory React server database copy if passed
      this.syncLocalMemoryStore('products', [product], storeDatabase);

      if (data && data.length > 0) {
        return data[0];
      }
      return dbPayload;
    } catch (dbErr: any) {
      if (dbErr instanceof WriteGatewayError) {
        throw dbErr;
      }
      const aiError = await analyzeWriteError(dbErr.message || 'Database execution exception', product, dbErr);
      throw aiError;
    }
  }

  /**
   * Performs a batch upsert of multiple products.
   */
  public static async upsertProductsBatch(supabaseClient: any, products: any[], storeDatabase?: any): Promise<any[]> {
    checkWriteMode();
    if (!Array.isArray(products)) {
      const errMsg = "Batch payload must be an array of products";
      const aiError = await analyzeWriteError(errMsg, products, { reason: "Payload is not an array" });
      throw aiError;
    }

    // Validate batch payloads against schema before execution
    const check = validatePayloadAgainstSchema(products, true);
    if (!check.isValid) {
      const errMsg = `ValidationError: Batch Schema mismatch. Errors: ${check.errors.join(', ')}`;
      console.error(`[WriteGateway Batch Validation Fail] ${errMsg}`);
      const aiError = await analyzeWriteError(errMsg, products, { validationErrors: check.errors });
      throw aiError;
    }

    console.log(`[WriteGateway] Initiating batch upsert for ${products.length} products`);
    
    products.forEach(validateProduct);
    const dbPayloads = products.map(mapProductToDB);

    if (!supabaseClient) {
      console.warn(`[WriteGateway Warning] Supabase client offline. Caching batch write locally.`);
      this.syncLocalMemoryStore('products', products, storeDatabase);
      return dbPayloads;
    }

    try {
      const { data, error } = await supabaseClient.from('products').upsert(dbPayloads).select();
      
      if (error) {
        console.error(`[WriteGateway Error] Batch database write failed:`, JSON.stringify(error, null, 2));
        const aiError = await analyzeWriteError(`Batch write failed: ${error.message}`, products, error);
        throw aiError;
      }

      console.log(`[WriteGateway Success] Successfully upserted batch of ${products.length} products`);

      this.syncLocalMemoryStore('products', products, storeDatabase);

      return data || dbPayloads;
    } catch (dbErr: any) {
      if (dbErr instanceof WriteGatewayError) {
        throw dbErr;
      }
      const aiError = await analyzeWriteError(dbErr.message || 'Database execution exception', products, dbErr);
      throw aiError;
    }
  }

  /**
   * Deletes a product by ID.
   */
  public static async deleteProduct(supabaseClient: any, id: string, storeDatabase?: any): Promise<boolean> {
    checkWriteMode();
    if (!id) {
      const errMsg = "DeleteError: Product ID is required";
      const aiError = await analyzeWriteError(errMsg, { id }, { reason: "Null id deletion" });
      throw aiError;
    }

    console.log(`[WriteGateway] Initiating deletion of product ID: ${id}`);

    if (storeDatabase && storeDatabase.products) {
      storeDatabase.products = storeDatabase.products.filter((p: any) => p.id !== id);
    }

    if (!supabaseClient) {
      console.warn(`[WriteGateway Warning] Supabase client offline. Completed memory deletion of product ID: ${id}`);
      return true;
    }

    try {
      const { error } = await supabaseClient.from('products').delete().eq('id', id);
      
      if (error) {
        console.error(`[WriteGateway Error] Database delete failed for product ID ${id}:`, JSON.stringify(error, null, 2));
        const aiError = await analyzeWriteError(`Database delete failed: ${error.message}`, { id }, error);
        throw aiError;
      }

      console.log(`[WriteGateway Success] Successfully deleted product ID: ${id}`);
      return true;
    } catch (dbErr: any) {
      if (dbErr instanceof WriteGatewayError) {
        throw dbErr;
      }
      const aiError = await analyzeWriteError(dbErr.message || 'Database execution exception', { id }, dbErr);
      throw aiError;
    }
  }

  /**
   * Clears all products (except keep-dummy placeholder if configured).
   */
  public static async clearAllProducts(supabaseClient: any, storeDatabase?: any): Promise<boolean> {
    checkWriteMode();
    console.log(`[WriteGateway] Initiating truncation / clean sweep of products table.`);

    if (storeDatabase) {
      storeDatabase.products = [];
    }

    if (!supabaseClient) {
      console.warn(`[WriteGateway Warning] Supabase client offline. Cleared local products memories.`);
      return true;
    }

    try {
      const { error } = await supabaseClient.from('products').delete().neq('id', 'keep-dummy');
      
      if (error) {
        console.error(`[WriteGateway Error] Database clear failed:`, JSON.stringify(error, null, 2));
        const aiError = await analyzeWriteError(`Database clear failed: ${error.message}`, { action: "clearAllProducts" }, error);
        throw aiError;
      }

      console.log(`[WriteGateway Success] Successfully cleared all products from database.`);
      return true;
    } catch (dbErr: any) {
      if (dbErr instanceof WriteGatewayError) {
        throw dbErr;
      }
      const aiError = await analyzeWriteError(dbErr.message || 'Database execution exception', { action: "clearAllProducts" }, dbErr);
      throw aiError;
    }
  }

  /**
   * Performs batch deletion of products (e.g. for rollback steps).
   */
  public static async deleteProductsBatch(supabaseClient: any, ids: string[], storeDatabase?: any): Promise<boolean> {
    checkWriteMode();
    if (!ids || ids.length === 0) return true;

    console.log(`[WriteGateway] Initiating batch deletion of ${ids.length} products`);

    if (storeDatabase && storeDatabase.products) {
      storeDatabase.products = storeDatabase.products.filter((p: any) => !ids.includes(p.id));
    }

    if (!supabaseClient) return true;

    try {
      const { error } = await supabaseClient.from('products').delete().in('id', ids);
      if (error) {
        console.error(`[WriteGateway Error] Batch delete products failed:`, JSON.stringify(error, null, 2));
        const aiError = await analyzeWriteError(`Database batch delete failed: ${error.message}`, { ids }, error);
        throw aiError;
      }

      console.log(`[WriteGateway Success] Successfully batch deleted ${ids.length} products`);
      return true;
    } catch (dbErr: any) {
      if (dbErr instanceof WriteGatewayError) {
        throw dbErr;
      }
      const aiError = await analyzeWriteError(dbErr.message || 'Database execution exception', { ids }, dbErr);
      throw aiError;
    }
  }

  /**
   * Dual syncer fallback for memory state synchronization.
   */
  private static syncLocalMemoryStore(tableName: string, chunk: Record<string, any>[], storeDatabase: any) {
    if (!storeDatabase) return;
    
    if (tableName === 'products') {
      if (!storeDatabase.products) storeDatabase.products = [];
      for (const rec of chunk) {
        const mappedProduct = {
          id: rec.id,
          nameAR: rec.nameAR || rec.name_ar,
          nameEN: rec.nameEN || rec.name_en || rec.nameAR || rec.name_ar,
          descriptionAR: rec.descriptionAR || rec.description_ar || '',
          descriptionEN: rec.descriptionEN || rec.description_en || '',
          category: rec.category || 'عام',
          priceYER: Number(rec.priceYER !== undefined ? rec.priceYER : (rec.price_yer || 1000)),
          imageUrl: rec.imageUrl || rec.image_url || '',
          isAvailable: rec.isAvailable !== false && rec.is_available !== false,
          stock: Number(rec.stock !== undefined ? rec.stock : 0),
          brand: rec.brand || 'عام',
          rechargeAmount: rec.rechargeAmount || rec.recharge_amount || ''
        };
        const idx = storeDatabase.products.findIndex((p: any) => p.id === mappedProduct.id);
        if (idx !== -1) {
          storeDatabase.products[idx] = { ...storeDatabase.products[idx], ...mappedProduct };
        } else {
          storeDatabase.products.unshift(mappedProduct);
        }
      }
    }
  }
}
