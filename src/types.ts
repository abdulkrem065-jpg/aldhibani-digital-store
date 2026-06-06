/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'AR' | 'EN';
export type Currency = 'YER' | 'USD' | 'SAR';

export type UserRole = 'ADMIN' | 'CASHIER' | 'COMMUNICATIONS' | 'STORE_MANAGER';

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
  role: UserRole;
  permissions: StaffPermissions;
}

export interface StoreConfig {
  shopNameAR: string;
  shopNameEN: string;
  logoEmoji: string;
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
