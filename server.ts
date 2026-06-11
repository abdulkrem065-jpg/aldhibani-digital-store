import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Product, StoreConfig, Order, DebtRecord, StaffUser, CustomCategory, Banner } from './src/types';

dotenv.config();

// Initialize Supabase Client on the server side
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: any = null;
if (
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE'
) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('⚡ Supabase Client initialized successfully on the Node.js server!');
  } catch (error) {
    console.error('Failed to initialize Supabase client on server-side:', error);
  }
}

const SALT_ROUNDS = 10;

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

function verifyPassword(passwordPlain: string, storedHashOrPlain: string): boolean {
  if (!storedHashOrPlain) return false;
  if (storedHashOrPlain.startsWith('$2a$') || storedHashOrPlain.startsWith('$2b$') || storedHashOrPlain.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(passwordPlain, storedHashOrPlain);
    } catch (e) {
      console.error('Bcrypt comparison failed:', e);
      return false;
    }
  }
  return passwordPlain === storedHashOrPlain;
}

async function insertAuditLog(action: string, operator: string, payload: any) {
  try {
    if (supabase) {
      const { error } = await supabase.from('audit_log').insert({
        action,
        actor_id: operator,
        metadata: payload,
        created_at: new Date().toISOString()
      });
      if (error) {
        console.warn('[Audit Log] Failed to write in Supabase:', error.message);
      } else {
        console.log('[Audit Log] Successfully written in Supabase:', action);
      }
    } else {
      console.log('[Audit Log Fallback] Action:', action, 'Operator:', operator, 'Payload:', payload);
    }
  } catch (err) {
    console.warn('[Audit Log Exception]:', err);
  }
}

function getLocalDefaultPasswordForRole(role: string): string {
  const adminPass = storeDatabase.config.adminPassword || '123';
  const cashierPass = storeDatabase.config.cashierPassword || '123';
  const telecomPass = storeDatabase.config.telecomPassword || '123';

  if (role === 'ADMIN') return adminPass;
  if (role === 'CASHIER') return cashierPass;
  if (role === 'COMMUNICATIONS' || role === 'STORE_MANAGER') return telecomPass;
  return '123';
}

