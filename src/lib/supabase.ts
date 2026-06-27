/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, StoreConfig, CustomCategory, Order, DebtRecord, StaffUser, Banner } from '../types';
import { 
  DEFAULT_STORE_CONFIG, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, 
  DEFAULT_ORDERS, DEFAULT_DEBTS, DEFAULT_STAFF, DEFAULT_BANNERS 
} from '../data/defaultData';

export const mapProductToDB = (p: any) => ({
  id: p.id,
  name_ar: p.nameAR,
  name_en: p.nameEN,
  description_ar: p.descriptionAR,
  description_en: p.descriptionEN,
  category: p.category,
  brand: p.brand,
  price_yer: Number(p.priceYER || 0),
  image_url: p.imageUrl,
  is_available: Boolean(p.isAvailable),
  stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : null,
  recharge_amount: p.rechargeAmount,
  organization_id: p.organization_id || null,
  product_image_url: p.product_image_url || null,
  is_ai_suggested: p.is_ai_suggested !== undefined ? Boolean(p.is_ai_suggested) : null,
  ai_suggested_url: p.ai_suggested_url || null,
});

export const mapProductFromDB = (p: any): Product => {
  if (!p) return p;
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
    isAvailable: Boolean(p.is_available),
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : undefined,
    rechargeAmount: p.recharge_amount || '',
    product_image_url: p.product_image_url || undefined,
    is_ai_suggested: p.is_ai_suggested || false,
    ai_suggested_url: p.ai_suggested_url || undefined,
    organization_id: p.organization_id || undefined,
  } as any;
};

// Retrieve direct environment secrets for Supabase real-time connection
const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 
  '';

const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
  '';

export let supabase: SupabaseClient | null = null;

if (
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE'
) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('⚡ Supabase Client initialized successfully for Aldhibani Master Database!');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export interface MoneyBox {
  id: string;
  nameAR: string;
  nameEN: string;
  balanceYER: number;
  descriptionAR: string;
  descriptionEN: string;
}

export interface YouthWorkforceProfile {
  id: string;
  name: string;
  role: string;
  commissionRate: number; // e.g. 5% commission on dispatches
  totalCommissionEarnedYER: number;
  activeShiftStatus: 'ACTIVE' | 'OFFLINE';
  completedTasksCount: number;
}

const INITIAL_MONEY_BOXES: MoneyBox[] = [
  {
    id: 'box-main',
    nameAR: 'صندوق الخزينة الرئيسي YER',
    nameEN: 'Main Central Safe Box YER',
    balanceYER: 500000,
    descriptionAR: 'الخزينة الاستراتيجية لحفظ السيولة النقدية والعمليات الكبرى بمستودع الذيباني VIP',
    descriptionEN: 'Strategic safe box for major financial reserves and cash operations'
  },
  {
    id: 'box-daily',
    nameAR: 'صندوق المبيعات والتموينات اليومية YER',
    nameEN: 'Daily Storefront Sales YER',
    balanceYER: 150000,
    descriptionAR: 'حساب مبيعات التجزئة للمواد الغذائية الحضرمية والتموينات الفاخرة',
    descriptionEN: 'Retail counter operations for gourmet spices and organic dispatches'
  },
  {
    id: 'box-telecom',
    nameAR: 'صندوق فوري رصيد وباقات الهاتف YER',
    nameEN: 'Telecom Airtime Fund YER',
    balanceYER: 80000,
    descriptionAR: 'مخصص تدوير عمليات الشحن الفوري وصناديق الاتصالات (يمن موبايل، سبأفون، يو)',
    descriptionEN: 'Capital loop fund for instant airtime operations and mobile dispatches'
  },
  {
    id: 'box-games',
    nameAR: 'صندوق شحن ألعاب وكروت بيبجي وفري فاير YER',
    nameEN: 'Cyber Gaming & Voucher Vault YER',
    balanceYER: 50000,
    descriptionAR: 'صندوق تدفقات أرباح شحن ألعاب فوري كروت ببجي موبايل وجواهر فري فاير بالآيدي',
    descriptionEN: 'Voucher sales fund for battle pass top ups and direct ID loading'
  }
];

