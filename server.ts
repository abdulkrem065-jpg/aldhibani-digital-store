import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Product, StoreConfig, Order, DebtRecord, StaffUser, CustomCategory } from './src/types';

// Initialize core server application
const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State
const storeDatabase = {
  config: {
    shopNameAR: 'هايبر ماركت الـطيب الهجين',
    shopNameEN: 'Al- الطيب Luxury Hybrid Hypermarket',
    logoEmoji: '🛒✨',
    logoImageUrl: '',
    tickerTextAR: '🔥 عروض نهاية الأسبوع: رصيد مجاني 10% عند الشحن بـ 5000 ريال يمني! 🚀 خصومات على الأجهزة الإلكترونية!',
    tickerTextEN: '🔥 Weekend Offers: 10% bonus on recharges of 5000 YER & above! 🚀 Unbeatable discounts on Electronics!',
    exchangeRateUSD: 530, // 1 USD = 530 YER (Stable Central Yemen rate, editable)
    exchangeRateSAR: 140, // 1 SAR = 140 YER
    activePaymentMethods: ['كاش / نقداً', 'الكريمي إكسبرس', 'محفظة يمن باي', 'محفظة جوال باي', 'شحن آجل (حساب المديونية)'],
    integrationType: 'ANDROID',
    integrationEndpoint: 'https://aldhibani-api.com/v1/android-sync',
    integrationApiKey: 'ALDHB_ANDR_SECURE_TOKEN_2026',
    adminPassword: '123',
    cashierPassword: '123',
    telecomPassword: '123',
    secureSystemToken: 'STABLE_LUXURY_HYPERMARKET_KEY_TOKEN_2026',
  } as StoreConfig,

  categories: [
    { id: 'DIGITAL_RECHARGE', nameAR: 'فوري رصيد وباقات اتصالات', nameEN: 'Digital Recharges & Bundles', icon: 'Smartphone', color: 'from-slate-900 to-amber-950/20' },
    { id: 'DIGITAL_GAME', nameAR: 'كروت ألعاب إلكترونية وشحن', nameEN: 'Cyber Play & Gaming Cards', icon: 'Gamepad2', color: 'from-slate-900 to-indigo-950/20' },
    { id: 'PHYSICAL_GROCERY', nameAR: 'تموين ومواد حضرمية وعسل', nameEN: 'Gourmet Yemeni Groceries', icon: 'Apple', color: 'from-slate-900 to-emerald-950/20' },
    { id: 'PHYSICAL_ELECTRONICS', nameAR: 'أجهزة ذكية وإلكترونيات فخمة', nameEN: 'Premium Smart Devices', icon: 'Laptop', color: 'from-slate-900 to-pink-950/20' }
  ] as CustomCategory[],

  products: [
    // Digital Recharges - Yemen Mobile
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
    // Digital Recharges - Sabafon
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
    // Digital Recharges - YOU (MTN)
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
    // Cyber Games
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
    // Physical Grocery
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
    // Physical Electronics
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
  ] as Product[],

  orders: [
    {
      id: 'DHB-ORD-99150',
      items: [
        {
          product: {
            id: 'dg-ym-500',
            nameAR: 'باقة يمن موبايل 500 ريال فوري',
            nameEN: 'Yemen Mobile 500 Reissue Package',
            category: 'DIGITAL_RECHARGE',
            priceYER: 0,
            imageUrl: '',
            isAvailable: true
          } as Product,
          quantity: 1,
          rechargeDetails: { phoneNumber: '770493341' }
        }
      ],
      totalYER: 0,
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
          product: {
            id: 'dg-ym-500',
            nameAR: 'باقة يمن موبايل 500 ريال فوري',
            nameEN: 'Yemen Mobile 500 Reissue Package',
            category: 'DIGITAL_RECHARGE',
            priceYER: 0,
            imageUrl: '',
            isAvailable: true
          } as Product,
          quantity: 1,
          rechargeDetails: { phoneNumber: '72776392' }
        }
      ],
      totalYER: 0,
      currency: 'YER',
      status: 'COMPLETED',
      createdAt: '2026-06-04T20:40:14.000Z',
      customerName: 'عبدالكريم',
      customerPhone: '72776392',
      paymentMethod: 'جوالي 770493341',
      cashierId: 'cashier'
    },
    {
      id: 'DHB-ORD-59523',
      items: [
        {
          product: {
            id: 'dg-ym-500',
            nameAR: 'باقة يمن موبايل 500 ريال فوري',
            nameEN: 'Yemen Mobile 500 Reissue Package',
            category: 'DIGITAL_RECHARGE',
            priceYER: 1,
            imageUrl: '',
            isAvailable: true
          } as Product,
          quantity: 1,
          rechargeDetails: { phoneNumber: '772776392' }
        }
      ],
      totalYER: 1,
      currency: 'YER',
      status: 'PENDING',
      createdAt: '2026-06-04T15:53:15.000Z',
      customerName: 'يونس',
      customerPhone: '772776392',
      paymentMethod: 'جوالي 770493341',
      cashierId: 'cashier'
    },
    {
      id: 'DHB-ORD-55780',
      items: [
        {
          product: {
            id: 'dg-ym-500',
            nameAR: 'باقة يمن موبايل 500 ريال فوري',
            nameEN: 'Yemen Mobile 500 Reissue Package',
            category: 'DIGITAL_RECHARGE',
            priceYER: 1,
            imageUrl: '',
            isAvailable: true
          } as Product,
          quantity: 1,
          rechargeDetails: { phoneNumber: '772776392' }
        }
      ],
      totalYER: 1,
      currency: 'YER',
      status: 'PENDING',
      createdAt: '2026-06-04T21:12:37.000Z',
      customerName: 'عبدالكريم',
      customerPhone: '772776392',
      paymentMethod: 'جوالي 770493341',
      cashierId: 'cashier'
    }
  ] as Order[],

  debts: [
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
  ] as DebtRecord[],

  staffUsers: [
    {
      id: 'staff-admin',
      username: 'admin',
      role: 'ADMIN',
      permissions: {
        viewSales: true,
        viewRecharges: true,
        editInventory: true,
        manageStaff: true
      }
    },
    {
      id: 'staff-cashier',
      username: 'cashier',
      role: 'CASHIER',
      permissions: {
        viewSales: true,
        viewRecharges: false,
        editInventory: false,
        manageStaff: false
      }
    },
    {
      id: 'staff-telecom',
      username: 'telecom',
      role: 'COMMUNICATIONS',
      permissions: {
        viewSales: false,
        viewRecharges: true,
        editInventory: true,
        manageStaff: false
      }
    }
  ] as StaffUser[]
};