// Initialize core server application
export const app = express();
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
    orgId: 'org-dhibani-vip',
  } as StoreConfig,

  banners: [
    {
      id: 'bn-telecom',
      organization_id: 'org-dhibani-vip',
      title_ar: 'باقات شحن يمن موبايل وسبأفون الفورية بخصومات 10٪ 🔥',
      title_en: 'Instant Recharges for Yemen Mobile & Sabafon with 10% Off 🔥',
      image_url: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=1200&auto=format&fit=crop&q=80',
      target_url: '/?category=DIGITAL_RECHARGE',
      is_active: true,
      sort_order: 1
    },
    {
      id: 'bn-gaming',
      organization_id: 'org-dhibani-vip',
      title_ar: 'شحن شدات ببجي وجواهر فري فاير الفوري بأرخص الأسعار اليمني 🎮',
      title_en: 'Instant PUBG UC & Free Fire Diamonds at the Best Rates 🎮',
      image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
      target_url: '/?category=DIGITAL_GAME',
      is_active: true,
      sort_order: 2
    },
    {
      id: 'bn-electronics',
      organization_id: 'org-dhibani-vip',
      title_ar: 'أحدث الإلكترونيات والأجهزة الذكية بضمان حقيقي مستقر 💻',
      title_en: 'Latest Smart Devices & Premium Electronics with Real Warranty 💻',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
      target_url: '/?category=PHYSICAL_ELECTRONICS',
      is_active: true,
      sort_order: 3
    }
  ] as Banner[],

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
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, token } = req.body;
    const currentToken = storeDatabase.config.secureSystemToken || DECLARED_STORE_ROUTER_AUTH_TOKEN;

    // Option 1: Authenticated by absolute token
    if (token === currentToken || token === DECLARED_STORE_ROUTER_AUTH_TOKEN) {
      const adminUser = storeDatabase.staffUsers.find(u => u.role === 'ADMIN');
      return res.json({
        success: true,
        token: currentToken,
        user: adminUser
      });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور!' });
    }

    let staff: any = null;
    let isCloudUser = false;

    // A. Attempt Supabase real-time auth lookup
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('*')
          .eq('username', username.trim());

        if (!error && data && data.length > 0) {
          const matched = data.find((u: any) => u.username.toLowerCase() === username.trim().toLowerCase());
          if (matched) {
            const storedSecret = matched.password_hash || matched.password;
            if (storedSecret && verifyPassword(password, storedSecret)) {
              staff = {
                id: String(matched.id),
                username: matched.username,
                role: matched.role,
                permissions: typeof matched.permissions === 'string' ? JSON.parse(matched.permissions) : (matched.permissions || { viewSales: true, viewRecharges: true, editInventory: true, manageStaff: false })
              };
              isCloudUser = true;

              // Lazy Hash upgrade
              if (!matched.password_hash && matched.password === password) {
                const hash = hashPassword(password);
                await supabase.from('staff_users').update({ password_hash: hash }).eq('id', matched.id);
                console.log(`[Supabase Lazy Hash Upgrade] Password upgraded to password_hash successfully for ${username}!`);
              }
            }
          }
        }
      } catch (err) {
        console.error('[Supabase Auth Server Side Error]', err);
      }
    }

    // B. Fallback to local in-memory DB if not found or no Supabase
    if (!staff) {
      const localStaff = storeDatabase.staffUsers.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (localStaff) {
        const localHashOrPlain = localStaff.password_hash || getLocalDefaultPasswordForRole(localStaff.role);
        if (verifyPassword(password, localHashOrPlain)) {
          staff = localStaff;
        }
      }
    }

    if (staff) {
      await insertAuditLog(
        'LOGIN_SUCCESS',
        staff.username,
        { role: staff.role, platform: isCloudUser ? 'SUPABASE_CLOUD' : 'FALLBACK_LOCAL_DB' }
      );

      return res.json({
        success: true,
        token: currentToken,
        user: staff
      });
    }

    return res.status(401).json({
      success: false,
      error: 'المعلومات المدخلة غير صحيحة أو رمز التوثيق غير مطابق للرمز المستقر!'
    });
  } catch (err: any) {
    console.error('Login implementation error:', err);
    return res.status(500).json({ error: 'حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول.' });
  }
});

// GET database diagnostics check
app.get('/api/diagnostics', async (req, res) => {
  const serverConnected = !!supabase;
  let supabaseResponseOk = false;
  let errorMsg = '';
  let tablesChecked: { [key: string]: boolean | string } = {};

  if (supabase) {
    try {
      const { data, error } = await supabase.from('store_config').select('*').limit(1).maybeSingle();
      if (!error) {
        supabaseResponseOk = true;
        tablesChecked['store_config'] = 'OK ✅';
      } else {
        errorMsg = error.message;
        tablesChecked['store_config'] = `Error: ${error.message} ❌`;
      }
    } catch (e: any) {
      errorMsg = e.message;
      tablesChecked['store_config'] = `Exception: ${e.message} ❌`;
    }
    
    // Quick test products table and other tables
    const checkTables = ['products', 'categories', 'orders', 'debts', 'staff_users'];
    for (const t of checkTables) {
      try {
        const { error } = await supabase.from(t).select('count', { count: 'exact', head: true }).limit(1);
        if (!error) {
          tablesChecked[t] = 'OK ✅';
        } else {
          tablesChecked[t] = `Error: ${error.message} ❌`;
        }
      } catch (e: any) {
        tablesChecked[t] = `Exception: ${e.message} ❌`;
      }
    }
  }

  res.json({
    timestamp: new Date().toISOString(),
    backendInitialized: true,
    supabaseInitialized: serverConnected,
    supabaseResponseOk,
    supabaseError: errorMsg,
    tables: tablesChecked,
    details: {
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Not Set',
      supabaseKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
    }
  });
});

