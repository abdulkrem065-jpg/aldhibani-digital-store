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

// Retrieve direct environment secrets for Supabase real-time connection
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

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
  private static async asyncUpsert(table: string, payload: any) {
    if (!supabase) return;
    try {
      const { error } = await supabase.from(table).upsert(payload);
      if (error) {
        console.warn(`[Supabase Synced Sync Warning] Table or column error writing to '${table}':`, error.message);
      }
    } catch (err) {
      console.warn(`[Supabase Sync Connection Error] Write failed silently for '${table}':`, err);
    }
  }

  private static async asyncDelete(table: string, id: string) {
    if (!supabase) return;
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
        { data: configData },
        { data: categoriesData },
        { data: productsData },
        { data: ordersData },
        { data: debtsData },
        { data: staffData },
        { data: boxesData },
        { data: workforceData }
      ] = await Promise.all([
        supabase.from('aldhibani_config').select('*').limit(1).maybeSingle(),
        supabase.from('aldhibani_categories').select('*'),
        supabase.from('aldhibani_products').select('*'),
        supabase.from('aldhibani_orders').select('*'),
        supabase.from('aldhibani_debts').select('*'),
        supabase.from('staff_users').select('*'),
        supabase.from('aldhibani_money_boxes').select('*'),
        supabase.from('aldhibani_youth_workforce').select('*')
      ]);

      if (configData) this.set('aldhibani_local_config', configData);
      if (categoriesData && categoriesData.length > 0) this.set('aldhibani_local_categories', categoriesData);
      if (productsData && productsData.length > 0) this.set('aldhibani_local_products', productsData);
      if (ordersData && ordersData.length > 0) this.set('aldhibani_local_orders', ordersData);
      if (debtsData && debtsData.length > 0) this.set('aldhibani_local_debts', debtsData);
      if (staffData && staffData.length > 0) this.set('aldhibani_local_staff', staffData);
      if (boxesData && boxesData.length > 0) this.set('aldhibani_money_boxes', boxesData);
      if (workforceData && workforceData.length > 0) this.set('aldhibani_youth_workforce', workforceData);

      return true;
    } catch (err) {
      console.warn('[Sync Status] Soft skipped optional initial Supabase master table fetch:', err);
      return false;
    }
  }

  // --- STORE CONFIG ---
  static getConfig(): StoreConfig {
    return this.get<StoreConfig>('aldhibani_local_config', DEFAULT_STORE_CONFIG);
  }

  static saveConfig(newConfig: StoreConfig): StoreConfig {
    this.set('aldhibani_local_config', newConfig);
    this.asyncUpsert('aldhibani_config', { id: 'single-row', ...newConfig });
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
    this.asyncUpsert('aldhibani_banners', banner);
    return list;
  }

  static deleteBanner(id: string): Banner[] {
    const list = this.getBanners().filter(b => b.id !== id);
    this.set('aldhibani_local_banners', list);
    this.asyncDelete('aldhibani_banners', id);
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
    this.asyncUpsert('aldhibani_categories', cat);
    return list;
  }

  static deleteCategory(id: string): CustomCategory[] {
    const list = this.getCategories().filter(c => c.id !== id);
    this.set('aldhibani_local_categories', list);
    this.asyncDelete('aldhibani_categories', id);
    return list;
  }

  // --- PRODUCTS ---
  static getProducts(): Product[] {
    return this.get<Product[]>('aldhibani_local_products', DEFAULT_PRODUCTS);
  }

  static saveProduct(prod: Product): Product[] {
    const list = this.getProducts();
    const idx = list.findIndex(p => p.id === prod.id);
    if (idx !== -1) {
      list[idx] = prod;
    } else {
      list.push(prod);
    }
    this.set('aldhibani_local_products', list);
    this.asyncUpsert('aldhibani_products', prod);
    return list;
  }

  static deleteProduct(id: string): Product[] {
    const list = this.getProducts().filter(p => p.id !== id);
    this.set('aldhibani_local_products', list);
    this.asyncDelete('aldhibani_products', id);
    return list;
  }

  static clearAllProducts(): void {
    this.set('aldhibani_local_products', []);
    if (supabase) {
      supabase.from('aldhibani_products').delete().neq('id', 'keep-dummy').then(() => {});
    }
  }

  static clearAllCategories(): void {
    this.set('aldhibani_local_categories', []);
    if (supabase) {
      supabase.from('aldhibani_categories').delete().neq('id', 'keep-dummy').then(() => {});
    }
  }

  static clearAllOrders(): void {
    this.set('aldhibani_local_orders', []);
    if (supabase) {
      supabase.from('aldhibani_orders').delete().neq('id', 'keep-dummy').then(() => {});
    }
  }

  static clearAllDebts(): void {
    this.set('aldhibani_local_debts', []);
    if (supabase) {
      supabase.from('aldhibani_debts').delete().neq('id', 'keep-dummy').then(() => {});
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
    this.asyncUpsert('aldhibani_orders', order);
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
    this.asyncUpsert('aldhibani_debts', debt);
    return list;
  }

  static deleteDebt(id: string): DebtRecord[] {
    const list = this.getDebts().filter(d => d.id !== id);
    this.set('aldhibani_local_debts', list);
    this.asyncDelete('aldhibani_debts', id);
    return list;
  }

  // --- STAFF ---
  static getStaff(): StaffUser[] {
    return this.get<StaffUser[]>('aldhibani_local_staff', DEFAULT_STAFF);
  }

  static async authenticateFromSupabase(username: string, passwordPlain: string): Promise<StaffUser | null> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwordPlain })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          return data.user;
        }
      }
      return null;
    } catch (err) {
      console.warn('[Supabase Direct Auth Client-Side Fallback]', err);
      if (!supabase) return null;
      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('*')
          .eq('username', username.trim());
        
        if (error || !data || data.length === 0) {
          return null;
        }

        const matched = data.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
        if (matched) {
          const storedSecret = matched.password_hash || matched.password;
          if (storedSecret && String(storedSecret) === passwordPlain) {
            let permissionsObj = matched.permissions;
            if (typeof permissionsObj === 'string') {
              try {
                permissionsObj = JSON.parse(permissionsObj);
              } catch (e) {
                permissionsObj = { viewSales: true, viewRecharges: true, editInventory: true, manageStaff: false };
              }
            }
            return {
              id: String(matched.id),
              username: matched.username,
              role: matched.role as any,
              permissions: permissionsObj || { viewSales: true, viewRecharges: true, editInventory: true, manageStaff: false }
            };
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
      this.set('aldhibani_local_staff', list);
      this.asyncUpsert('staff_users', list[idx]);
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
        this.asyncUpsert('aldhibani_money_boxes', box);
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
        this.asyncUpsert('aldhibani_youth_workforce', worker);
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