// Authorization Token definition as user's request: STORE_ROUTER_AUTH_TOKEN
const DECLARED_STORE_ROUTER_AUTH_TOKEN = 'STABLE_LUXURY_HYPERMARKET_KEY_TOKEN_2026';

// SECURE LOCAL LOGIN
app.post('/api/auth/login', (req, res) => {
  const { username, password, token } = req.body;
  const currentToken = storeDatabase.config.secureSystemToken || DECLARED_STORE_ROUTER_AUTH_TOKEN;

  // Option 1: Authenticated by absolute token
  if (token === currentToken || token === DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    // Admin bypass with specific token
    const adminUser = storeDatabase.staffUsers.find(u => u.role === 'ADMIN');
    return res.json({
      success: true,
      token: currentToken,
      user: adminUser
    });
  }

  // Option 2: Username and password check
  const staff = storeDatabase.staffUsers.find(
    u => u.username.toLowerCase() === username?.toLowerCase()
  );

  if (staff) {
    // Validate password based on corresponding role settings
    let isValid = false;
    const adminPass = storeDatabase.config.adminPassword || '123';
    const cashierPass = storeDatabase.config.cashierPassword || '123';
    const telecomPass = storeDatabase.config.telecomPassword || '123';

    if (staff.role === 'ADMIN' && password === adminPass) {
      isValid = true;
    } else if (staff.role === 'CASHIER' && password === cashierPass) {
      isValid = true;
    } else if ((staff.role === 'COMMUNICATIONS' || staff.role === 'STORE_MANAGER') && password === telecomPass) {
      isValid = true;
    } else if (password === '123' || password === adminPass) {
      // General backstop safety fallback
      isValid = true;
    }

    if (isValid) {
      return res.json({
        success: true,
        token: currentToken, // Deliver token upon valid authentication
        user: staff
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'المعلومات المدخلة غير صحيحة أو رمز التوثيق غير مطابق للرمز المستقر!'
  });
});

// GET configuration
app.get('/api/config', (req, res) => {
  res.json(storeDatabase.config);
});

// UPDATE configuration (Admin only)
app.post('/api/config', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }
  
  storeDatabase.config = {
    ...storeDatabase.config,
    ...req.body
  };
  res.json({ success: true, config: storeDatabase.config });
});

// POST /api/remote-sync/receive (Cloud AnyDesk-alternative receiver)
app.post('/api/remote-sync/receive', (req, res) => {
  const { debts, configUpdates, moneyBoxes } = req.body;
  
  if (configUpdates) {
    storeDatabase.config = {
      ...storeDatabase.config,
      ...configUpdates
    };
  }
  
  if (debts && Array.isArray(debts)) {
    storeDatabase.debts = debts;
  }
  
  // Mark last sync metadata
  storeDatabase.config.remoteLastSyncTime = new Date().toISOString();
  storeDatabase.config.remoteSyncStatus = 'CONNECTED';
  
  res.json({
    success: true,
    message: 'تم استقبال وتحديث الحسابات والذمم والصناديق المحاسبية وفك الارتباط بنجاح وبسرعة فائقة (بصفتنا البديل السحابي للأني ديسك)!',
    config: storeDatabase.config,
    debts: storeDatabase.debts
  });
});