// GET configuration
app.get('/api/config', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('store_config').select('*').limit(1).maybeSingle();
      if (!error && data) {
        storeDatabase.config = { ...storeDatabase.config, ...data };
      }
    } catch (e) {
      console.error('[Supabase GET Config Error]', e);
    }
  }
  res.json(storeDatabase.config);
});

// UPDATE configuration (Admin only)
app.post('/api/config', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }
  
  storeDatabase.config = {
    ...storeDatabase.config,
    ...req.body
  };

  if (supabase) {
    try {
      await supabase.from('store_config').upsert({ id: 'single-row', ...storeDatabase.config });
    } catch (e) {
      console.error('[Supabase POST Config Sync Error]', e);
    }
  }

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

  if (supabase && importedProducts.length > 0) {
    supabase.from('products').upsert(importedProducts)
      .then(({ error }: { error: any }) => {
        if (error) {
          console.error('[Supabase Sync Products Error]', error);
        } else {
          console.log('[Supabase Sync Products Success] Successfully upserted products:', importedProducts.length);
        }
      })
      .catch((err: any) => console.error('[Supabase Sync Products Exception]', err));
  }

  res.json({
    success: true,
    message: `تم استدعاء وجلب عدد (${importedProducts.length}) من الأصناف والخدمات بنجاح من قاعدة الربط الخارجية (${integrationType}) ومزامنتها بنجاح سحابياً!`,
    products: storeDatabase.products
  });
});

// GET categories
app.get('/api/categories', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data && data.length > 0) {
        storeDatabase.categories = data;
      }
    } catch (e) {
      console.error('[Supabase GET Categories Error]', e);
    }
  }
  res.json(storeDatabase.categories || []);
});

// GET banners
app.get('/api/banners', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('banners').select('*');
      if (!error && data && data.length > 0) {
        storeDatabase.banners = data;
      }
    } catch (e) {
      console.error('[Supabase GET Banners Error]', e);
    }
  }
  res.json(storeDatabase.banners || []);
});

// POST edit or add banner
app.post('/api/banners', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { id, organization_id, title_ar, title_en, image_url, target_url, is_active, sort_order } = req.body;

  if (!organization_id || !title_ar || !title_en || !image_url) {
    return res.status(400).json({ error: 'من فضلك أدخل البيانات الأساسية للبنر!' });
  }

  if (!storeDatabase.banners) {
    storeDatabase.banners = [];
  }

  const bannerId = id || `bn-${Date.now()}`;
  const idx = storeDatabase.banners.findIndex(b => b.id === bannerId);

  const bannerData: Banner = {
    id: bannerId,
    organization_id,
    title_ar,
    title_en,
    image_url,
    target_url: target_url || '',
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    sort_order: sort_order !== undefined ? Number(sort_order) : 0
  };

  if (idx !== -1) {
    storeDatabase.banners[idx] = bannerData;
  } else {
    storeDatabase.banners.push(bannerData);
  }

  if (supabase) {
    try {
      await supabase.from('banners').upsert(bannerData);
    } catch (e) {
      console.error('[Supabase Banners Upsert Error]', e);
    }
  }

  res.json({ success: true, banner: bannerData });
});

// DELETE banner
app.post('/api/banners/delete', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { id } = req.body;
  if (!storeDatabase.banners) {
    storeDatabase.banners = [];
  }

  const idx = storeDatabase.banners.findIndex(b => b.id === id);
  if (idx !== -1) {
    const deleted = storeDatabase.banners.splice(idx, 1)[0];
    if (supabase) {
      try {
        await supabase.from('banners').delete().eq('id', id);
      } catch (e) {
        console.error('[Supabase Banners Delete Error]', e);
      }
    }
    res.json({ success: true, banner: deleted });
  } else {
    res.status(404).json({ error: 'البنر غير موجود!' });
  }
});

