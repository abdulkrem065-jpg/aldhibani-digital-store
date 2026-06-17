/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'AR' | 'EN';
export type Currency = 'YER' | 'USD' | 'SAR';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'SALES' | 'COMMUNICATIONS' | 'STORE_MANAGER';

export interface Organization {
  id: string;
  name: string;
  industry: 'RETAIL' | 'HEALTHCARE' | 'LEGAL' | 'SERVICES' | 'AI_OPERATIONS';
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED';
  logo: string;
}

export interface Branch {
  id: string;
  orgId: string;
  name: string;
  location: string;
  managerId: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason: string;
  createdAt: string;
  operatorName: string;
}

export interface StaffPermissions {
  viewSales: boolean;
  viewRecharges: boolean;
  editInventory: boolean;
  manageStaff: boolean;
}

export interface StaffUser {
  id: string;
  username: string;
  password?: string; // only stored securely or mocked in storage
  password_hash?: string; // secure bcrypt hash
  role: UserRole;
  permissions: StaffPermissions;
  orgId?: string;
  branchId?: string;
}

export interface StoreConfig {
  shopNameAR: string;
  shopNameEN: string;
  logoEmoji: string;
  logoImageUrl?: string;
  tickerTextAR: string;
  tickerTextEN: string;
  exchangeRateUSD: number; // 1 USD = X YER (e.g., 530Y / 1500Y)
  exchangeRateSAR: number; // 1 SAR = X YER (e.g., 140Y / 400Y)
  activePaymentMethods?: string[]; // Added to configure active payment methods!
  integrationType?: 'WEB' | 'DESKTOP' | 'ANDROID' | 'EXCEL'; // Integration selector
  integrationEndpoint?: string; // API URL or connection path
  integrationApiKey?: string;  // API token/secret
  adminPassword?: string;      // administrator credential 'admin'
  cashierPassword?: string;    // cashier credential 'cashier'
  telecomPassword?: string;    // telecom credential 'telecom'
  secureSystemToken?: string;  // bypass storefront TOKEN
  
  // Remote sync and connection settings (Cloud alternative to AnyDesk)
  remoteSyncMethod?: 'API_DIRECT' | 'GDRIVE_BACKUP';
  remoteApiUrl?: string;
  remoteApiKey?: string;
  remoteGDriveFolderId?: string;
  remoteGDriveBackupName?: string;
  remoteSyncInterval?: number; // minutes
  remoteLastSyncTime?: string;
  remoteSyncStatus?: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING';
  orgId?: string;
  branchId?: string;
}

export type ProductCategory = string;

export interface CustomCategory {
  id: string;
  nameAR: string;
  nameEN: string;
  icon?: string; // lucide icon code name or an emoji
  color?: string; // custom color gradient from-to class
}

export interface Product {
  id: string;
  nameAR: string;
  nameEN: string;
  descriptionAR: string;
  descriptionEN: string;
  category: ProductCategory;
  brand?: string; // e.g. 'Yemen Mobile', ' Sabafon', 'YOU', 'Y', 'PUBG', 'Free Fire'
  priceYER: number; // base YER price
  imageUrl: string;
  product_image_url?: string; // official image url override
  is_ai_suggested?: boolean; // track if suggested by AI
  ai_suggested_url?: string; // tracking the raw AI suggestion url
  isAvailable: boolean;
  stock?: number; // for physical items
  rechargeAmount?: string; // Digital value description
}

export interface CartItem {
  product: Product;
  quantity: number;
  rechargeDetails?: {
    phoneNumber?: string;
    playerId?: string;
    notes?: string;
  };
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string; // e.g., HYB-XXXXXX
  items: CartItem[];
  totalYER: number;
  currency: Currency;
  status: OrderStatus;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  paymentMethod?: string; // added to support طرق الدفع
  cashierId?: string; // added to support مسابقة الصناديق
}

export interface DebtRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  totalDebtYER: number;
  notes?: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  organization_id: string;
  title_ar: string;
  title_en: string;
  image_url: string;
  target_url?: string;
  is_active: boolean;
  sort_order: number;
}