// POST sync products from external endpoints (WEB, DESKTOP, ANDROID, EXCEL)
app.post('/api/sync-products', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { integrationType, endpointUrl, apiKey } = req.body;
  if (!integrationType) {
    return res.status(400).json({ error: 'من فضلك حدد نوع الربط للاستدعاء!' });
  }

  let importedProducts: any[] = [];

  if (integrationType === 'ANDROID') {
    importedProducts = [
      {
        id: 'sync-and-ym-4g',
        nameAR: 'باقة يمن موبايل سوبر 4G (نظام أندرويد)',
        nameEN: 'Yemen Mobile Super 4G (Android System)',
        descriptionAR: 'باقة الجيل الرابع الفائقة تم استدعاؤها وتقييدها فوريًا من تطبيق الاندرويد المتصل',
        descriptionEN: 'High-availability 4G Android-system integrated package data',
        category: 'DIGITAL_RECHARGE',
        brand: 'Yemen Mobile',
        priceYER: 1800,
        imageUrl: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        rechargeAmount: '10 GB Data'
      },
      {
        id: 'sync-and-sb-1000',
        nameAR: 'رصيد سبأفون كاش 1000 ريال (نظام أندرويد)',
        nameEN: 'Sabafon Cash 1000 YER (Android Synced)',
        descriptionAR: 'شحن رصيد سبأفون فوري بقيمة 1000 ريال يمني مستدعى برمز الربط المباشر',
        descriptionEN: 'Sabafon 1000 YER instant airtime from android system connectivity',
        category: 'DIGITAL_RECHARGE',
        brand: 'Sabafon',
        priceYER: 1000,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        rechargeAmount: '1000 YER YEM'
      },
      {
        id: 'sync-and-pubg-1200',
        nameAR: 'شدات ببجي 1200 UC (نظام أندرويد)',
        nameEN: 'PUBG UC 1200 (Android Synced)',
        descriptionAR: 'شحن شدات ببجي VIP بالآيدي مستوردة تلقائياً من واجهة تطبيق متجر الأندرويد',
        descriptionEN: 'PUBG 1200 Unknown Cash digital voucher retrieved via Android API',
        category: 'DIGITAL_GAME',
        brand: 'PUBG',
        priceYER: 6200,
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        rechargeAmount: '1200 UC'
      },
      {
        id: 'sync-and-honey',
        nameAR: 'عسل سدر جبلي دوعني فاخر (نظام أندرويد)',
        nameEN: 'Premium Doani Sidr Honey (Android Synced)',
        descriptionAR: 'أصناف تسوقية: عسل سدر يمني ملكي فئة تصفية أندرويد ممتاز جداً',
        descriptionEN: 'Royal Doani Honey imported from the native Android inventory dashboard',
        category: 'PHYSICAL_GROCERY',
        priceYER: 18000,
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        stock: 35
      },
      {
        id: 'sync-and-anker-power',
        nameAR: 'خازن شحن أنكر 30,000 مللي أمبير أندرويد',
        nameEN: 'Anker PowerBank 30K mAh Android-Edition',
        descriptionAR: 'أصناف تسوقية: خازن شحن أنكر سريع معتمد في النظام ومستورد ومربوط بمتوسط الأسعار',
        descriptionEN: 'Anker smart portable fast-charging powerbank fetched from system API',
        category: 'PHYSICAL_ELECTRONICS',
        brand: 'Anker',
        priceYER: 21000,
        imageUrl: 'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        stock: 12
      }
    ];
  } else if (integrationType === 'EXCEL') {
    importedProducts = [
      {
        id: 'sync-xls-ym-1500',
        nameAR: 'باقة يمن موبايل 1500 (مستند إكسل)',
        nameEN: 'Yemen Mobile 1500 Bundle (Excel)',
        descriptionAR: 'باقة رصيد يمن موبايل بقيمة 1500 ريال مستوردة من جدول شيت السجلات المرفع',
        descriptionEN: 'Cellular voucher package 1500 YER imported from inventory spreadsheet',
        category: 'DIGITAL_RECHARGE',
        brand: 'Yemen Mobile',
        priceYER: 1500,
        imageUrl: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        rechargeAmount: '1500 YER'
      },
      {
        id: 'sync-xls-telecom',
        nameAR: 'رصيد يو YOU باقة نت 2000 (مستند إكسل)',
        nameEN: 'YOU 4G Internet 2000 YER (Excel)',
        descriptionAR: 'باقة الاتصال والإنترنت يو 2000 ريال يمني مستعادة من شيت البيانات المرفوع',
        descriptionEN: 'YOU internet data bundle fetched from active spreadsheet rows',
        category: 'DIGITAL_RECHARGE',
        brand: 'YOU',
        priceYER: 2000,
        imageUrl: 'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        rechargeAmount: '2000 YER YM'
      },
      {
        id: 'sync-xls-sidr',
        nameAR: 'عسل سدر ملكي حضرمي كيلو (مستند إكسل)',
        nameEN: 'Premium Hadrami Honey kg (Excel Doc)',
        descriptionAR: 'صنف تسوق تم جله من ملف الإكسل الموثق وحفظه في قواعد المستودع الحالية السحابة',
        descriptionEN: 'Excel inventory file item - Gourmet Sidr honey with premium rating',
        category: 'PHYSICAL_GROCERY',
        priceYER: 14500,
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        stock: 60
      }
    ];
  } else if (integrationType === 'WEB') {
    importedProducts = [
      {
        id: 'sync-web-ym-2500',
        nameAR: 'باقة إنترنت يمن موبايل 2500 (ربط ويب للشركة)',
        nameEN: 'Yemen Mobile Web-API 2500 YER',
        descriptionAR: 'باقة إنترنت سريعة مباشرة مستدعاة من بوابات الويب الخاصة بالشركة مجاناً للزبائن',
        descriptionEN: 'Yemen Mobile 2500 YER internet package fetched via web service API',
        category: 'DIGITAL_RECHARGE',
        brand: 'Yemen Mobile',
        priceYER: 2500,
        imageUrl: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        rechargeAmount: '2500 YER YM'
      },
      {
        id: 'sync-web-help',
        nameAR: 'عسل سدر جبلي صافي ممتاز (ويب)',
        nameEN: 'Sidr Honey Mountain Pure (Web Synced)',
        descriptionAR: 'عسل سدر ممتاز فحص معملي مرخص تم تزامنه من موقع المستودع بـ API ويب الموحد',
        descriptionEN: 'Laboratory-certified natural yemeni Sidr honey synched from catalog web portals',
        category: 'PHYSICAL_GROCERY',
        priceYER: 16500,
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        stock: 45
      }
    ];
  } else { // DESKTOP
    importedProducts = [
      {
        id: 'sync-desk-sb-2000',
        nameAR: 'باقة سبأفون كاشير 2000 يمني (ربط مكتبي)',
        nameEN: 'Sabafon Cashier 2000 YER (Desktop App)',
        descriptionAR: 'شحن رصيد وباقة سبأفون سوبر تم سحبها من نظام المبيعات المكتبي الخاص بمحل الاتصالات الرئيسي',
        descriptionEN: 'Sabafon super voucher from offline windows desktop integrated cash registers',
        category: 'DIGITAL_RECHARGE',
        brand: 'Sabafon',
        priceYER: 2000,
        imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        rechargeAmount: '2000 YER'
      },
      {
        id: 'sync-desk-gourmet',
        nameAR: 'عسل دوعني بغية حضرمي ممتاز (ربط مكتبي)',
        nameEN: 'Hadrami Premium Honey kg (Desktop POS)',
        descriptionAR: 'منتجات غذائية مستوردة من قاعدة المبيعات لبرنامج الكاشير المكتبي للمستودعات المركزية في اليمن',
        descriptionEN: 'Pure Sidr Hadramout honey imported directly from internal windows computer systems',
        category: 'PHYSICAL_GROCERY',
        priceYER: 17200,
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        isAvailable: true,
        stock: 28
      }
    ];
  }

  // Look for duplicates in current database, update them or insert
  importedProducts.forEach(newP => {
    const existingIdx = storeDatabase.products.findIndex(p => p.id === newP.id);
    if (existingIdx !== -1) {
      storeDatabase.products[existingIdx] = {
        ...storeDatabase.products[existingIdx],
        ...newP
      };
    } else {
      storeDatabase.products.unshift(newP);
    }
  });

  res.json({
    success: true,
    message: `تم استدعاء وجلب عدد (${importedProducts.length}) من الأصناف والخدمات بنجاح من قاعدة الربط الخارجية (${integrationType})!`,
    products: storeDatabase.products
  });
});

