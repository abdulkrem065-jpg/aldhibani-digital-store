/**
 * Default datasets matching server.ts exactly
 * Acts as the master client-side fallback if the Node.js/Express server is unreachable (Vercel static host)
 */

import { Product, StoreConfig, CustomCategory, Order, DebtRecord, StaffUser, Banner } from '../types';

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  shopNameAR: 'مستودع ومتجر الذيباني VIP',
  shopNameEN: 'Al-Dheebani VIP Hybrid Warehouse',
  logoEmoji: '🔱',
  logoImageUrl: '',
  tickerTextAR: '🔥 مرحباً بكم في مستودع ومتجر الذيباني VIP الشامل للاتصالات وشحن الألعاب والتموينات الغذائية الفاخرة بجودة معتمدة! 🚀',
  tickerTextEN: '🔥 Welcome to Al-Dheebani VIP Hybrid Warehouse: Best pricing for airtimes, game topups and gourmet groceries! 🚀',
  exchangeRateUSD: 530,
  exchangeRateSAR: 140,
  activePaymentMethods: ['كاش / نقداً', 'الكريمي إكسبرس', 'محفظة يمن باي', 'محفظة جوال باي', 'شحن آجل (حساب المديونية)'],
  integrationType: 'ANDROID',
  integrationEndpoint: 'https://aldhibani-api.com/v1/android-sync',
  integrationApiKey: 'ALDHB_ANDR_SECURE_TOKEN_2026',
  adminPassword: '123',
  cashierPassword: '123',
  telecomPassword: '123',
  secureSystemToken: 'STABLE_LUXURY_HYPERMARKET_KEY_TOKEN_2026',
  orgId: 'org-dhibani-vip',
};

export const DEFAULT_BANNERS: Banner[] = [];

export const DEFAULT_CATEGORIES: CustomCategory[] = [];

export const DEFAULT_PRODUCTS: Product[] = [];

export const DEFAULT_DEBTS: DebtRecord[] = [];

export const DEFAULT_ORDERS: Order[] = [];

export const DEFAULT_STAFF: StaffUser[] = [
  { id: 'staff-admin', username: 'admin', role: 'ADMIN', permissions: { viewSales: true, viewRecharges: true, editInventory: true, manageStaff: true } },
  { id: 'staff-cashier', username: 'cashier', role: 'CASHIER', permissions: { viewSales: true, viewRecharges: false, editInventory: false, manageStaff: false } },
  { id: 'staff-telecom', username: 'telecom', role: 'COMMUNICATIONS', permissions: { viewSales: false, viewRecharges: true, editInventory: true, manageStaff: false } }
];

// Helper functions for easy reading/writing client settings in localStorage
export function getSavedItem<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val) return JSON.parse(val);
  } catch (e) {
    console.error("Local storage read error", e);
  }
  return defaultValue;
}

export function saveItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Local storage write error", e);
  }
}