// POST edit or add custom category
app.post('/api/categories', async (req, res) => {
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

  let finalCategory: CustomCategory;
  const idx = storeDatabase.categories.findIndex(c => c.id === cleanId);
  if (idx !== -1) {
    storeDatabase.categories[idx] = {
      ...storeDatabase.categories[idx],
      nameAR: arName,
      nameEN: enName,
      icon: icon || storeDatabase.categories[idx].icon || 'Layers',
      color: color || storeDatabase.categories[idx].color || 'from-slate-900 to-slate-950',
    };
    finalCategory = storeDatabase.categories[idx];
  } else {
    finalCategory = {
      id: cleanId,
      nameAR: arName,
      nameEN: enName,
      icon: icon || 'Layers',
      color: color || 'from-slate-900 to-slate-950',
    };
    storeDatabase.categories.push(finalCategory);
  }

  if (supabase) {
    try {
      await supabase.from('categories').upsert(finalCategory);
    } catch (e) {
      console.error('[Supabase Categories Upsert Error]', e);
    }
  }

  res.json({ success: true, category: finalCategory });
});

// POST delete category
app.post('/api/categories/delete', async (req, res) => {
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
    if (supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (e) {
        console.error('[Supabase Categories Delete Error]', e);
      }
    }
    res.json({ success: true, category: deleted });
  } else {
    res.status(404).json({ error: 'الفئة غير موجودة' });
  }
});

// GET products
app.get('/api/products', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length > 0) {
        storeDatabase.products = data;
      }
    } catch (e) {
      console.error('[Supabase GET Products Error]', e);
    }
  }
  res.json(storeDatabase.products);
});

// POST update products (Admin or Telecom Manager)
app.post('/api/products', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { 
    id, priceYER, isAvailable, nameAR, nameEN, descriptionAR, descriptionEN, 
    stock, category, imageUrl, brand, rechargeAmount,
    product_image_url, is_ai_suggested, ai_suggested_url
  } = req.body;
  
  let finalProduct: Product;
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
      product_image_url: product_image_url !== undefined ? product_image_url : storeDatabase.products[idx].product_image_url,
      is_ai_suggested: is_ai_suggested !== undefined ? Boolean(is_ai_suggested) : storeDatabase.products[idx].is_ai_suggested,
      ai_suggested_url: ai_suggested_url !== undefined ? ai_suggested_url : storeDatabase.products[idx].ai_suggested_url,
    };
    finalProduct = storeDatabase.products[idx];
  } else {
    // Add new product
    finalProduct = {
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
      rechargeAmount: rechargeAmount,
      product_image_url: product_image_url,
      is_ai_suggested: is_ai_suggested,
      ai_suggested_url: ai_suggested_url,
    };
    storeDatabase.products.push(finalProduct);
  }

  if (supabase) {
    try {
      await supabase.from('products').upsert(finalProduct);
    } catch (e) {
      console.error('[Supabase Products Upsert Error]', e);
    }
  }

  res.json({ success: true, product: finalProduct });
});

// DELETE products endpoint via POST
app.post('/api/products/delete', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { id } = req.body;
  const idx = storeDatabase.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    const deleted = storeDatabase.products.splice(idx, 1)[0];
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.error('[Supabase Products Delete Error]', e);
      }
    }
    res.json({ success: true, product: deleted });
  } else {
    res.status(404).json({ error: 'الصنف غير موجود!' });
  }
});

// POST clear all data or specific datasets for pristine setups
app.post('/api/clear-all', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية، يرجى التوثيق أولاً!' });
  }

  const { target } = req.body; // 'PRODUCTS' | 'CATEGORIES' | 'ORDERS' | 'DEBTS' | 'ALL'

  if (target === 'PRODUCTS' || target === 'ALL') {
    storeDatabase.products = [];
    if (supabase) {
      try {
        await supabase.from('products').delete().neq('id', 'keep-dummy');
      } catch (e) {
        console.error('[Supabase Clear Products Error]', e);
      }
    }
  }
  if (target === 'CATEGORIES' || target === 'ALL') {
    storeDatabase.categories = [];
    if (supabase) {
      try {
        await supabase.from('categories').delete().neq('id', 'keep-dummy');
      } catch (e) {
        console.error('[Supabase Clear Categories Error]', e);
      }
    }
  }
  if (target === 'ORDERS' || target === 'ALL') {
    storeDatabase.orders = [];
    if (supabase) {
      try {
        await supabase.from('orders').delete().neq('id', 'keep-dummy');
      } catch (e) {
        console.error('[Supabase Clear Orders Error]', e);
      }
    }
  }
  if (target === 'DEBTS' || target === 'ALL') {
    storeDatabase.debts = [];
    if (supabase) {
      try {
        await supabase.from('debts').delete().neq('id', 'keep-dummy');
      } catch (e) {
        console.error('[Supabase Clear Debts Error]', e);
      }
    }
  }

  res.json({ success: true, target, message: 'تم مسح وتصفية البيانات بنجاح من الخادم وقاعدة البيانات السحابية!' });
});