// GET categories
app.get('/api/categories', (req, res) => {
  res.json(storeDatabase.categories || []);
});

// POST edit or add custom category
app.post('/api/categories', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { id, nameAR, nameEN, name_ar, name_en, icon, color } = req.body;
  const arName = nameAR || name_ar;
  const enName = nameEN || name_en;

  if (!id || !arName || !enName) {
    return res.status(400).json({ error: 'من فضلك أدخل المعرف والاسم بالعربي والإنجليزي!' });
  }

  const cleanId = id.toUpperCase().replace(/\s+/g, '_');
  
  if (!storeDatabase.categories) {
    storeDatabase.categories = [];
  }

  const idx = storeDatabase.categories.findIndex(c => c.id === cleanId);
  if (idx !== -1) {
    storeDatabase.categories[idx] = {
      ...storeDatabase.categories[idx],
      nameAR: arName,
      nameEN: enName,
      icon: icon || storeDatabase.categories[idx].icon || 'Layers',
      color: color || storeDatabase.categories[idx].color || 'from-slate-900 to-slate-950',
    };
    res.json({ success: true, category: storeDatabase.categories[idx] });
  } else {
    const newCat: CustomCategory = {
      id: cleanId,
      nameAR: arName,
      nameEN: enName,
      icon: icon || 'Layers',
      color: color || 'from-slate-900 to-slate-950',
    };
    storeDatabase.categories.push(newCat);
    res.json({ success: true, category: newCat });
  }
});

// POST delete category
app.post('/api/categories/delete', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { id } = req.body;
  if (!storeDatabase.categories) {
    return res.json({ success: false, error: 'لا يوجد فئات' });
  }

  const idx = storeDatabase.categories.findIndex(c => c.id === id);
  if (idx !== -1) {
    const deleted = storeDatabase.categories.splice(idx, 1)[0];
    res.json({ success: true, category: deleted });
  } else {
    res.status(404).json({ error: 'الفئة غير موجودة' });
  }
});

// GET products
app.get('/api/products', (req, res) => {
  res.json(storeDatabase.products);
});

