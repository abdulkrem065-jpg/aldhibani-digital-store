import { getSalesContext } from './context/sales.context';
import { getInventoryContext } from './context/inventory.context';
import { getProductsContext } from './context/products.context';
import { getCustomersContext } from './context/customers.context';
import { getFinanceContext } from './context/finance.context';
import { getOrganizationsContext } from './context/organizations.context';

export interface ContextPayload {
  sales?: string;
  inventory?: string;
  products?: string;
  customers?: string;
  finance?: string;
  organization?: string;
}

export class AssistantContextCompiler {
  /**
   * Compiles secure context based on targeted keywords in the prompt.
   * This ensures the context window remains optimized and irrelevant data is ignored.
   */
  static async compileContext(
    prompt: string,
    storeDatabase: any,
    supabase: any,
    orgId?: string
  ): Promise<string> {
    const queryLower = prompt.toLowerCase();
    const topics: { [key: string]: boolean } = {
      sales: false,
      inventory: false,
      products: false,
      customers: false,
      finance: false,
      organization: false
    };

    // Keyword matching logic
    const salesKeywords = ['مبيعات', 'بيع', 'فواتير', 'فاتورة', 'sales', 'orders', 'revenues', 'سلة', 'شراء'];
    const inventoryKeywords = ['مخزون', 'مستودع', 'كمية', 'كميات', 'ناقص', 'مخزن', 'stock', 'inventory', 'quantity', 'low stock'];
    const productsKeywords = ['منتج', 'أصناف', 'صنف', 'سعر', 'أسعار', 'باقة', 'رصيد', 'شحن', 'products', 'prices', 'cards', 'recharge'];
    const customersKeywords = ['عملاء', 'عميل', 'ديون', 'دين', 'دائن', 'مدين', 'زبائن', 'customers', 'debts', 'debtors'];
    const financeKeywords = ['مالية', 'فلوس', 'صندوق', 'كاش', 'حسابات', 'صرف', 'عملة', 'صرافة', 'finance', 'money', 'rates', 'currencies'];
    const organizationKeywords = ['مؤسسة', 'فرع', 'فروع', 'موظفين', 'صلاحيات', 'organization', 'tenant', 'staff', 'roles'];

    if (salesKeywords.some(kw => queryLower.includes(kw))) topics.sales = true;
    if (inventoryKeywords.some(kw => queryLower.includes(kw))) topics.inventory = true;
    if (productsKeywords.some(kw => queryLower.includes(kw))) topics.products = true;
    if (customersKeywords.some(kw => queryLower.includes(kw))) topics.customers = true;
    if (financeKeywords.some(kw => queryLower.includes(kw))) topics.finance = true;
    if (organizationKeywords.some(kw => queryLower.includes(kw))) topics.organization = true;

    // Default to compiling general/products and organizations if no specific topic was hit
    if (!Object.values(topics).some(val => val)) {
      topics.products = true;
      topics.organization = true;
    }

    const compiled: ContextPayload = {};

    if (topics.sales) {
      compiled.sales = await getSalesContext(storeDatabase, supabase, orgId);
    }
    if (topics.inventory) {
      compiled.inventory = await getInventoryContext(storeDatabase, supabase, orgId);
    }
    if (topics.products) {
      compiled.products = await getProductsContext(storeDatabase, supabase, orgId);
    }
    if (topics.customers) {
      compiled.customers = await getCustomersContext(storeDatabase, supabase, orgId);
    }
    if (topics.finance) {
      compiled.finance = await getFinanceContext(storeDatabase, supabase, orgId);
    }
    if (topics.organization) {
      compiled.organization = await getOrganizationsContext(storeDatabase, supabase, orgId);
    }

    // Wrap for Gemini ingestion
    let contextHeader = `=== SECURE CURRENT CONTEXT FOR SMART STORE (MULTI-TENANT ISOLATED: Org: ${orgId || 'DEFAULT'}) ===\n`;
    contextHeader += `The language of the user conversation is Arabic/English.\n`;
    contextHeader += `Here is real-time, read-only analytical database context compiled specifically for this request. Gemini has NO direct SQL query capability. Rely ONLY on the verified data below:\n\n`;

    if (compiled.organization) {
      contextHeader += `[ORGANIZATION & INFRASTRUCTURE PROFILE]\n${compiled.organization}\n\n`;
    }
    if (compiled.products) {
      contextHeader += `[PRODUCTS AVAILABLE / CATALOG SAMPLE]\n${compiled.products}\n\n`;
    }
    if (compiled.inventory) {
      contextHeader += `[INVENTORY & STOCK STATUS]\n${compiled.inventory}\n\n`;
    }
    if (compiled.sales) {
      contextHeader += `[SALES, RECENT INVOICES & REVENUES]\n${compiled.sales}\n\n`;
    }
    if (compiled.customers) {
      contextHeader += `[CUSTOMERS & OUTSTANDING DEBTS SUMMARY]\n${compiled.customers}\n\n`;
    }
    if (compiled.finance) {
      contextHeader += `[FINANCE OVERVIEW & METRICS]\n${compiled.finance}\n\n`;
    }

    contextHeader += `=== END OF DATABASE CONTEXT ===\n`;
    return contextHeader;
  }
}