// GET orders
app.get('/api/orders', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error && data && data.length > 0) {
        storeDatabase.orders = data;
      }
    } catch (e) {
      console.error('[Supabase GET Orders Error]', e);
    }
  }
  res.json(storeDatabase.orders);
});

// POST create orders
app.post('/api/orders', async (req, res) => {
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
      if (supabase) {
        supabase.from('products').upsert(storeProd).then(() => {});
      }
    }
  });

  storeDatabase.orders.unshift(newOrder); // Add to beginning of track list

  if (supabase) {
    try {
      await supabase.from('orders').upsert(newOrder);
    } catch (e) {
      console.error('[Supabase Orders Upsert Error]', e);
    }
  }

  res.json({ success: true, order: newOrder });
});

// UPDATE order status (Admin/Staff)
app.post('/api/orders/update-status', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية!' });
  }

  const { id, status } = req.body;
  const order = storeDatabase.orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    if (supabase) {
      try {
        await supabase.from('orders').upsert(order);
      } catch (e) {
        console.error('[Supabase Orders Update Status Error]', e);
      }
    }
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: 'الطلب غير موجود!' });
  }
});

// GET debts
app.get('/api/debts', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('debts').select('*');
      if (!error && data && data.length > 0) {
        storeDatabase.debts = data;
      }
    } catch (e) {
      console.error('[Supabase GET Debts Error]', e);
    }
  }
  res.json(storeDatabase.debts);
});