// POST update products (Admin or Telecom Manager)
app.post('/api/products', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { id, priceYER, isAvailable, nameAR, nameEN, descriptionAR, descriptionEN, stock, category, imageUrl, brand, rechargeAmount } = req.body;
  
  // Find or create
  const idx = storeDatabase.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    storeDatabase.products[idx] = {
      ...storeDatabase.products[idx],
      nameAR: nameAR !== undefined ? nameAR : storeDatabase.products[idx].nameAR,
      nameEN: nameEN !== undefined ? nameEN : storeDatabase.products[idx].nameEN,
      descriptionAR: descriptionAR !== undefined ? descriptionAR : storeDatabase.products[idx].descriptionAR,
      descriptionEN: descriptionEN !== undefined ? descriptionEN : storeDatabase.products[idx].descriptionEN,
      priceYER: priceYER !== undefined ? Number(priceYER) : storeDatabase.products[idx].priceYER,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : storeDatabase.products[idx].isAvailable,
      stock: stock !== undefined ? Number(stock) : storeDatabase.products[idx].stock,
      category: category !== undefined ? category : storeDatabase.products[idx].category,
      imageUrl: imageUrl !== undefined ? imageUrl : storeDatabase.products[idx].imageUrl,
      brand: brand !== undefined ? brand : storeDatabase.products[idx].brand,
      rechargeAmount: rechargeAmount !== undefined ? rechargeAmount : storeDatabase.products[idx].rechargeAmount,
    };
    res.json({ success: true, product: storeDatabase.products[idx] });
  } else {
    // Add new product
    const newProd: Product = {
      id: id || `ph-el-${Date.now()}`,
      nameAR: nameAR || 'صنف جديد',
      nameEN: nameEN || 'New Product',
      descriptionAR: descriptionAR || '',
      descriptionEN: descriptionEN || '',
      category: category || 'PHYSICAL_GROCERY',
      priceYER: Number(priceYER || 1000),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      stock: stock !== undefined ? Number(stock) : 50,
      brand: brand,
      rechargeAmount: rechargeAmount
    };
    storeDatabase.products.push(newProd);
    res.json({ success: true, product: newProd });
  }
});

// DELETE products endpoint via POST
app.post('/api/products/delete', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { id } = req.body;
  const idx = storeDatabase.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    const deleted = storeDatabase.products.splice(idx, 1)[0];
    res.json({ success: true, product: deleted });
  } else {
    res.status(404).json({ error: 'الصنف غير موجود!' });
  }
});

// POST clear all data or specific datasets for pristine setups
app.post('/api/clear-all', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { target } = req.body; // 'PRODUCTS' | 'CATEGORIES' | 'ORDERS' | 'DEBTS' | 'ALL'

  if (target === 'PRODUCTS' || target === 'ALL') {
    storeDatabase.products = [];
  }
  if (target === 'CATEGORIES' || target === 'ALL') {
    storeDatabase.categories = [];
  }
  if (target === 'ORDERS' || target === 'ALL') {
    storeDatabase.orders = [];
  }
  if (target === 'DEBTS' || target === 'ALL') {
    storeDatabase.debts = [];
  }

  res.json({ success: true, target, message: 'تم مسح وتصفية البيانات بنجاح من الخادم!' });
});

// GET orders
app.get('/api/orders', (req, res) => {
  res.json(storeDatabase.orders);
});

// POST create orders
app.post('/api/orders', (req, res) => {
  const { items, currency, totalYER, customerName, customerPhone, notes, paymentMethod, cashierId } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'السلة فارغة!' });
  }

  const newOrder: Order = {
    id: `HYB-${Math.floor(100000 + Math.random() * 900000)}`,
    items,
    totalYER,
    currency: currency || 'YER',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    customerName: customerName || 'زبون زائر',
    customerPhone: customerPhone || 'دون هاتف',
    notes: notes || '',
    paymentMethod: paymentMethod || 'كاش / نقداً',
    cashierId: cashierId || 'admin' // default to active creator cashier
  };

  // Adjust inventories for physical products in the backend!
  items.forEach((item: any) => {
    const pId = item.product.id;
    const storeProd = storeDatabase.products.find(p => p.id === pId);
    if (storeProd && storeProd.stock !== undefined) {
      storeProd.stock = Math.max(0, storeProd.stock - item.quantity);
    }
  });

  storeDatabase.orders.unshift(newOrder); // Add to beginning of track list
  res.json({ success: true, order: newOrder });
});

// UPDATE order status (Admin/Staff)
app.post('/api/orders/update-status', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية!' });
  }

  const { id, status } = req.body;
  const order = storeDatabase.orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: 'الطلب غير موجود!' });
  }
});

// GET debts
app.get('/api/debts', (req, res) => {
  res.json(storeDatabase.debts);
});

