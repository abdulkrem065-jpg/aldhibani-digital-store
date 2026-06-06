/**
 * Default datasets matching server.ts exactly
 * Acts as the master client-side fallback if the Node.js/Express server is unreachable (Vercel static host)
 */

import { Product, StoreConfig, CustomCategory, Order, DebtRecord, StaffUser } from '../types';

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  shopNameAR: 'مستودع ومتجر الذيباني VIP',
  shopNameEN: 'Al-Dheebani VIP Hybrid Warehouse',
  logoEmoji: '🔱',
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
};

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'DIGITAL_RECHARGE', nameAR: 'فوري رصيد وباقات اتصالات', nameEN: 'Digital Recharges & Bundles', icon: 'Smartphone', color: 'from-slate-900 to-amber-950/20' },
  { id: 'DIGITAL_GAME', nameAR: 'كروت ألعاب إلكترونية وشحن', nameEN: 'Cyber Play & Gaming Cards', icon: 'Gamepad2', color: 'from-slate-900 to-indigo-950/20' },
  { id: 'PHYSICAL_GROCERY', nameAR: 'تموين ومواد حضرمية وعسل', nameEN: 'Gourmet Yemeni Groceries', icon: 'Apple', color: 'from-slate-900 to-emerald-950/20' },
  { id: 'PHYSICAL_ELECTRONICS', nameAR: 'أجهزة ذكية وإلكترونيات فخمة', nameEN: 'Premium Smart Devices', icon: 'Laptop', color: 'from-slate-900 to-pink-950/20' }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'dg-ym-500',
    nameAR: 'باقة يمن موبايل 500 ريال فوري',
    nameEN: 'Yemen Mobile 500 Reissue Package',
    descriptionAR: 'تعبئة وتنشيط فوري لرصيد يمن موبايل بقيمة 500 ريال يمني',
    descriptionEN: 'Instant recharge for Yemen Mobile lines with 500 YER balance',
    category: 'DIGITAL_RECHARGE',
    brand: 'Yemen Mobile',
    priceYER: 500,
    imageUrl: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    rechargeAmount: '500 YER'
  },
  {
    id: 'dg-ym-2000',
    nameAR: 'باقة مزايا يمن موبايل 2000 ريال',
    nameEN: 'Yemen Mobile Mazaya 2000 YER',
    descriptionAR: 'باقة مزايا الشهرية الفورية: الإنترنت والاتصالات والرسائل مجانًا',
    descriptionEN: 'Monthly custom package with calls, SMS, and high-speed internet',
    category: 'DIGITAL_RECHARGE',
    brand: 'Yemen Mobile',
    priceYER: 2000,
    imageUrl: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    rechargeAmount: '2000 YER'
  },
  {
    id: 'dg-sb-500',
    nameAR: 'شحن سبأفون سوبر 500 يمني',
    nameEN: 'Sabafon Super 500 YER Recharge',
    descriptionAR: 'شحن رصيد سبأفون الفوري مع باقة تفعيل المزايا المحدثة',
    descriptionEN: 'Sabafon instant secure credit recharge of 500 YER',
    category: 'DIGITAL_RECHARGE',
    brand: 'Sabafon',
    priceYER: 500,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    rechargeAmount: '500 YER'
  },
  {
    id: 'dg-you-1000',
    nameAR: 'باقة يو فورجي 1000 ريال',
    nameEN: 'YOU 4G 1000 YER Package',
    descriptionAR: 'شحن سريع وباقات الجيل الرابع المتكاملة لشركة يو',
    descriptionEN: 'High speed 4G internet bundle for YOU Yemen network',
    category: 'DIGITAL_RECHARGE',
    brand: 'YOU',
    priceYER: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    rechargeAmount: '1000 YER'
  },
  {
    id: 'dg-g-pubg-660',
    nameAR: 'شدات ببجي موبايل - 660 شدة UC',
    nameEN: 'PUBG Mobile UC - 660 UC Package',
    descriptionAR: 'شحن فوري برقم الآيدي للعبة ببجي موبايل، معتمد ومستقر 100%',
    descriptionEN: 'Instant PUBG Mobile Unknown Cash voucher via Player ID',
    category: 'DIGITAL_GAME',
    brand: 'PUBG',
    priceYER: 3400,
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    rechargeAmount: '660 UC'
  },
  {
    id: 'dg-g-ff-210',
    nameAR: 'جواهر فري فاير - 210 جوهرة',
    nameEN: 'Free Fire Diamonds - 210 Diamonds',
    descriptionAR: 'جواهر فري فاير فورية لحساب العميل باستخدام معرف اللاعب المباشر',
    descriptionEN: '210 Free Fire Diamonds added directly to your player profile',
    category: 'DIGITAL_GAME',
    brand: 'Free Fire',
    priceYER: 1540,
    imageUrl: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    rechargeAmount: '210 Diamonds'
  },
  {
    id: 'ph-gr-honey',
    nameAR: 'عسل سدر يمني ملكي فاخر (كيلو)',
    nameEN: 'Royal Yemeni Sidr Honey Premium (1kg)',
    descriptionAR: 'عسل سدر أصلي 100% مستخرج من مناحل حضرموت الطبيعية الشهيرة',
    descriptionEN: '100% organic genuine Sidr honey harvested from the valleys of Hadramout',
    category: 'PHYSICAL_GROCERY',
    priceYER: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    stock: 45
  },
  {
    id: 'ph-gr-tea',
    nameAR: 'شاي السعيد النقي حبة كاملة',
    nameEN: 'Al-Saeed Premium Whole Leaf Tea',
    descriptionAR: 'علبة شاي يمني أصيل ذو نكهة فريدة وجودة عالية',
    descriptionEN: 'Authentic rich flavor Yemeni blend whole-leaf black tea tin',
    category: 'PHYSICAL_GROCERY',
    priceYER: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    stock: 120
  },
  {
    id: 'ph-gr-powder',
    nameAR: 'حليب الهناء بودرة مجفف (1.8 كجم)',
    nameEN: 'Al-Hana Milk Powder (1.8 kg)',
    descriptionAR: 'حليب كامل الدسم سريع الذوبان وفائق الجودة للعائلات',
    descriptionEN: 'Premium instant full cream milk powder for daily nutrition',
    category: 'PHYSICAL_GROCERY',
    priceYER: 8500,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    stock: 80
  },
  {
    id: 'ph-el-router',
    nameAR: 'مودم واي فاي يمن موبايل 4G محمول',
    nameEN: 'Yemen Mobile 4G Portable Wifi Router',
    descriptionAR: 'جهاز بث واي فاي ذكي لاسلكي فائق السرعة يدعم تغطية 4G القوية للمؤسسات والمنازل',
    descriptionEN: 'Pocket high-speed 4G LTE portable hotspot router for perfect nationwide connectivity',
    category: 'PHYSICAL_ELECTRONICS',
    priceYER: 24000,
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    stock: 15
  },
  {
    id: 'ph-el-power',
    nameAR: 'خازن شحن انكر ذكي 20000 مللي أمبير',
    nameEN: 'Anker PowerCore Powerbank 20000mAh',
    descriptionAR: 'بطارية شحن مدمجة بسعة ضخمة وشحن ذكي آمن فائق السرعة لتفادي انقطاع الكهرباء',
    descriptionEN: 'Ultra-safe multi-port quick charge smart powerbank to survive power cuts',
    category: 'PHYSICAL_ELECTRONICS',
    priceYER: 13500,
    imageUrl: 'https://images.unsplash.com/photo-1609592424109-dd0369877b08?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isAvailable: true,
    stock: 22
  }
];