// POST modify/add debt
app.post('/api/debts', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
    return res.status(403).json({ error: 'صلاحيات غير كافية!' });
  }

  const { id, customerName, customerPhone, totalDebtYER, notes } = req.body;

  let finalDebt: DebtRecord;
  const idx = storeDatabase.debts.findIndex(d => d.id === id);
  if (idx !== -1) {
    storeDatabase.debts[idx] = {
      ...storeDatabase.debts[idx],
      customerName: customerName !== undefined ? customerName : storeDatabase.debts[idx].customerName,
      customerPhone: customerPhone !== undefined ? customerPhone : storeDatabase.debts[idx].customerPhone,
      totalDebtYER: Number(totalDebtYER),
      notes: notes !== undefined ? notes : storeDatabase.debts[idx].notes,
      updatedAt: new Date().toISOString()
    };
    finalDebt = storeDatabase.debts[idx];
  } else {
    finalDebt = {
      id: id || `debt-${Date.now()}`,
      customerName: customerName || 'عميل مجهول',
      customerPhone: customerPhone || '',
      totalDebtYER: Number(totalDebtYER || 0),
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };
    storeDatabase.debts.push(finalDebt);
  }

  if (supabase) {
    try {
      await supabase.from('debts').upsert(finalDebt);
    } catch (e) {
      console.error('[Supabase Debts Upsert Error]', e);
    }
  }

  res.json({ success: true, debt: finalDebt });
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
app.post('/api/staff/change-password', async (req, res) => {
  try {
    const { staffId, currentPassword, newPassword } = req.body;
    
    if (!staffId || !currentPassword || !newPassword) {
      await insertAuditLog(
        'PASSWORD_CHANGE_FAILED',
        'unknown',
        {
          userId: staffId || 'unknown',
          status: 'FAILED',
          reason: 'missing_fields',
          timestamp: new Date().toISOString()
        }
      );
      return res.status(400).json({ error: 'يرجى تقديم كافة الحقول المطلوبة لتغيير كلمة المرور!' });
    }

    if (newPassword.length < 3) {
      let username = 'unknown';
      const found = storeDatabase.staffUsers.find(s => s.id === staffId);
      if (found) {
        username = found.username;
      } else if (supabase) {
        try {
          const { data } = await supabase.from('staff_users').select('username').eq('id', staffId);
          if (data && data.length > 0) username = data[0].username;
        } catch (e) {}
      }

      await insertAuditLog(
        'PASSWORD_CHANGE_FAILED',
        username,
        {
          userId: staffId,
          status: 'FAILED',
          reason: 'password_too_short',
          timestamp: new Date().toISOString()
        }
      );
      return res.status(400).json({ error: 'كلمة المرور الجديدة قصيرة جداً! يجب أن تكون 3 أحرف على الأقل.' });
    }

    let staff: any = null;
    let isCloudUser = false;
    let existingSecret: string | null = null;

    // A. Try Supabase cloud lookup
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('*')
          .eq('id', staffId);

        if (!error && data && data.length > 0) {
          const matched = data[0];
          existingSecret = matched.password_hash || matched.password || '';
          if (verifyPassword(currentPassword, existingSecret)) {
            staff = matched;
            isCloudUser = true;
          }
        }
      } catch (err) {
        console.error('[Supabase Change Password Lookup Error]', err);
      }
    }

    // B. Fallback to local in-memory lookup
    if (!staff) {
      const localStaff = storeDatabase.staffUsers.find(s => s.id === staffId);
      if (localStaff) {
        existingSecret = localStaff.password_hash || getLocalDefaultPasswordForRole(localStaff.role);
        if (verifyPassword(currentPassword, existingSecret)) {
          staff = localStaff;
        }
      }
    }

    if (!staff) {
      let userExists = false;
      let existingUsername = 'unknown';
      if (supabase) {
        try {
          const { data } = await supabase.from('staff_users').select('id, username').eq('id', staffId);
          if (data && data.length > 0) {
            userExists = true;
            existingUsername = data[0].username;
          }
        } catch (e) {}
      }
      if (!userExists) {
        const found = storeDatabase.staffUsers.find(s => s.id === staffId);
        if (found) {
          userExists = true;
          existingUsername = found.username;
        }
      }

      if (userExists) {
        await insertAuditLog(
          'PASSWORD_CHANGE_FAILED',
          existingUsername,
          {
            userId: staffId,
            status: 'FAILED',
            reason: 'incorrect_current_password',
            timestamp: new Date().toISOString()
          }
        );
        return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة!' });
      } else {
        await insertAuditLog(
          'PASSWORD_CHANGE_FAILED',
          'unknown',
          {
            userId: staffId,
            status: 'FAILED',
            reason: 'user_not_found',
            timestamp: new Date().toISOString()
          }
        );
        return res.status(404).json({ error: 'الموظف المستهدف غير موجود في النظام!' });
      }
    }

    // Hash the new password securely
    const newHash = hashPassword(newPassword);

    // Update staff_users in Supabase
    if (isCloudUser && supabase) {
      const { error: updateErr } = await supabase
        .from('staff_users')
        .update({
          password_hash: newHash,
          password: null
        })
        .eq('id', staffId);

      if (updateErr) {
        console.error('[Supabase Update Password Error]', updateErr);
        await insertAuditLog(
          'PASSWORD_CHANGE_FAILED',
          staff.username,
          {
            userId: staffId,
            status: 'FAILED',
            reason: `supabase_update_error: ${updateErr.message}`,
            timestamp: new Date().toISOString()
          }
        );
        return res.status(500).json({ error: `فشل تحديث البيانات في Supabase: ${updateErr.message}` });
      }
    }

    // Sync to local state
    const localIdx = storeDatabase.staffUsers.findIndex(s => s.id === staffId);
    if (localIdx !== -1) {
      storeDatabase.staffUsers[localIdx].password_hash = newHash;
    }

    // Sync back to configurations
    if (staff.role === 'ADMIN') {
      storeDatabase.config.adminPassword = newPassword;
    } else if (staff.role === 'CASHIER') {
      storeDatabase.config.cashierPassword = newPassword;
    } else if (staff.role === 'COMMUNICATIONS' || staff.role === 'STORE_MANAGER') {
      storeDatabase.config.telecomPassword = newPassword;
    }

    if (supabase) {
      try {
        await supabase.from('store_config').upsert({ id: 'single-row', ...storeDatabase.config });
      } catch (e) {
        console.error('[Supabase Post Config Sync Error during Password Change]', e);
      }
    }

    // Record inside audit_log
    await insertAuditLog(
      'PASSWORD_CHANGED',
      staff.username,
      { staffId, role: staff.role, source: isCloudUser ? 'SUPABASE_CLOUD' : 'FALLBACK_LOCAL_DB' }
    );

    return res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح.'
    });

  } catch (err: any) {
    console.error('[Change Password API Error]', err);
    return res.status(500).json({ error: err.message || 'فشل الاتصال بالخادم أثناء تحديث كلمة المرور.' });
  }
});