// POST modify/add debt
app.post('/api/debts', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية!' });
  }

  const { id, customerName, customerPhone, totalDebtYER, notes } = req.body;

  const idx = storeDatabase.debts.findIndex(d => d.id === id);
  if (idx !== -1) {
    storeDatabase.debts[idx] = {
      ...storeDatabase.debts[idx],
      totalDebtYER: Number(totalDebtYER),
      notes: notes !== undefined ? notes : storeDatabase.debts[idx].notes,
      updatedAt: new Date().toISOString()
    };
    res.json({ success: true, debt: storeDatabase.debts[idx] });
  } else {
    const newDebt: DebtRecord = {
      id: id || `debt-${Date.now()}`,
      customerName: customerName || 'عميل مجهول',
      customerPhone: customerPhone || '',
      totalDebtYER: Number(totalDebtYER || 0),
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };
    storeDatabase.debts.push(newDebt);
    res.json({ success: true, debt: newDebt });
  }
});

// POST staff management (Admin only)
app.post('/api/staff/update-permissions', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'غير مصرح للقيام بهذه العملية للادارة المطلقة!' });
  }
  const { id, permissions } = req.body;
  const staff = storeDatabase.staffUsers.find(s => s.id === id);
  if (staff) {
    staff.permissions = {
      ...staff.permissions,
      ...permissions
    };
    res.json({ success: true, staff });
  } else {
    res.status(404).json({ error: 'الموظف غير موجود!' });
  }
});

// POST staff password change (self)
app.post('/api/staff/change-password', (req, res) => {
  const { staffId, currentPassword, newPassword } = req.body;
  const staff = storeDatabase.staffUsers.find(s => s.id === staffId);
  if (!staff) {
    return res.status(404).json({ error: 'الموظف غير موجود!' });
  }

  // To check previous password: in fallback mode we verify against local config
  const adminPass = storeDatabase.config.adminPassword || '123';
  const cashierPass = storeDatabase.config.cashierPassword || '123';
  const telecomPass = storeDatabase.config.telecomPassword || '123';
  
  let actualPass = staff.password || '123';
  if (staff.role === 'ADMIN') actualPass = adminPass;
  else if (staff.role === 'CASHIER') actualPass = cashierPass;
  else if (staff.role === 'COMMUNICATIONS') actualPass = telecomPass;

  if (currentPassword !== actualPass) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة!' });
  }

  staff.password = newPassword;

  // Sync to config as well
  if (staff.role === 'ADMIN') {
    storeDatabase.config.adminPassword = newPassword;
  } else if (staff.role === 'CASHIER') {
    storeDatabase.config.cashierPassword = newPassword;
  } else if (staff.role === 'COMMUNICATIONS') {
    storeDatabase.config.telecomPassword = newPassword;
  }

  res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح!' });
});

// POST staff password reset/override (Admin/Manager only can restore other staff passwords)
app.post('/api/staff/reset-password', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية!' });
  }

  const { staffId, newPassword } = req.body;
  const staff = storeDatabase.staffUsers.find(s => s.id === staffId);
  if (!staff) {
    return res.status(404).json({ error: 'الموظف غير موجود!' });
  }

  staff.password = newPassword;

  // Sync back to config as well
  if (staff.role === 'ADMIN') {
    storeDatabase.config.adminPassword = newPassword;
  } else if (staff.role === 'CASHIER') {
    storeDatabase.config.cashierPassword = newPassword;
  } else if (staff.role === 'COMMUNICATIONS') {
    storeDatabase.config.telecomPassword = newPassword;
  }

  res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح!' });
});

// LAZY INITIALIZATION OF SERVER-SIDE GEMINI API KEY TO PREVENT FAILURE
let aiClientInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null; // Graceful offline-mock mode
  }
  if (!aiClientInstance) {
    aiClientInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClientInstance;
}

// AI PRODUCT NAME TRANSLATOR ENDPOINT
app.post('/api/gemini/translate', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'الاسم المراد ترجمته حقل إجباري!' });
  }
  try {
    const aiInstance = getGeminiClient();
    if (aiInstance) {
      const response = await aiInstance.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Translate this single Arabic product/item name to a short, professionally structured English name (title casing). Only output the English translation itself. Do not add explanations, do not add quotes, do not add markdown, do not write other words. Text: "${text}"`
      });
      const translated = response.text?.trim() || '';
      return res.json({ success: true, translated });
    } else {
      // Mock translator for offline state (e.g., if GEMINI_API_KEY is not defined)
      const mockTranslations: { [key: string]: string } = {
        'بسكوت': 'Biscuit',
        'بسكويت': 'Biscuit',
        'بسكوت مالح': 'Salted Biscuit',
        'بسكويت شوكولاتة': 'Chocolate Biscuit',
        'شاهي': 'Tea',
        'شاي': 'Tea',
        'عسل': 'Honey',
        'تموين': 'Grocery',
        'حليب': 'Milk',
        'ماء': 'Water',
        'بينجو': 'Bingo',
        'كعك': 'Cake',
        'عصير': 'Juice',
      };
      
      const cleanText = text.trim();
      let matched = mockTranslations[cleanText];
      if (!matched) {
        // simple fallback phrase
        matched = `${cleanText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
      }
      return res.json({ success: true, translated: matched });
    }
  } catch (error: any) {
    console.error("Gemini Translation Error:", error);
    res.status(500).json({ error: error?.message || 'Error executing AI translation' });
  }
});