const INITIAL_YOUTH_WORKFORCE: YouthWorkforceProfile[] = [
  {
    id: 'workforce-1',
    name: 'عبدالوالي الذيباني (كادر مبيعات)',
    role: 'CASHIER',
    commissionRate: 0.02, // 2% commission
    totalCommissionEarnedYER: 14200,
    activeShiftStatus: 'ACTIVE',
    completedTasksCount: 42
  },
  {
    id: 'workforce-2',
    name: 'أمين الريمي (مشرف فوري باقات)',
    role: 'COMMUNICATIONS',
    commissionRate: 0.03, // 3% commission
    totalCommissionEarnedYER: 21800,
    activeShiftStatus: 'ACTIVE',
    completedTasksCount: 68
  },
  {
    id: 'workforce-3',
    name: 'صالح الهمداني (مسئول علاقات وتتبع)',
    role: 'STORE_MANAGER',
    commissionRate: 0.025, // 2.5% commission
    totalCommissionEarnedYER: 18450,
    activeShiftStatus: 'OFFLINE',
    completedTasksCount: 29
  }
];

// High-durability local client-side cloud database manager (Supabase / Serverless wrapper)
export class SupabaseServerlessDB {
  private static clientProducts: Product[] = [];

  private static get<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(key);
      if (val) return JSON.parse(val);
    } catch (e) {
      console.warn("Storage read failure", e);
    }
    return defaultValue;
  }

  private static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Storage write failure", e);
    }
  }

  // --- Real Supabase Helper operations for background integration ---
  private static toUUID(str: string): string {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (uuidRegex.test(str)) return str;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padEnd(8, '0') + 
                Math.abs(hash * 31).toString(16).padEnd(8, '0') + 
                Math.abs(hash * 47).toString(16).padEnd(8, '0') + 
                Math.abs(hash * 63).toString(16).padEnd(8, '0');
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      '4' + hex.substring(13, 16),
      'a' + hex.substring(17, 20),
      hex.substring(20, 32)
    ].join('-');
  }

  private static async asyncUpsert(table: string, payload: any) {
    if (!supabase) {
      console.warn(`[Supabase AsyncUpsert] Skip writing to '${table}' because Supabase client is not initialized.`);
      return;
    }
    
    let finalPayload = payload;
    if (table === 'store_config') {
      console.log(`[Supabase AsyncUpsert] Bypassing client-side direct write for table 'store_config'. Updates are handled securely via backend API (/api/config).`);
      return;
    } else if (table === 'products') {
      console.warn("❌ [Supabase AsyncUpsert Blocked] Direct client-side write to 'products' requested but is strictly BLOCKED by protocol.");
      return;
    }
    
    console.log(`=== [Supabase AsyncUpsert PRE-WRITE TRACE] Table: ${table} ===`);
    console.log(`Payload:`, JSON.stringify(finalPayload, null, 2));
    try {
      if (table === 'products') {
        console.log("PRODUCT PAYLOAD", payload);
        console.log("UPSERT START", JSON.stringify(finalPayload, null, 2));
        console.log("Reaching supabase.from('products').upsert(...)");
      }
      
      const result = await supabase.from(table).upsert(finalPayload);
      const { status, statusText, error } = result;
      const data = (result as any).data;
      
      if (table === 'products') {
        console.log("SUPABASE RESPONSE", { data, error, status });
        if (error) {
          console.log("error?.code", error?.code);
          console.log("error?.message", error?.message);
          console.log("error?.details", error?.details);
          console.log("error?.hint", error?.hint);
          console.log("UPSERT RESULT: FAILURE");
        } else {
          console.log("UPSERT RESULT: SUCCESS");
        }
      }

      console.log(`[Supabase AsyncUpsert RESULT] Status: ${status} (${statusText})`);
      if (error) {
        console.error(`❌ [Supabase AsyncUpsert Error] Write failed for table '${table}':`);
        if (table === 'products') {
          console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(error, null, 2));
        } else {
          console.error(`  Code:`, error.code);
          console.error(`  Message:`, error.message);
          console.error(`  Details:`, error.details);
          console.error(`  Hint:`, error.hint);
        }
      } else {
        console.log(`✅ [Supabase AsyncUpsert Success] Successfully saved row in table '${table}'.`);
      }
    } catch (err: any) {
      console.error(`❌ [Supabase AsyncUpsert Exception] Panic occurred for table '${table}':`, err);
      if (table === 'products') {
        console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(err, null, 2));
      }
    }
  }

  private static async asyncDelete(table: string, id: string) {
    if (!supabase) return;
    if (table === 'products') {
      console.warn("❌ [Supabase AsyncDelete Blocked] Direct client-side delete of 'products' requested but is strictly BLOCKED by protocol.");
      return;
    }
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        console.warn(`[Supabase Synced Sync Warning] Error deleting from '${table}':`, error.message);
      }
    } catch (err) {
      console.warn(`[Supabase Sync Connection Error] Delete failed silently for '${table}':`, err);
    }
  }

  static async syncFromSupabase(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const [
        configRes,
        categoriesRes,
        productsRes,
        ordersRes,
        debtsRes,
        staffRes,
        boxesRes,
        workforceRes
      ] = await Promise.all([
        supabase.from('store_config').select('*').limit(1).maybeSingle(),
        supabase.from('categories').select('*'),
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('debts').select('*'),
        supabase.from('staff_users').select('*'),
        supabase.from('money_boxes').select('*'),
        supabase.from('youth_workforce').select('*')
      ]);

      if (productsRes.error) {
        console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(productsRes.error, null, 2));
      }

      const configData = configRes.data;
      const categoriesData = categoriesRes.data;
      const productsData = productsRes.data;
      const ordersData = ordersRes.data;
      const debtsData = debtsRes.data;
      const staffData = staffRes.data;
      const boxesData = boxesRes.data;
      const workforceData = workforceRes.data;

      if (configData) {
        let actualConfig = configData;
        if (configData.value) {
          try {
            const unpacked = typeof configData.value === 'string' ? JSON.parse(configData.value) : configData.value;
            actualConfig = {
              ...unpacked,
              orgId: configData.organization_id || unpacked.orgId || 'org-dhibani-vip',
              organization_id: configData.organization_id
            };
          } catch (e) {
            console.warn('[Supabase Config Decode] Config JSON invalid:', e);
          }
        }
        this.set('aldhibani_local_config', actualConfig);
      }
      if (categoriesData && categoriesData.length > 0) this.set('aldhibani_local_categories', categoriesData);
      this.clientProducts = (productsData || []).map(mapProductFromDB);
      if (ordersData && ordersData.length > 0) this.set('aldhibani_local_orders', ordersData);
      if (debtsData && debtsData.length > 0) this.set('aldhibani_local_debts', debtsData);
      if (staffData && staffData.length > 0) this.set('aldhibani_local_staff', staffData);
      if (boxesData && boxesData.length > 0) this.set('aldhibani_money_boxes', boxesData);
      if (workforceData && workforceData.length > 0) this.set('aldhibani_youth_workforce', workforceData);

      return true;
    } catch (err) {
      console.warn('[Sync Status] Soft skipped optional initial Supabase master table fetch:', err);
      console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(err, null, 2));
      return false;
    }
  }

  // --- STORE CONFIG ---
  static getConfig(): StoreConfig {
    return this.get<StoreConfig>('aldhibani_local_config', DEFAULT_STORE_CONFIG);
  }

  static saveConfig(newConfig: StoreConfig): StoreConfig {
    this.set('aldhibani_local_config', newConfig);
    this.asyncUpsert('store_config', { id: 'single-row', ...newConfig });
    return newConfig;
  }

  // --- BANNERS ---
  static getBanners(): Banner[] {
    return this.get<Banner[]>('aldhibani_local_banners', DEFAULT_BANNERS);
  }

  static saveBanner(banner: Banner): Banner[] {
    const list = this.getBanners();
    const idx = list.findIndex(b => b.id === banner.id);
    if (idx !== -1) {
      list[idx] = banner;
    } else {
      list.push(banner);
    }
    this.set('aldhibani_local_banners', list);
    this.asyncUpsert('banners', banner);
    return list;
  }

  static deleteBanner(id: string): Banner[] {
    const list = this.getBanners().filter(b => b.id !== id);
    this.set('aldhibani_local_banners', list);
    this.asyncDelete('banners', id);
    return list;
  }

  // --- CATEGORIES ---
  static getCategories(): CustomCategory[] {
    return this.get<CustomCategory[]>('aldhibani_local_categories', DEFAULT_CATEGORIES);
  }

  static saveCategory(cat: CustomCategory): CustomCategory[] {
    const list = this.getCategories();
    const idx = list.findIndex(c => c.id === cat.id);
    if (idx !== -1) {
      list[idx] = cat;
    } else {
      list.push(cat);
    }
    this.set('aldhibani_local_categories', list);
    this.asyncUpsert('categories', cat);
    return list;
  }

  static deleteCategory(id: string): CustomCategory[] {
    const list = this.getCategories().filter(c => c.id !== id);
    this.set('aldhibani_local_categories', list);
    this.asyncDelete('categories', id);
    return list;
  }

  // --- PRODUCTS ---
  static getProducts(): Product[] {
    return this.clientProducts;
  }

  static setProducts(prods: Product[]): void {
    this.clientProducts = prods;
  }

  static broadcastHardRefresh(): void {
    if (!supabase) return;
    try {
      supabase.channel('realtime:products_sync').send({
        type: 'broadcast',
        event: 'hard-refresh',
        payload: { timestamp: Date.now() }
      }).then(() => {
        console.log('⚡ [Realtime Broadcast] Hard-refresh broadcast completed successfully!');
      }).catch((err) => {
        console.warn('[Realtime Broadcast] Broadcast failed:', err);
      });
    } catch (e) {
      console.warn('[Realtime Broadcast] Broadcast exception:', e);
    }
  }

  static saveProduct(prod: Product): Product[] {
    const list = this.getProducts();
    const idx = list.findIndex(p => p.id === prod.id);
    if (idx !== -1) {
      list[idx] = prod;
    } else {
      list.push(prod);
    }
    this.clientProducts = list;
    
    // Call HTTP API REST endpoint securely instead of client-side direct Supabase write
    fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'STABLE_LUXURY_HYPERMARKET_KEY_TOKEN_2026'
      },
      body: JSON.stringify(prod)
    }).then(res => {
      if (!res.ok) {
        console.error('Failed to save product via HTTP API');
      }
    }).catch(err => {
      console.error('Error saving product via API:', err);
    });

    this.broadcastHardRefresh();
    return list;
  }

  static deleteProduct(id: string): Product[] {
    const list = this.getProducts().filter(p => p.id !== id);
    this.clientProducts = list;

    // Call HTTP API REST endpoint securely instead of client-side direct Supabase delete
    fetch('/api/products/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'STABLE_LUXURY_HYPERMARKET_KEY_TOKEN_2026'
      },
      body: JSON.stringify({ id })
    }).then(res => {
      if (!res.ok) {
        console.error('Failed to delete product via HTTP API');
      }
    }).catch(err => {
      console.error('Error deleting product via API:', err);
    });

    this.broadcastHardRefresh();
    return list;
  }

  static clearAllProducts(): void {
    this.clientProducts = [];
    
    // Call HTTP API REST endpoint securely instead of client-side direct Supabase clear
    fetch('/api/clear-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'STABLE_LUXURY_HYPERMARKET_KEY_TOKEN_2026'
      },
      body: JSON.stringify({ target: 'PRODUCTS' })
    }).then(res => {
      if (res.ok) {
        this.broadcastHardRefresh();
      } else {
        console.error('Failed to clear products via HTTP API');
      }
    }).catch(err => {
      console.error('Error clearing products via API:', err);
    });
  }

  static clearAllCategories(): void {
    this.set('aldhibani_local_categories', []);
    if (supabase) {
      supabase.from('categories').delete().neq('id', 'keep-dummy').then(() => {});
    }
  }

  static clearAllOrders(): void {
    this.set('aldhibani_local_orders', []);
    if (supabase) {
      supabase.from('orders').delete().neq('id', 'keep-dummy').then(() => {});
    }
  }

  static clearAllDebts(): void {
    this.set('aldhibani_local_debts', []);
    if (supabase) {
      supabase.from('debts').delete().neq('id', 'keep-dummy').then(() => {});
    }
  }

  // --- ORDERS ---
  static getOrders(): Order[] {
    return this.get<Order[]>('aldhibani_local_orders', DEFAULT_ORDERS);
  }

  static saveOrder(order: Order): Order[] {
    const list = this.getOrders();
    const idx = list.findIndex(o => o.id === order.id);
    if (idx !== -1) {
      list[idx] = order;
    } else {
      list.unshift(order); // Add new orders at the top of lists
      
      // Auto-feed cash to relevant money boxes on YER dispatches
      this.autoRouteOrderFundsToBoxes(order);
    }
    this.set('aldhibani_local_orders', list);
    this.asyncUpsert('orders', order);
    return list;
  }

  // --- DEBTS ---
  static getDebts(): DebtRecord[] {
    return this.get<DebtRecord[]>('aldhibani_local_debts', DEFAULT_DEBTS);
  }

  static saveDebt(debt: DebtRecord): DebtRecord[] {
    const list = this.getDebts();
    const idx = list.findIndex(d => d.id === debt.id);
    if (idx !== -1) {
      list[idx] = debt;
    } else {
      list.push(debt);
    }
    this.set('aldhibani_local_debts', list);
    this.asyncUpsert('debts', debt);
    return list;
  }

  static deleteDebt(id: string): DebtRecord[] {
    const list = this.getDebts().filter(d => d.id !== id);
    this.set('aldhibani_local_debts', list);
    this.asyncDelete('debts', id);
    return list;
  }

  // --- STAFF ---
  static getStaff(): StaffUser[] {
    return this.get<StaffUser[]>('aldhibani_local_staff', DEFAULT_STAFF);
  }

  static async authenticateFromSupabase(username: string, passwordPlain: string): Promise<StaffUser | null> {
    console.log('[Supabase Direct Auth Client] Trying API backend auth for:', username);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordPlain })
      });
      console.log('[Supabase Direct Auth Client] API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[Supabase Direct Auth Client] API response body payload:', data);
        if (data.success && data.user) {
          console.log('[Supabase Direct Auth Client] Backend matched and verified user profile successfully!');
          return data.user;
        }
      }
      console.log('[Supabase Direct Auth Client] API login did not succeed (non-200 or success=false). Swerving to client-side Direct Supabase DB lookup...');
      throw new Error('API login unsuccessful');
    } catch (err) {
      console.warn('[Supabase Direct Auth Client-Side Fallback] Exception during API login:', err);
      if (!supabase) {
        console.warn('[Supabase Direct Auth Client] Supabase client NOT initialized. Cannot perform direct DB query.');
        return null;
      }
      try {
        console.log('[Supabase Direct Auth Client] Executing direct cloud query on table "staff_users" for username:', username.trim());
        const { data, error } = await supabase
          .from('staff_users')
          .select('*')
          .eq('username', username.trim());
        
        if (error) {
          console.error('[Supabase Direct Auth Client] Supabase DB error returned:', error);
          return null;
        }
        
        if (!data || data.length === 0) {
          console.log('[Supabase Direct Auth Client] DB returned no records on "staff_users" table for username:', username);
          return null;
        }

        console.log('[Supabase Direct Auth Client] Query records found:', data);
        const matched = data.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
        if (matched) {
          const storedSecret = matched.password_hash || matched.password;
          console.log('[Supabase Direct Auth Client] Direct DB record stored password secret:', storedSecret);
          console.log('[Supabase Direct Auth Client] Comparing with provided plain password:', passwordPlain);
          
          if (storedSecret && String(storedSecret) === passwordPlain) {
            let permissionsObj = matched.permissions;
            if (typeof permissionsObj === 'string') {
              try {
                permissionsObj = JSON.parse(permissionsObj);
              } catch (e) {
                permissionsObj = { viewSales: true, viewRecharges: true, editInventory: true, manageStaff: false };
              }
            }
            const processedUser: StaffUser = {
              id: String(matched.id),
              username: matched.username,
              role: matched.role as any,
              permissions: permissionsObj || { viewSales: true, viewRecharges: true, editInventory: true, manageStaff: false }
            };
            console.log('[Supabase Direct Auth Client] Match found and password correct! Processed user:', processedUser);
            return processedUser;
          } else {
            console.warn('[Supabase Direct Auth Client] Password comparison failed.');
          }
        }
        return null;
      } catch (innerErr) {
        console.warn('[Supabase Direct Auth] Failed lookup from staff_users:', innerErr);
        return null;
      }
    }
  }

  static saveStaffPermissions(staffId: string, permissions: any): StaffUser[] {
    const list = this.getStaff();
    const idx = list.findIndex(s => s.id === staffId);
    if (idx !== -1) {
      list[idx].permissions = { ...list[idx].permissions, ...permissions };
      this.set('aldhibani_local_staff', list);
      this.asyncUpsert('staff_users', list[idx]);
    }
    return list;
  }

  static saveStaffPassword(staffId: string, newPasswordPlain: string): StaffUser[] {
    const list = this.getStaff();
    const idx = list.findIndex(s => s.id === staffId);
    if (idx !== -1) {
      list[idx].password = newPasswordPlain;
      // Invalidate the old hashed password locally if it exists
      if (list[idx].password_hash !== undefined) {
        delete list[idx].password_hash;
      }
      this.set('aldhibani_local_staff', list);
      
      // In Supabase, make sure old password_hash is set to null so the login API validates the new password correctly.
      this.asyncUpsert('staff_users', {
        ...list[idx],
        password_hash: null
      });
    }
    return list;
  }

  // --- MONEY BOXES (صناديق المال بالريال اليمني) ---
  static getMoneyBoxes(): MoneyBox[] {
    return this.get<MoneyBox[]>('aldhibani_money_boxes', INITIAL_MONEY_BOXES);
  }

  static saveMoneyBoxes(boxes: MoneyBox[]): void {
    this.set('aldhibani_money_boxes', boxes);
    if (supabase) {
      boxes.forEach(box => {
        this.asyncUpsert('money_boxes', box);
      });
    }
  }

  static transferMoneyBetweenBoxes(fromId: string, toId: string, amountYER: number, description: string): boolean {
    const boxes = this.getMoneyBoxes();
    const source = boxes.find(b => b.id === fromId);
    const target = boxes.find(b => b.id === toId);

    if (!source || !target || source.balanceYER < amountYER || amountYER <= 0) {
      return false;
    }

    source.balanceYER -= amountYER;
    target.balanceYER += amountYER;
    this.saveMoneyBoxes(boxes);
    return true;
  }

  // --- YOUTH WORKFORCE (القوى الشابة لمستودع الذيباني) ---
  static getYouthWorkforce(): YouthWorkforceProfile[] {
    return this.get<YouthWorkforceProfile[]>('aldhibani_youth_workforce', INITIAL_YOUTH_WORKFORCE);
  }

  static saveYouthWorkforce(workforce: YouthWorkforceProfile[]): void {
    this.set('aldhibani_youth_workforce', workforce);
    if (supabase) {
      workforce.forEach(worker => {
        this.asyncUpsert('youth_workforce', worker);
      });
    }
  }

  static addCommissionToWorker(role: string, orderTotalYER: number): void {
    const workers = this.getYouthWorkforce();
    const target = workers.find(w => w.role === role);
    if (target) {
      const commission = Math.round(orderTotalYER * target.commissionRate);
      target.totalCommissionEarnedYER += commission;
      target.completedTasksCount += 1;
      this.saveYouthWorkforce(workers);
    }
  }

  // Routing funds automatically depending on category
  private static autoRouteOrderFundsToBoxes(order: Order) {
    if (order.status !== 'COMPLETED' && order.status !== 'PROCESSING') return;
    
    const boxes = this.getMoneyBoxes();
    const totalAmount = order.totalYER;

    // Determine target Box based on order products
    let targetBoxId = 'box-daily'; // default

    const firstItem = order.items[0];
    if (firstItem) {
      const cat = firstItem.product.category;
      if (cat === 'DIGITAL_RECHARGE') {
        targetBoxId = 'box-telecom';
      } else if (cat === 'DIGITAL_GAME') {
        targetBoxId = 'box-games';
      } else if (cat === 'PHYSICAL_ELECTRONICS') {
        targetBoxId = 'box-main';
      }
    }

    const box = boxes.find(b => b.id === targetBoxId);
    if (box) {
      box.balanceYER += totalAmount;
      this.saveMoneyBoxes(boxes);
    }

    // Allocate commission reward to standard Young Worker depending on who fetched
    const assignedRole = order.cashierId === 'cashier' ? 'CASHIER' : 'COMMUNICATIONS';
    this.addCommissionToWorker(assignedRole, totalAmount);
  }
}

// Trigger automatic background synchronization if a real Supabase client is connected
if (supabase) {
  SupabaseServerlessDB.syncFromSupabase().then((success) => {
    if (success) {
      console.log('🔄 Live cloud state synced successfully representing Aldhibani master DB!');
    }
  }).catch(() => null);
}