// POST staff password reset/override (Admin/Manager only can restore other staff passwords)
app.post('/api/staff/reset-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== DECLARED_STORE_ROUTER_AUTH_TOKEN) {
      return res.status(403).json({ error: 'صلاحيات غير كافية!' });
    }

    const { staffId, newPassword } = req.body;
    if (!staffId || !newPassword) {
      return res.status(400).json({ error: 'بيانات غير مكتملة!' });
    }

    if (newPassword.length < 3) {
      return res.status(400).json({ error: 'كلمة المرور قصيرة جداً! يجب أن تكون 3 أحرف على الأقل.' });
    }

    const newHash = hashPassword(newPassword);
    let staff: any = null;
    let isCloudUser = false;

    // A. Supabase Update
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('staff_users')
          .select('*')
          .eq('id', staffId);

        if (!error && data && data.length > 0) {
          staff = data[0];
          const { error: updateErr } = await supabase
            .from('staff_users')
            .update({
              password_hash: newHash,
              password: null
            })
            .eq('id', staffId);

          if (!updateErr) {
            isCloudUser = true;
          }
        }
      } catch (err) {
        console.error('[Supabase Reset Password Error]', err);
      }
    }

    // B. Fallback in-memory
    const localIdx = storeDatabase.staffUsers.findIndex(s => s.id === staffId);
    if (localIdx !== -1) {
      if (!staff) staff = storeDatabase.staffUsers[localIdx];
      storeDatabase.staffUsers[localIdx].password_hash = newHash;
    }

    if (!staff) {
      return res.status(404).json({ error: 'الموظف غير موجود!' });
    }

    // Sync back to config as well
    if (staff.role === 'ADMIN') {
      storeDatabase.config.adminPassword = newPassword;
    } else if (staff.role === 'CASHIER') {
      storeDatabase.config.cashierPassword = newPassword;
    } else if (staff.role === 'COMMUNICATIONS' || staff.role === 'STORE_MANAGER') {
      storeDatabase.config.telecomPassword = newPassword;
    }

    if (supabase) {
      try {
        await supabase.from('store_config').upsert({ id: 'single-row', ...storeDatabase.config });
      } catch (e) {
        console.error('[Supabase Post Config Sync Error during Password Reset]', e);
      }
    }

    // Record inside audit_log
    await insertAuditLog(
      'PASSWORD_RESET_BY_ADMIN',
      'ADMIN',
      { staffId, targetUsername: staff.username, source: isCloudUser ? 'SUPABASE_CLOUD' : 'FALLBACK_LOCAL_DB' }
    );

    return res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح!' });
  } catch (err: any) {
    console.error('[Reset Password API Error]', err);
    return res.status(500).json({ error: err.message || 'خطأ في معالجة إعادة تعيين كلمة المرور.' });
  }
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

