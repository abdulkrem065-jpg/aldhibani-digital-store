/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Layers, Bot, Radio, Cpu, RefreshCw, Sparkles, 
  HelpCircle, ArrowLeftRight, CheckCircle2, ShoppingBag, Terminal, Store, ShoppingCart,
  Search, ClipboardList, Clock, Truck, X, FileText, Gift, Phone, User, Printer
} from 'lucide-react';

import { Product, CartItem, Currency, Language, StaffUser, StoreConfig, ProductCategory, CustomCategory } from './types';
import Gateway from './auth/Gateway';
import Header from './layout/Header';
import Sections from './matrix/Sections';
import { ProductCard, ShoppingCartDrawer } from './components/Cards';
import Dashboard from './admin/Dashboard';
import { 
  DEFAULT_STORE_CONFIG, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, 
  DEFAULT_ORDERS, DEFAULT_DEBTS, DEFAULT_STAFF, 
  getSavedItem, saveItem 
} from './data/defaultData';
import { SupabaseServerlessDB } from './lib/supabase';

export default function App() {
  // Session Router States
  const [view, setView] = useState<'GATEWAY' | 'STORE'>('GATEWAY');
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);

  // Global Context preferences
  const [language, setLanguage] = useState<Language>('AR');
  const [currency, setCurrency] = useState<Currency>('YER');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Store data synced with serverless state (Supabase authority)
  const [config, setConfig] = useState<StoreConfig>(() => SupabaseServerlessDB.getConfig());
  const [products, setProducts] = useState<Product[]>(() => SupabaseServerlessDB.getProducts());
  const [categories, setCategories] = useState<CustomCategory[]>(() => SupabaseServerlessDB.getCategories());
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [activeBrand, setActiveBrand] = useState<string | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Storefront tracking state definitions
  const [storefrontTrackingId, setStorefrontTrackingId] = useState('');
  const [storefrontTrackedOrder, setStorefrontTrackedOrder] = useState<any | null>(null);
  const [storefrontIsSearching, setStorefrontIsSearching] = useState(false);
  const [storefrontTrackingError, setStorefrontTrackingError] = useState('');

  const getStorefrontStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'PROCESSING': return <Truck className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <X className="w-5 h-5 text-red-500" />;
    }
  };

  const getStorefrontStatusLabel = (status: string) => {
    if (language === 'AR') {
      switch (status) {
        case 'PENDING': return 'قيد الانتظار والمراجعة';
        case 'PROCESSING': return 'جاري التجهيز والشحن الفوري';
        case 'COMPLETED': return 'تم التسليم بنجاح وتزويد الخدمة';
        default: return 'ملغي / مسترجع';
      }
    } else {
      switch (status) {
        case 'PENDING': return 'Pending Review';
        case 'PROCESSING': return 'Processing & Fast Dispatching';
        case 'COMPLETED': return 'Completed & Delivered';
        default: return 'Cancelled / Refunded';
      }
    }
  };

  const handleStorefrontTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storefrontTrackingId.trim()) return;

    setStorefrontIsSearching(true);
    setStorefrontTrackingError('');
    setStorefrontTrackedOrder(null);

    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const orders = await response.json();
        const found = orders.find((o: any) => o.id.toUpperCase() === storefrontTrackingId.trim().toUpperCase());
        if (found) {
          setStorefrontTrackedOrder(found);
          setStorefrontIsSearching(false);
          return;
        }
      }
      throw new Error('Fallback search');
    } catch (err) {
      // Local Storage Offline fallback lookup
      const localOrders = getSavedItem('aldhibani_local_orders', DEFAULT_ORDERS);
      const found = localOrders.find((o: any) => o.id.toUpperCase() === storefrontTrackingId.trim().toUpperCase());
      if (found) {
        setStorefrontTrackedOrder(found);
      } else {
        setStorefrontTrackingError(language === 'AR'
          ? 'لم نجد أي طلب بهذا الرقم المرجعي المعطى. رجاءً تأكد من صحة رقم الطلب وأعد البحث.'
          : 'Order tracking ID not found. Please check and try again.'
        );
      }
    } finally {
      setStorefrontIsSearching(false);
    }
  };

  // Fetch initial storefront definitions
  const fetchStorefrontData = async () => {
    try {
      const configPromise = fetch('/api/config').catch(() => null);
      const productsPromise = fetch('/api/products').catch(() => null);
      const categoriesPromise = fetch('/api/categories').catch(() => null);

      const [configRes, productsRes, categoriesRes] = await Promise.all([
        configPromise,
        productsPromise,
        categoriesPromise
      ]);

      if (configRes && configRes.ok) {
        const confData = await configRes.json();
        setConfig(confData);
        saveItem('aldhibani_local_config', confData);
      }
      if (productsRes && productsRes.ok) {
        const prodData = await productsRes.json();
        setProducts(prodData);
        saveItem('aldhibani_local_products', prodData);
      }
      if (categoriesRes && categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData);
        saveItem('aldhibani_local_categories', catData);
      }
    } catch (e) {
      console.error("Failed syncing frontend states: ", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefrontData();
  }, []);

  // Handle traditional Login
  const handleLoginSuccess = (user: StaffUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    setView('STORE');
    setIsAdminView(true); // Open directly into Admin view for convenience
  };

  // Visitor shopping bypass
  const handleBypass = (targetCategory?: ProductCategory) => {
    setCurrentUser(null);
    setAuthToken(null);
    setView('STORE');
    setIsAdminView(false);
    if (targetCategory) {
      setActiveCategory(targetCategory);
    } else {
      setActiveCategory('ALL');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setView('GATEWAY');
    setIsAdminView(false);
  };

  // Adding product to basket logic (handling direct cell / id entries)
  const handleAddToCart = (product: Product, quantity = 1, rechargeDetails?: any) => {
    setCart((prevCart) => {
      // For digital items, phone or playerId acts as a unique qualifier so they can add multiple lines for different numbers.
      const existingIndex = prevCart.findIndex(
        (item) => 
          item.product.id === product.id && 
          JSON.stringify(item.rechargeDetails) === JSON.stringify(rechargeDetails)
      );

      if (existingIndex !== -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { product, quantity, rechargeDetails }];
      }
    });

    // Removed opening the cart drawer automatically to not block screen view of the user
    // setIsCartOpen(true);

    const addedText = language === 'AR' 
      ? `تمت إضافة (${product.nameAR}) إلى السلة بنجاح! 🛒`
      : `Added (${product.nameEN}) to basket successfully! 🛒`;
    setToastMessage(addedText);
    setTimeout(() => {
      setToastMessage((prev) => prev === addedText ? null : prev);
    }, 2800);
  };

  const handleRemoveCartItem = (productId: string, rechargeDetails?: any) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            JSON.stringify(item.rechargeDetails) === JSON.stringify(rechargeDetails)
          )
      )
    );
  };

  const handleUpdateQuantity = (productId: string, quantity: number, rechargeDetails?: any) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId &&
        JSON.stringify(item.rechargeDetails) === JSON.stringify(rechargeDetails)
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Filter Catalog array dynamically based on active filters
  const filteredProducts = products.filter((prod) => {
    // 1. Text Query Filter
    const query = searchQuery.trim().toLowerCase();
    const matchesText = query === '' || 
      prod.nameAR.toLowerCase().includes(query) ||
      prod.nameEN.toLowerCase().includes(query) ||
      (prod.brand && prod.brand.toLowerCase().includes(query)) ||
      prod.category.toLowerCase().includes(query);

    // 2. Category Filter
    const matchesCategory = activeCategory === 'ALL' || prod.category === activeCategory;

    // 3. Brand/Operator Filter
    const matchesBrand = activeBrand === 'ALL' || prod.brand === activeBrand;

    return matchesText && matchesCategory && matchesBrand;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* Dynamic Main Routing Switches */}
      {view === 'GATEWAY' ? (
        <Gateway
          onBypass={handleBypass}
          onLoginSuccess={handleLoginSuccess}
          storeNameAR={config.shopNameAR}
          storeNameEN={config.shopNameEN}
          logoEmoji={config.logoEmoji}
          exchangeUSD={config.exchangeRateUSD}
        />
      ) : (
        /* Store Viewport Wrapper */
        <div className="flex-1 flex flex-col justify-between">
          <Header
            language={language}
            setLanguage={setLanguage}
            currency={currency}
            setCurrency={setCurrency}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            config={config}
            user={currentUser}
            onLogout={handleLogout}
            onToggleAdminView={() => setIsAdminView(!isAdminView)}
            isAdminView={isAdminView}
            onAddToCart={(p) => handleAddToCart(p, 1, p.category.startsWith('DIGITAL_') ? { notes: 'AI added line' } : undefined)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
          />

          <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">SYNCING STABLE COMMERCE BUFFERS...</span>
              </div>
            ) : isAdminView && currentUser ? (
              /* Administrative Dashboard Workspace Area */
              <Dashboard
                language={language}
                currentUser={currentUser}
                authToken={authToken || ''}
                currentConfig={config}
                onConfigChanged={(updated) => setConfig(updated)}
                categories={categories}
                onCategoriesChanged={(updated) => setCategories(updated)}
                products={products}
                onProductsChanged={(updated) => {
                  setProducts(updated);
                  saveItem('aldhibani_local_products', updated);
                }}
                onClose={() => setIsAdminView(false)}
              />
            ) : (
              /* Shopper Catalog Grid View */
              <div className="space-y-12 animate-fadeIn">
                
                {/* Section selection matrix */}
                <Sections
                  language={language}
                  onCategorySelect={(cat) => setActiveCategory(cat)}
                  activeCategory={activeCategory}
                  onBrandSelect={(br) => setActiveBrand(br)}
                  activeBrand={activeBrand}
                  categories={categories}
                />

                {/* 📋 NEW PREMIUM STOREFRONT ORDER TRACKER WIDGET */}
                <div className="bg-[#0b1220]/75 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5" dir={language === 'AR' ? 'rtl' : 'ltr'}>
                    <div className="text-right flex flex-col gap-1">
                      <h3 className="text-lg font-extrabold text-white flex items-center gap-2.5">
                        <ClipboardList className="w-5 h-5 text-cyan-400" />
                        <span>{language === 'AR' ? 'تتبع فوري لحالة طلبك الحالي' : 'Live Order Tracking Terminal'}</span>
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xl">
                        {language === 'AR' 
                          ? 'أدخل رقم الطلب الخاص بك (المستلم في الفاتورة أو الرسالة، مثل HYB-XXXXXX) للاستعلام فوراً عن حالة تزويد الرصيد أو الشحن التمويني.' 
                          : 'Enter your unique order tracking reference ID from your invoice/message to monitor status.'}
                      </p>
                    </div>

                    {/* Compact input form with neon emphasis */}
                    <form onSubmit={handleStorefrontTrackOrder} className="flex gap-2.5 w-full md:max-w-md">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          required
                          value={storefrontTrackingId}
                          onChange={(e) => setStorefrontTrackingId(e.target.value)}
                          placeholder="HYB-XXXXXX"
                          className="w-full bg-slate-950/90 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 rounded-2xl px-4 py-3 text-sm text-center font-mono font-black tracking-widest text-cyan-300 uppercase placeholder-slate-700 transition-all shadow-inner uppercase"
                          id="storefront-ordertrack-id"
                        />
                        {storefrontTrackingId && (
                          <button
                            type="button"
                            onClick={() => {
                              setStorefrontTrackingId('');
                              setStorefrontTrackedOrder(null);
                              setStorefrontTrackingError('');
                            }}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={storefrontIsSearching}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs tracking-wider transition-all hover:scale-102 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/30"
                        id="btn-storefront-track-submit"
                      >
                        {storefrontIsSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>{language === 'AR' ? 'استعلام' : 'Track'}</span>
                      </button>
                    </form>
                  </div>

                  {/* Error & Info messages */}
                  <AnimatePresence>
                    {storefrontTrackingError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-4 p-4 bg-red-950/40 border border-red-900/40 rounded-2xl text-red-300 text-xs text-right flex items-center gap-2.5 justify-end"
                        dir={language === 'AR' ? 'rtl' : 'ltr'}
                      >
                        <span>{storefrontTrackingError}</span>
                        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Detailed search outputs */}
                  <AnimatePresence>
                    {storefrontTrackedOrder && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-5 border-t border-slate-900 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" dir={language === 'AR' ? 'rtl' : 'ltr'}>
                          
                          {/* Left layout column: Order Status, Progress timeline steps */}
                          <div className="lg:col-span-7 space-y-5 text-right">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/65 border border-slate-900 p-4 rounded-2xl animate-fadeIn">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-500 font-mono tracking-wider">ORDER REFERENCE CODE</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-mono font-black text-cyan-400 uppercase tracking-widest">{storefrontTrackedOrder.id}</span>
                                  
                                  {/* 🔮 PREMIUM INVOICE PRINTER ICON BUTTON */}
                                  <button
                                    onClick={() => window.print()}
                                    className="p-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 hover:border-cyan-500 border border-slate-800 text-cyan-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider shadow-md"
                                    id="btn-print-order-tracking"
                                    title={language === 'AR' ? 'طباعة فاتورة تتبع الطلب الكلية' : 'Print Invoice Receipt Record'}
                                  >
                                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{language === 'AR' ? 'طباعة الفاتورة' : 'Print Receipt'}</span>
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-md">
                                {getStorefrontStatusIcon(storefrontTrackedOrder.status)}
                                <span className="text-xs font-black text-slate-100 font-sans">
                                  {getStorefrontStatusLabel(storefrontTrackedOrder.status)}
                                </span>
                              </div>
                            </div>

                            {/* 🖨️ DETAILED PRINT-ONLY INVOICE COMPONENT (Rendered strictly by print engine) */}
                            <div id="printable-order-invoice-area" className="hidden print:block text-slate-900 bg-white" dir={language === 'AR' ? 'rtl' : 'ltr'}>
                              <div className="text-center pb-4 border-b-2 border-dashed border-slate-900">
                                <h1 className="text-lg font-black tracking-wide">{config.shopNameAR || 'مستودع الذيباني الفاخر VIP'}</h1>
                                <h2 className="text-xs font-bold text-slate-800">{config.shopNameEN || 'Aldhibani VIP Luxury Merchant'}</h2>
                                <p className="text-[9px] text-slate-600 mt-1">سجل التتبع اللوجستي وشحن الباقات الرقمية بالريال اليمني YER</p>
                              </div>

                              <div className="text-center py-2.5">
                                <h3 className="text-xs font-black tracking-wider">سند شحن وتتبع حالة طلب / DISPATCH INVOICE RECORD</h3>
                              </div>

                              <div className="grid grid-cols-2 gap-y-2.5 text-xs py-3 border-t border-b border-dashed border-slate-900">
                                <div>
                                  <span className="font-extrabold">رقم الفاتورة المرجعي:</span> <span className="font-mono">{storefrontTrackedOrder.id}</span>
                                </div>
                                <div className="text-left font-mono">
                                  <strong>Invoice ID:</strong> {storefrontTrackedOrder.id}
                                </div>

                                <div>
                                  <span className="font-extrabold">تاريخ السند:</span> <span>{new Date(storefrontTrackedOrder.createdAt).toLocaleString('ar-YE')}</span>
                                </div>
                                <div className="text-left font-mono">
                                  <strong>Date:</strong> {new Date(storefrontTrackedOrder.createdAt).toLocaleString('en-US')}
                                </div>

                                <div>
                                  <span className="font-extrabold">العميل المستلم:</span> <span>{storefrontTrackedOrder.customerName}</span>
                                </div>
                                <div className="text-left">
                                  <strong>Customer:</strong> {storefrontTrackedOrder.customerName}
                                </div>

                                <div>
                                  <span className="font-extrabold">رقم الاتصال:</span> <span className="font-mono">{storefrontTrackedOrder.customerPhone}</span>
                                </div>
                                <div className="text-left font-mono">
                                  <strong>Phone:</strong> {storefrontTrackedOrder.customerPhone}
                                </div>

                                <div>
                                  <span className="font-extrabold">طريقة سداد الدفع:</span> <span>{storefrontTrackedOrder.paymentMethod}</span>
                                </div>
                                <div className="text-left">
                                  <strong>Payment:</strong> {storefrontTrackedOrder.paymentMethod}
                                </div>

                                <div>
                                  <span className="font-extrabold">منفذ الصندوق المصرفي:</span> <span className="font-mono">{storefrontTrackedOrder.cashierId}</span>
                                </div>
                                <div className="text-left font-mono">
                                  <strong>Drawer ID:</strong> {storefrontTrackedOrder.cashierId}
                                </div>

                                <div>
                                  <span className="font-extrabold">حالة المعالجة الحالية:</span> <span className="font-extrabold underline">{getStorefrontStatusLabel(storefrontTrackedOrder.status)}</span>
                                </div>
                                <div className="text-left">
                                  <strong>Status:</strong> {storefrontTrackedOrder.status}
                                </div>
                              </div>

                              {/* Item list */}
                              <div className="py-4">
                                <h4 className="text-xs font-black mb-2 border-b border-slate-900 pb-1">تفاصيل السلع والمشتريات / ORDERED PACKAGES SUMMARY</h4>
                                <table className="w-full text-xs text-right border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-900 text-[10px]">
                                      <th className="py-1 text-right">السلعة / الخدمة (Description)</th>
                                      <th className="py-1 text-center">الكمية (Qty)</th>
                                      <th className="py-1 text-left">القيمة (Total YER)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {storefrontTrackedOrder.items.map((item: any, idx: number) => (
                                      <tr key={idx} className="border-b border-dashed border-slate-200">
                                        <td className="py-1.5 font-bold">
                                          {language === 'AR' ? item.product.nameAR : item.product.nameEN}
                                          {item.rechargeDetails?.phoneNumber && (
                                            <div className="text-[9px] text-slate-700 font-mono">Mobile Target: {item.rechargeDetails.phoneNumber}</div>
                                          )}
                                          {item.rechargeDetails?.playerId && (
                                            <div className="text-[9px] text-slate-700 font-mono">Gaming Player ID: {item.rechargeDetails.playerId}</div>
                                          )}
                                        </td>
                                        <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                                        <td className="py-1.5 text-left font-mono font-bold">{(item.product.priceYER * item.quantity).toLocaleString()} YER</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Total Price */}
                              <div className="border-t-2 border-dashed border-slate-900 pt-3 flex justify-between items-center text-xs font-black">
                                <span>القيمة الإجمالية الفاتورة بالريال اليمني (YER):</span>
                                <span className="font-mono text-sm border border-slate-900 px-3 py-1 bg-slate-50">{storefrontTrackedOrder.totalYER.toLocaleString()} YER</span>
                              </div>

                              {storefrontTrackedOrder.notes && (
                                <div className="mt-4 p-3 border border-slate-900 rounded bg-slate-50 text-[10px] space-y-1">
                                  <span className="font-extrabold block text-slate-700">ملاحظات وتوجيهات الشحن والتسليم:</span>
                                  <p>{storefrontTrackedOrder.notes}</p>
                                </div>
                              )}

                              <div className="text-center pt-8 mt-8 border-t border-dashed border-slate-500 text-[9px] text-slate-600 space-y-1">
                                <p className="font-black">مستودع الذيباني الفخم VIP - الريال اليمني مستقر للجمهور الكريم.</p>
                                <p>شكراً لثقتكم الغالية بنا. تم استخراج وطباعة هذا السند بنجاح سحابياً.</p>
                              </div>
                            </div>

                            {/* Beautiful visual stepper indicator */}
                            <div className="bg-slate-955 bg-slate-950/30 border border-slate-900/50 p-5 rounded-2xl space-y-4">
                              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block border-b border-slate-900 pb-2">
                                {language === 'AR' ? 'مراحل شحن وتجهيز الطلب' : 'Dispatch Progress Timeline'}
                              </span>

                              {storefrontTrackedOrder.status === 'CANCELLED' ? (
                                <div className="p-3 bg-red-950/20 border border-red-900/10 rounded-xl text-red-450 text-red-400 text-xs font-semibold">
                                  ⚠️ {language === 'AR' ? 'لقد تم إلغاء هذا الطلب أو استرجاعه من قبل موظفي الكادر.' : 'This order was cancelled or returned by administrative cashiers.'}
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-2 relative pt-2">
                                  {/* Track Line underlying */}
                                  <div className="absolute top-4 left-[16.66%] right-[16.66%] h-1 bg-slate-800 -z-1">
                                    <div 
                                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                                      style={{
                                        width: storefrontTrackedOrder.status === 'PENDING' ? '0%' :
                                               storefrontTrackedOrder.status === 'PROCESSING' ? '50%' : '100%'
                                      }}
                                    ></div>
                                  </div>

                                  {/* Step 1: Pending */}
                                  <div className="flex flex-col items-center text-center gap-1.5 z-10">
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                                      ['PENDING', 'PROCESSING', 'COMPLETED'].includes(storefrontTrackedOrder.status)
                                        ? 'bg-cyan-500 border-cyan-400 text-slate-955 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                        : 'bg-slate-900 border-slate-800 text-slate-500'
                                    }`}>
                                      ✓
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300">
                                      {language === 'AR' ? 'استلام الطلب' : 'Received'}
                                    </span>
                                  </div>

                                  {/* Step 2: Processing */}
                                  <div className="flex flex-col items-center text-center gap-1.5 z-10">
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                                      ['PROCESSING', 'COMPLETED'].includes(storefrontTrackedOrder.status)
                                        ? 'bg-blue-500 border-blue-400 text-slate-955 font-bold shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                                        : 'bg-slate-900 border-slate-800 text-slate-500'
                                    }`}>
                                      {storefrontTrackedOrder.status === 'PROCESSING' ? '⚙' : '✓'}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300">
                                      {language === 'AR' ? 'جاري الشحن/التعبئة' : 'Processing'}
                                    </span>
                                  </div>

                                  {/* Step 3: Completed */}
                                  <div className="flex flex-col items-center text-center gap-1.5 z-10">
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                                      storefrontTrackedOrder.status === 'COMPLETED'
                                        ? 'bg-emerald-500 border-emerald-400 text-slate-955 font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                        : 'bg-slate-900 border-slate-800 text-slate-500'
                                    }`}>
                                      ★
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300">
                                      {language === 'AR' ? 'مكتمل جاهز' : 'Completed'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Customer information details */}
                            <div className="grid grid-cols-2 gap-3.5">
                              <div className="bg-slate-950/40 border border-slate-900/60 p-3.5 rounded-xl">
                                <span className="text-[10px] text-slate-500 block text-right uppercase mb-1 font-mono">{language === 'AR' ? 'العميل الكود:' : 'Target Customer:'}</span>
                                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 justify-end">
                                  <span>{storefrontTrackedOrder.customerName || '-'}</span>
                                  <User className="w-3.5 h-3.5 text-cyan-400" />
                                </span>
                              </div>
                              <div className="bg-slate-950/40 border border-slate-900/60 p-3.5 rounded-xl">
                                <span className="text-[10px] text-slate-500 block text-right uppercase mb-1 font-mono">{language === 'AR' ? 'رقم الهاتف للاتصال:' : 'Beneficiary Phone:'}</span>
                                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 justify-end">
                                  <span>{storefrontTrackedOrder.customerPhone || '-'}</span>
                                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right layout column: Itemization lists & summary prices */}
                          <div className="lg:col-span-5 bg-slate-950/90 border border-slate-900 rounded-2xl p-4.5 text-right flex flex-col justify-between min-h-[220px]">
                            <div>
                              <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
                                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">PURCHASE LIST</span>
                                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-bold uppercase font-sans">
                                  {storefrontTrackedOrder.items.length} {language === 'AR' ? 'بنود' : 'Items'}
                                </span>
                              </div>

                              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                                {storefrontTrackedOrder.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                                    <div className="flex flex-col items-end gap-0.5 leading-snug">
                                      <span className="font-extrabold text-slate-200">
                                        {language === 'AR' ? item.product.nameAR : item.product.nameEN}
                                      </span>
                                      
                                      {item.rechargeDetails && (
                                        <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-950">
                                          {item.rechargeDetails.phoneNumber 
                                            ? `📞 Phone: ${item.rechargeDetails.phoneNumber}` 
                                            : `🎮 Player ID: ${item.rechargeDetails.playerId}`}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono font-black text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                                      {item.quantity}x
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-5 pt-3.5 border-t border-slate-900">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold">{language === 'AR' ? 'طريقة الدفع المقدمة:' : 'Payment Type:'}</span>
                                <span className="font-bold text-slate-300 font-sans">{storefrontTrackedOrder.paymentMethod || (language === 'AR' ? 'نقداً / تحويل' : 'Cash / Transfer')}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs mt-2">
                                <span className="text-slate-400 font-bold">{language === 'AR' ? 'مجموع سداد الفاتورة:' : 'Amount Paid:'}</span>
                                <span className="text-sm font-mono font-black text-emerald-400">
                                  {storefrontTrackedOrder.totalYER.toLocaleString()} YER
                                </span>
                              </div>

                              {storefrontTrackedOrder.notes && (
                                <div className="mt-4 p-2 bg-slate-900 border border-slate-850/65 rounded-lg text-[10px] text-amber-300 text-right">
                                  <span className="font-black text-slate-500 block text-[9px] mb-0.5 uppercase">ADMIN NOTES / الكادر:</span>
                                  {storefrontTrackedOrder.notes}
                                </div>
                              )}
                            </div>

                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sub-header list size indicators */}
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-cyan-400" />
                    <span className="font-black text-sm tracking-wide text-white uppercase">
                      {language === 'AR' ? 'كتالوج معروض الأصناف الحالي' : 'Live Showroom catalog'}
                    </span>
                    <span className="text-xs bg-slate-900 border border-slate-850 text-slate-400 px-2 py-0.5 rounded-lg font-mono font-bold">
                      {filteredProducts.length} Items Listed
                    </span>
                  </div>
                  {searchQuery && (
                    <span className="text-xs text-slate-505">
                      {language === 'AR' ? `فلترة لـ: "${searchQuery}"` : `Filtering for: "${searchQuery}"`}
                    </span>
                  )}
                </div>

                {/* Product Grid Layout */}
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 will-change-gpu" id="products-showroom-grid">
                    {filteredProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        language={language}
                        currency={currency}
                        exchangeUSD={config.exchangeRateUSD}
                        exchangeSAR={config.exchangeRateSAR}
                        onAddToCart={(prod: Product, qty: number, details?: any) => handleAddToCart(prod, qty, details)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center flex flex-col items-center justify-center text-slate-500 leading-relaxed font-mono">
                    <Layers className="w-10 h-10 text-slate-800 mb-2" />
                    <span className="text-xs">{language === 'AR' ? 'لم نجد أية سلع أو باقات تطابق فلترة المعروض حالياً.' : 'No items match current filters of the hypermarket warehouse.'}</span>
                    <button
                      onClick={() => {
                        setActiveCategory('ALL');
                        setActiveBrand('ALL');
                        setSearchQuery('');
                      }}
                      className="mt-3.5 px-4 py-2 bg-slate-900 hover:bg-slate-850 hover:border-cyan-500 text-cyan-400 border border-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {language === 'AR' ? 'إعادة الفلترة للكل' : 'Clear All Filters'}
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Floating Shopping Cart Button (Bottom-Right) */}
          <div className="fixed bottom-6 right-6 z-40">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpen(true)}
              className="w-15 h-15 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-2xl border border-white/10 cursor-pointer relative"
              id="btn-floating-cart"
            >
              <ShoppingCart className="w-6 h-6 text-white" />
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5.5 w-5.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5.5 w-5.5 bg-red-500 text-[10px] font-sans font-black items-center justify-center border border-slate-900 shadow-md text-white">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </span>
              )}
            </motion.button>
          </div>

          {/* Core Shopping Cart drawer */}
          <ShoppingCartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            currency={currency}
            language={language}
            exchangeUSD={config.exchangeRateUSD}
            exchangeSAR={config.exchangeRateSAR}
            currentUser={currentUser}
            activePaymentMethods={config.activePaymentMethods}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={() => setCart([])}
            onNewOrderPlaced={fetchStorefrontData} // Sync stock updates immediately
          />

          {/* Aesthetic Footer Branding */}
          <footer className="border-t border-slate-900 bg-[#060a12]/95 py-8 px-4 text-center text-[10px] md:text-xs text-slate-400 font-sans space-y-3.5 tracking-wide">
            <p className="font-extrabold text-slate-300">
              © 2026 {language === 'AR' ? 'مستودع ومتجر الذيباني VIP. حقوق البرمجة والعمليات التامة محفوظة' : 'Al-Dheebani VIP Warehouse. All rights reserved.'}
            </p>
            <p className="text-slate-500 font-medium">
              {language === 'AR' 
                ? 'الرقم المعتمد: 967770493341 . الذكاء الاصطناعي مدعوم بنماذج Gemini لتمكين العمليات الذكية الفورية' 
                : 'Verified Line: 967770493341 . AI Powered with Google Gemini Models for instant smart processing.'}
            </p>
            
            {/* Horizontal action badges / administration indicators exactly like the image footer */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => {
                  // Direct shortcut to trigger the administration login in Gateway
                  setView('GATEWAY');
                  setIsAdminView(true);
                }}
                className="px-3.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-[10px] tracking-wide flex items-center gap-1.5 cursor-pointer"
              >
                <span>🗃️</span>
                <span>{language === 'AR' ? 'لوحة الإدارة الفنية والتحكم' : 'Technical Administration Panel'}</span>
              </button>
              
              <div
                className="px-3.5 py-1.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[10px] tracking-wide flex items-center gap-1.5 select-none"
              >
                <span>💻</span>
                <span>{language === 'AR' ? 'منصة السيطرة السحابية V3 SaaS' : 'V3 SaaS Cloud Control Center'}</span>
              </div>
            </div>
          </footer>

          {/* Elegant floating toast alert showing additions to cart without blocking UI */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="fixed bottom-26 right-6 md:right-8 z-50 bg-slate-950 border border-emerald-500 text-emerald-400 font-extrabold text-xs md:text-sm shadow-[0_12px_40px_rgba(0,0,0,0.8)] py-4 px-6 rounded-2xl flex items-center gap-3 max-w-sm select-none"
                style={{ direction: language === 'AR' ? 'rtl' : 'ltr' }}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black animate-pulse">✓</span>
                <span className="tracking-wide">{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}