export const DEFAULT_DEBTS: DebtRecord[] = [
  {
    id: 'debt-1',
    customerName: 'أبو أحمد الهمداني',
    customerPhone: '770992200',
    totalDebtYER: 42000,
    notes: 'متبقي حساب مودم واي فاي وشواحن سابقة للمكتب',
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'debt-2',
    customerName: 'المهندس أمين الريمي',
    customerPhone: '711228833',
    totalDebtYER: 12500,
    notes: 'رصيد آجل يمن موبايل وباقة إنترنت 4G',
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'DHB-ORD-99150',
    items: [
      {
        product: DEFAULT_PRODUCTS[0],
        quantity: 1,
        rechargeDetails: { phoneNumber: '770493341' }
      }
    ],
    totalYER: 500,
    currency: 'YER',
    status: 'PENDING',
    createdAt: '2026-06-04T21:19:01.000Z',
    customerName: 'عبدالكريم',
    customerPhone: '770493341',
    paymentMethod: 'جوالي 770493341',
    cashierId: 'cashier'
  },
  {
    id: 'DHB-ORD-61414',
    items: [
      {
        product: DEFAULT_PRODUCTS[1],
        quantity: 1,
        rechargeDetails: { phoneNumber: '72776392' }
      }
    ],
    totalYER: 2000,
    currency: 'YER',
    status: 'COMPLETED',
    createdAt: '2026-06-04T20:40:14.000Z',
    customerName: 'عبدالكريم',
    customerPhone: '72776392',
    paymentMethod: 'جوالي 770493341',
    cashierId: 'cashier'
  }
];

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