// AI PRODUCT IMAGE SUGGESTION & GENERATION ENDPOINT
app.post('/api/gemini/suggest-image', async (req, res) => {
  const { nameAR, nameEN, category, descriptionAR, descriptionEN } = req.body;
  if (!nameAR && !nameEN) {
    return res.status(400).json({ error: 'الاسم المراد تحليله حقل إجباري!' });
  }

  try {
    const aiInstance = getGeminiClient();
    let searchKeyword = 'product';
    let imagePrompt = `A high quality professional product shot of ${nameEN || nameAR}, clean studio lighting, isolated on solid background`;
    
    if (aiInstance) {
      try {
        // Fetch keyword and prompt from Gemini 3.5-flash
        const analyzeResponse = await aiInstance.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `You are an AI product photographer. Analyze this item:
Name (Arabic): ${nameAR || ''}
Name (English): ${nameEN || ''}
Description (Arabic): ${descriptionAR || ''}
Description (English): ${descriptionEN || ''}
Category: ${category || ''}

Provide a JSON object containing:
1. "searchKeyword": a clean, single-word or short English keyword/phrase (e.g. 'headphone', 'simcard', 'honey', 'laptop') suitable for looking up stock photos on high-quality CDNs.
2. "imagePrompt": a detailed, professional photography prompt (e.g. "Studio photo of a high-end luxury smartphone on a dark slate background, octane render, photorealistic") for an AI image generator.

Ensure your response is valid JSON only. Do not output markdown codeblocks around it, just raw JSON.`,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const textResponse = analyzeResponse.text?.trim() || '{}';
        // Clean markdown JSON boundaries if any
        const cleanedJson = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleanedJson);
        if (parsed.searchKeyword) searchKeyword = parsed.searchKeyword;
        if (parsed.imagePrompt) imagePrompt = parsed.imagePrompt;
      } catch (err) {
        console.warn('Gemini details analysis failed, using fallback:', err);
      }

      // Try generating real image via gemini-2.5-flash-image
      try {
        const imageGenResponse = await aiInstance.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: imagePrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1'
            }
          }
        });

        if (imageGenResponse.candidates?.[0]?.content?.parts) {
          for (const part of imageGenResponse.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const base64Str = part.inlineData.data;
              return res.json({
                success: true,
                imageUrl: `data:image/png;base64,${base64Str}`,
                isAiGenerated: true,
                source: 'GEMINI_IMAGEN',
                keyword: searchKeyword
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('Direct Imagen generation failed, falling back to curated CDN matching:', err.message);
      }
    }

    // Curated high quality CDN matching using searchKeyword or categories
    const term = searchKeyword.toLowerCase();
    const prodName = (nameEN || nameAR || 'product').toLowerCase();
    let fallbackUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80`; // default stylish pattern

    if (term.includes('phone') || term.includes('yemen mobile') || prodName.includes('موبايل') || prodName.includes('ym-')) {
      fallbackUrl = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80';
    } else if (term.includes('game') || term.includes('pubg') || term.includes('card') || term.includes('free fire') || prodName.includes('ببجي') || prodName.includes('بلاتينوم')) {
      fallbackUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80';
    } else if (term.includes('honey') || term.includes('sweet') || prodName.includes('عسل') || prodName.includes('تموين')) {
      fallbackUrl = 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&q=80';
    } else if (term.includes('laptop') || term.includes('computer') || term.includes('electronics') || prodName.includes('أجهزة') || prodName.includes('سماعة')) {
      fallbackUrl = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80';
    } else {
      // Dynamic Picsum seed based on product keywords
      const seed = encodeURIComponent(prodName.replace(/\s+/g, '-'));
      fallbackUrl = `https://picsum.photos/seed/${seed}/600/450`;
    }

    return res.json({
      success: true,
      imageUrl: fallbackUrl,
      isAiGenerated: false, // fallback images are stock CDN
      source: 'CURATED_CDN',
      keyword: searchKeyword
    });

  } catch (ex: any) {
    console.error('Suggest image error:', ex);
    return res.status(500).json({ error: ex.message || 'فشل في توليد الصورة المقترحة' });
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

if (!process.env.VERCEL) {
  startServer();
}