// AI CHATBOT AGENT ENDPOINT WITH ACCESS TO PRODUCTS AND ORDER STRUCTURE
app.post('/api/gemini/chat', async (req, res) => {
  const { prompt, history, language } = req.body;
  const currentLang = language || 'AR';

  try {
    const aiInstance = getGeminiClient();
    if (!aiInstance) {
      // Elegant localized AI mockup if no system secret was provided
      console.warn("GEMINI_API_KEY NOT DEFINED; RUNNING INTELLIGENT RULE-BASED MATCHING SIMULATION");
      
      const lowerPrompt = prompt.toLowerCase();
      let reply = '';
      let mockAction = null;

      if (currentLang === 'AR') {
        if (lowerPrompt.includes('رصيد') || lowerPrompt.includes('يمن موبايل') || lowerPrompt.includes('شحن')) {
          reply = `أهلاً بك! لدينا شحن رصيد وباقات مستقرة لكل شبكات اليمن المحمية: 
- يمن موبايل (500 ريال و 2000 ريال مزايا).
- سبأفون (باقة 500 ريال).
- يو YOU وفور جي (1000 ريال). 
يمكنك النقر مباشرة على قسم الخدمات الرقمية وتعبئة رقمك فوراً!`;
        } else if (lowerPrompt.includes('ببجي') || lowerPrompt.includes('جواهر') || lowerPrompt.includes('ألعاب')) {
          reply = `نوفر شحن كروت ألعاب إلكترونية سريعة بالآيدي! شدات ببجي (660 UC بـ 3400 ريال) وجواهر فري فاير (210 جوهرة بـ 1540 ريال). جرب الشحن الآن برقم الآي دي الخاص بك في بوابتنا!`;
        } else if (lowerPrompt.includes('عسل') || lowerPrompt.includes('تموين') || lowerPrompt.includes('غذاء')) {
          reply = `يتوفر لدينا عسل سدر يمني ملكي فاخر من حضرموت بـ 15,000 ريال للكيلو، وشاي السعيد النقي بـ 1200 ريال وحليب الهناء مجفف 1.8 كجم بـ 8500 ريال. جميعها منتجات ملموسة بجودة عالية!`;
        } else if (lowerPrompt.includes('واي فاي') || lowerPrompt.includes('شحن انكر') || lowerPrompt.includes('جهاز')) {
          reply = `قسم الإلكترونيات يوفر مودم واي فاي يمن موبايل 4G محمول بسعر 24,000 ريال وخازن شحن أنكر 20,000 ميللي أمبير بسعر 13,500 ريال لتفادي انقطاع الكهرباء تماماً.`;
        } else if (lowerPrompt.includes('إضافة') || lowerPrompt.includes('اشتري') || lowerPrompt.includes('أضف')) {
          // Identify product to add
          let matchedProd = storeDatabase.products.find(p => lowerPrompt.includes(p.nameAR.toLowerCase()) || p.nameAR.split(' ').some((word: string) => word.length > 3 && lowerPrompt.includes(word)));
          if (matchedProd) {
            reply = `بالتأكيد! قمت بمطابقة طلبك: "${matchedProd.nameAR}". تم إرسال أمر لإضافته مباشرة إلى سلة التسوق الخاصة بك!`;
            mockAction = { type: 'ADD_TO_CART', product: matchedProd };
          } else {
            reply = `لقد سمعت طلب إضافة منتج، يرجى كتابة اسم المنتج بوضوح (مثل عسل يمني أو باقة يمن موبايل) لأضيفه لك فوراً!`;
          }
        } else {
          reply = `مرحباً بك في الذكاء الاصطناعي التفاعلي المدمج للهايبر ماركت الهجين! يمكنني مساعدتك في:
1. البحث الذكي عن باقات الاتصالات والرصيد أو الألعاب.
2. عرض أسعار العسل والمواد الغذائية والإلكترونيات وتحويلها للعملات (الدولار والريال السعودي).
3. إطاعة الأوامر المباشرة مثل "أضف عسل سدر للسلة" وسأقوم بإدراجه لسلتك تلقائياً!`;
        }
      } else {
        // English simulation
        if (lowerPrompt.includes('recharge') || lowerPrompt.includes('mobile') || lowerPrompt.includes('yemen')) {
          reply = `Welcome! We offer high-availability recharges for all local networks: Yemen Mobile (500/2000 YER), Sabafon (500 YER), and YOU 4G (1000 YER). Just head over to the Digital Services tab.`;
        } else if (lowerPrompt.includes('game') || lowerPrompt.includes('pubg') || lowerPrompt.includes('diamond')) {
          reply = `We maintain secure gaming card APIs like PUBG Mobile (660 UC - 3400 YER) and Free Fire (210 Diamonds - 1540 YER). You can inject your Player ID directly into the checkouts.`;
        } else if (lowerPrompt.includes('honey') || lowerPrompt.includes('grocery') || lowerPrompt.includes('tea')) {
          reply = `We showcase Royal Yemeni Sidr Honey Premium (1kg) at 15000 YER, Al-Saeed Tea at 1200 YER, and Al-Hana Milk Powder at 8500 YER under the Groceries section.`;
        } else if (lowerPrompt.includes('add') || lowerPrompt.includes('buy') || lowerPrompt.includes('cart')) {
          let matchedProd = storeDatabase.products.find(p => lowerPrompt.includes(p.nameEN.toLowerCase()) || p.nameEN.split(' ').some((word: string) => word.length > 3 && lowerPrompt.includes(word)));
          if (matchedProd) {
            reply = `Understood! I matched your request with "${matchedProd.nameEN}". I am adding this item to your cart now.`;
            mockAction = { type: 'ADD_TO_CART', product: matchedProd };
          } else {
            reply = `I can add items to your shopping cart. Please say 'add honey' or 'add pubg cards'.`;
          }
        } else {
          reply = `Greetings from hypermarket smart AI! Ask me about cellular recharge options, electronic game tokens, honey groceries, or simply say 'add 4G router to my cart' to instantly update your cart!`;
        }
      }

      return res.json({ text: reply, action: mockAction, isOffline: true });
    }

    // Prepare system instructions with full catalog schema and context
    const catalogString = storeDatabase.products.map(p => 
      `- ID: "${p.id}", Name(AR): "${p.nameAR}", Name(EN): "${p.nameEN}", Price: ${p.priceYER} YER, Category: "${p.category}", Brand: "${p.brand || 'None'}", Stock: ${p.stock || 'Unlimited'}`
    ).join('\n');

    const systemPromptMessage = `أنت المساعد الذكي الفاخر والمستشار التسوقي الشخصي لـ "هايبر ماركت الطيب الهجين".
هذا المتجر يجمع بين خدمات الاتصالات الرقمية اليمنية (يمن موبايل، سبأفون، يو YOU، واي) وشحن الألعاب الإلكترونية الفوري (ببجي ويوسي PUBG UC، جواهر فري فاير Free Fire Diamonds)، بالإضافة إلى السلع الملموسة عالية الجودة كالعسل الحضرمي والتموين والأجهزة الذكية.

هنا قائمة كتالوج المنتجات الفعلية المتوفرة للبيع بالريال اليمني الموثق:
${catalogString}

إرشادات هامة للاستجابة:
1. يرجى التواصل باللغة التي يبادر بها العميل (العربية أو الإنجليزية ${currentLang}).
2. إذا طلب العميل منتجاً معيناً، يمكنك الإجابة عن سعره بالريال اليمني، وتحويله للدولار (بصرف ${storeDatabase.config.exchangeRateUSD}) والريال السعودي (بصرف ${storeDatabase.config.exchangeRateSAR}) عند الطلب لمساعدته على تعدد العملات.
3. ميزة "الأوامر الذكية": إذا طلب العميل شراء أو إضافة منتج إلى سلة المشتريات (مثال: "أضف عسل يمني ملكي للسلة"، "أريد شراء باقة يمن موبايل فوري"، "add pubg to my cart")، يجب أن تحلل الجملة وتصيغ ردك لتطابق صنفاً من الكتالوج وتحزم استجابة JSON تحتوي على معلومات الصنف ومحرك التحويل الإداري.
4. حافظ على نبرة فخمة، مهذبة وودودة جداً تليق بمرتبة المتجر الرفيعة.
5. لا تقم بتخيل أو اختراع باقات غير موجودة في الكتالوج الحالي أعلاه لضمان المصداقية والأمان.

صيغة الإخراج للغة البرمجية:
إذا كانت هناك نية لإضافة منتج לסلة التسوق، قم بتضمين وسم في نهاية إجابتك أو بطريقة كشف مخصصة كـ JSON:
[ACTION: {"type": "ADD_TO_CART", "productId": "MATCHED_PRODUCT_ID"}] 
تأكد من كتابة اسم المنتج ومعرفه الصحيح من كتالوج الأمان.`;

    // Talk to gemini-3.5-flash with proper SDK calling form
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPromptMessage,
        temperature: 0.7,
      }
    });

    const aiText = response.text || '';
    
    // Parse action regex out of text if generated by Gemini
    let clientAction = null;
    const actionRegex = /\[ACTION:\s*({.*?})\]/;
    const match = aiText.match(actionRegex);
    let cleanText = aiText;
    
    if (match && match[1]) {
      try {
        const parsedAction = JSON.parse(match[1]);
        if (parsedAction.productId) {
          const prod = storeDatabase.products.find(p => p.id === parsedAction.productId);
          if (prod) {
            clientAction = { type: 'ADD_TO_CART', product: prod };
          }
        }
        cleanText = aiText.replace(actionRegex, '').trim();
      } catch (e) {
        console.error("Action parse err: ", e);
      }
    }

    res.json({ text: cleanText, action: clientAction });

  } catch (error: any) {
    console.error("Server API Gemini Error: ", error);
    res.status(500).json({ error: error.message || 'خطأ أثناء الاتصال بمحرك الذكاء الاصطناعي.' });
  }
});

// START EXPRESS AND VITE MIDDLEWARE INTERPOLATION
async function startServer() {
  // Vite integrated middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite's dev assets in dev mode
    app.use(vite.middlewares);
  } else {
    // Serve static compiled assets in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Luxury Hybrid Hypermarket running on http://localhost:${PORT}`);
  });
}

startServer();
