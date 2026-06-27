/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, Layers, Bot, Radio, Cpu, RefreshCw, Sparkles, 
  HelpCircle, ArrowLeftRight, CheckCircle2, ShoppingBag, Terminal, Store, ShoppingCart,
  Search, ClipboardList, Clock, Truck, X, FileText, Gift, Phone, User, Printer,
  Mic, MicOff, Play
} from 'lucide-react';

import { Product, CartItem, Currency, Language, StaffUser, StoreConfig, ProductCategory, CustomCategory, Banner } from './types';
import Gateway from './auth/Gateway';
import Header from './layout/Header';
import Sections from './matrix/Sections';
import { ProductCard, ShoppingCartDrawer } from './components/Cards';
import Dashboard from './admin/Dashboard';
import { 
  DEFAULT_STORE_CONFIG, DEFAULT_CATEGORIES, DEFAULT_PRODUCTS, 
  DEFAULT_ORDERS, DEFAULT_DEBTS, DEFAULT_STAFF, DEFAULT_BANNERS,
  getSavedItem, saveItem 
} from './data/defaultData';
import { SupabaseServerlessDB, supabase, mapProductFromDB } from './lib/supabase';
import { t } from './lib/translations';
import { AssistantProvider } from './modules/assistant/providers/AssistantProvider';
import { FloatingChatButton } from './modules/assistant/components/FloatingChatButton';
import { AssistantPage } from './modules/assistant/pages/AssistantPage';

export default function App() {
  // Session Router States
  const [view, setView] = useState<'GATEWAY' | 'STORE'>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path === '/merchant') {
      localStorage.setItem('aldhibani_pref_admin_path', path);
      const savedUser = localStorage.getItem('aldhibani_user');
      return savedUser ? 'STORE' : 'GATEWAY';
    }
    return (localStorage.getItem('aldhibani_view') as any) || 'GATEWAY';
  });
  const [showAssistantPage, setShowAssistantPage] = useState<boolean>(false);
  const isAssistantActive = showAssistantPage;
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem('aldhibani_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('aldhibani_token') || null;
  });
  const [isAdminView, setIsAdminView] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path === '/merchant') {
      localStorage.setItem('aldhibani_pref_admin_path', path);
      return true;
    }
    return localStorage.getItem('aldhibani_is_admin') === 'true';
  });

  // Listen to browser forward/backward URL buttons to update view states
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/merchant') {
        localStorage.setItem('aldhibani_pref_admin_path', path);
        const savedUser = localStorage.getItem('aldhibani_user');
        if (savedUser) {
          setView('STORE');
          setIsAdminView(true);
        } else {
          setView('GATEWAY');
          setIsAdminView(false);
        }
      } else if (path === '/' || path === '') {
        setView((prev) => {
          const saved = localStorage.getItem('aldhibani_view') as any;
          return saved || 'GATEWAY';
        });
        setIsAdminView(false);
      }
    };

    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

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
  const [banners, setBanners] = useState<Banner[]>(() => SupabaseServerlessDB.getBanners());
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [activeBrand, setActiveBrand] = useState<string | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Storefront tracking state definitions
  const [storefrontTrackingId, setStorefrontTrackingId] = useState('');
  const [storefrontTrackedOrder, setStorefrontTrackedOrder] = useState<any | null>(null);
  const [storefrontIsSearching, setStorefrontIsSearching] = useState(false);
  const [storefrontTrackingError, setStorefrontTrackingError] = useState('');
  const [showTrackerModal, setShowTrackerModal] = useState(false);

  // AI Chat Assistant States & Logic
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'bot'; text: string; isAction?: boolean }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiListening, setIsAiListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom of chat history when it updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Voice speech logic
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === 'AR' ? 'ar-YE' : 'en-US';

      rec.onstart = () => {
        setIsAiListening(true);
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setAiChatInput(transcript);
        setIsAiListening(false);
      };

      rec.onerror = () => {
        setIsAiListening(false);
      };

      rec.onend = () => {
        setIsAiListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleAiListening = () => {
    if (!recognitionRef.current) {
      alert(t('errors.voice_not_supported', language));
      return;
    }
    if (isAiListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleTriggerAI = () => {
    setShowAIAgent(prev => {
      const target = !prev;
      if (target && chatHistory.length === 0) {
        setChatHistory([
          { 
            sender: 'bot', 
            text: t('ai.welcome_message', language)
          }
        ]);
      }
      return target;
    });
  };

  // Submit dialog chat to server
  const sendAIChatMessage = async (textToSend?: string) => {
    const text = textToSend || aiChatInput;
    if (!text.trim()) return;

    // Add user question to history
    setChatHistory(prev => [...prev, { sender: 'user', text }]);
    if (!textToSend) setAiChatInput('');
    setAiLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          language
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add response to chat bubble
        setChatHistory(prev => [...prev, { sender: 'bot', text: data.text }]);
        
        // Execute dynamic purchase actions returned by server
        if (data.action && data.action.type === 'ADD_TO_CART') {
          handleAddToCart(data.action.product, 1);
          setChatHistory(prev => [...prev, { 
            sender: 'bot', 
            text: language === 'AR'
              ? `✅ [أمر مدمج] تمت إضافة "${data.action.product.nameAR}" إلى سلتك بنجاح!`
              : `✅ [Embedded action] Added "${data.action.product.nameEN}" to your shopping basket!`,
            isAction: true 
          }]);
        }
      } else {
        setChatHistory(prev => [...prev, { 
          sender: 'bot', 
          text: language === 'AR' ? 'عذراً، حدث خطأ أثناء معالجة ردك.' : 'Failed to fetch model response.'
        }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: language === 'AR' ? 'فشل الاتصال بالذكاء الاصطناعي.' : 'AI network pathway offline.'
      }]);
    } finally {
      setAiLoading(false);
    }
  };

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
      const bannersPromise = fetch('/api/banners').catch(() => null);

      const [configRes, productsRes, categoriesRes, bannersRes] = await Promise.all([
        configPromise,
        productsPromise,
        categoriesPromise,
        bannersPromise
      ]);

      if (configRes && configRes.ok) {
        const confData = await configRes.json();
        setConfig(confData);
        saveItem('aldhibani_local_config', confData);
      }
      if (productsRes && productsRes.ok) {
        const prodData = await productsRes.json();
        const mappedProds = (prodData || []).map(mapProductFromDB);
        setProducts(mappedProds);
      }
      if (categoriesRes && categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData);
        saveItem('aldhibani_local_categories', catData);
      }
      if (bannersRes && bannersRes.ok) {
        const banData = await bannersRes.json();
        setBanners(banData);
        saveItem('aldhibani_local_banners', banData);
      }
    } catch (e) {
      console.error("Failed syncing frontend states: ", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsOnly = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const prodData = await res.json();
        const mappedProds = (prodData || []).map(mapProductFromDB);
        setProducts(mappedProds);
        SupabaseServerlessDB.setProducts(mappedProds);
        console.log('⚡ [Realtime Sync] Mutated client state after receiving event!');
      }
    } catch (e) {
      console.error('[Realtime Sync] Re-fetching products on event failed:', e);
    }
  };

  useEffect(() => {
    fetchStorefrontData();
  }, []);

  // Subscribe to real-time events from Supabase on postgres_changes and custom hard-refresh broadcasts
  useEffect(() => {
    if (!supabase) return;

    console.log('🔗 [Realtime Sync] Initializing global listeners for table "products"...');

    const channel = supabase
      .channel('realtime:products_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('⚡ [Realtime Sync] Database table change detected (postgres_changes):', payload);
          fetchProductsOnly();
        }
      )
      .on(
        'broadcast',
        { event: 'hard-refresh' },
        (payload) => {
          console.log('⚡ [Realtime Sync] Custom hard-refresh broadcast command received:', payload);
          fetchProductsOnly();
        }
      )
      .subscribe((status) => {
        console.log(`⚡ [Realtime Sync] Connection subscription status: ${status}`);
      });

    return () => {
      console.log('🔌 [Realtime Sync] Dismounting products listener...');
      supabase.removeChannel(channel);
    };
  }, []);

  // Slider autoplay effect
  useEffect(() => {
    const activeCount = banners.filter(b => b.is_active && b.organization_id === (config.orgId || 'org-dhibani-vip')).length || DEFAULT_BANNERS.length;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeCount);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners, config.orgId]);

  // Handle traditional Login
  const handleLoginSuccess = (user: StaffUser, token: string) => {
    console.log('[Auth Debug] handleLoginSuccess successfully invoked!');
    console.log('[Auth Debug] Logged-in Staff User Profile:', user);
    console.log('[Auth Debug] Admin Security Token:', token);
    setCurrentUser(user);
    setAuthToken(token);
    setView('STORE');
    setIsAdminView(true); // Open directly into Admin view for convenience

    localStorage.setItem('aldhibani_user', JSON.stringify(user));
    localStorage.setItem('aldhibani_token', token);
    localStorage.setItem('aldhibani_view', 'STORE');
    localStorage.setItem('aldhibani_is_admin', 'true');

    // Dynamic browser routing update
    const path = window.location.pathname.toLowerCase();
    if (path !== '/admin' && path !== '/merchant') {
      const prefPath = localStorage.getItem('aldhibani_pref_admin_path') || '/admin';
      window.history.pushState({}, '', prefPath);
    } else {
      localStorage.setItem('aldhibani_pref_admin_path', path);
    }
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

    localStorage.removeItem('aldhibani_user');
    localStorage.removeItem('aldhibani_token');
    localStorage.setItem('aldhibani_view', 'STORE');
    localStorage.setItem('aldhibani_is_admin', 'false');

    // Reset path back to shopper home
    window.history.pushState({}, '', '/');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setView('GATEWAY');
    setIsAdminView(false);

    localStorage.removeItem('aldhibani_user');
    localStorage.removeItem('aldhibani_token');
    localStorage.setItem('aldhibani_view', 'GATEWAY');
    localStorage.setItem('aldhibani_is_admin', 'false');

    // Reset path back to shopper home
    window.history.pushState({}, '', '/');
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
    <AssistantProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* Dynamic Main Routing Switches */}
      {view === 'GATEWAY' ? (
        <Gateway
          onBypass={handleBypass}
          onLoginSuccess={handleLoginSuccess}
          storeNameAR={config.shopNameAR}
          storeNameEN={config.shopNameEN}
          logoEmoji={config.logoEmoji}
          logoImageUrl={config.logoImageUrl}
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
            onToggleAdminView={() => {
              const nextVal = !isAdminView;
              setIsAdminView(nextVal);
              if (showAssistantPage) {
                setShowAssistantPage(false);
              }
              if (nextVal) {
                const prefPath = localStorage.getItem('aldhibani_pref_admin_path') || '/admin';
                window.history.pushState({}, '', prefPath);
              } else {
                const path = window.location.pathname.toLowerCase();
                if (path === '/admin' || path === '/merchant') {
                  localStorage.setItem('aldhibani_pref_admin_path', path);
                }
                window.history.pushState({}, '', '/');
              }
            }}
            isAdminView={isAdminView}
            onAddToCart={(p) => handleAddToCart(p, 1, p.category.startsWith('DIGITAL_') ? { notes: 'AI added line' } : undefined)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            showAssistantPage={showAssistantPage}
            onToggleAssistantPage={() => {
              setShowAssistantPage(!showAssistantPage);
              if (isAdminView) {
                setIsAdminView(false);
              }
            }}
          />

          <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {loading ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">SYNCING STABLE COMMERCE BUFFERS...</span>
              </div>
            ) : showAssistantPage ? (
              <AssistantPage 
                orgId={config.orgId} 
                userRole={currentUser?.role || 'GUEST'} 
              />
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
                }}
                banners={banners}
                onBannersChanged={(updated) => setBanners(updated)}
                onClose={() => setIsAdminView(false)}
              />
            ) : (
              /* Shopper Catalog Grid View */
              <div className="space-y-12 animate-fadeIn">
                
                {/* 🎠 PREMIUM HERO SLIDER SECTION */}
                {(() => {
                  const storeOrgId = config.orgId || 'org-dhibani-vip';
                  const activeBanners = banners.filter(b => b.is_active && b.organization_id === storeOrgId);
                  const slides = activeBanners.length > 0 ? activeBanners : DEFAULT_BANNERS;
                  return (
                    <div className="relative h-[200px] sm:h-[350px] md:h-[420px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 group">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeSlide}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 w-full h-full"
                        >
                          <img
                            src={slides[activeSlide]?.image_url}
                            alt="Ad Slide"
                            className="w-full h-full object-cover select-none pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                          
                          {/* Rich slider title overlaid with pure luxury */}
                          <div className="absolute bottom-0 inset-x-0 p-6 md:p-12 text-right flex flex-col items-start md:items-end justify-end h-full select-none" dir="rtl">
                            <div className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-lg tracking-wider mb-2 animate-pulse">
                              {language === 'AR' ? 'عروض الذيباني الحصرية 🔱' : 'Exclusive VIP Banners 🔱'}
                            </div>
                            <h2 className="text-lg md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-lg text-right max-w-2xl">
                              {language === 'AR' ? slides[activeSlide]?.title_ar : slides[activeSlide]?.title_en}
                            </h2>
                            {slides[activeSlide]?.target_url && (
                              <button
                                onClick={() => {
                                  const url = slides[activeSlide]?.target_url;
                                  if (url && url.includes('category=')) {
                                    const cat = url.split('category=')[1];
                                    setActiveCategory(cat);
                                    document.getElementById('products-showroom-grid')?.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }}
                                className="mt-3.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-950/30 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                              >
                                <span>⚡</span>
                                <span>{language === 'AR' ? 'تسوق العرض الآن' : 'Shop Deal Now'}</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {/* Side navigation arrows */}
                      <button
                        onClick={() => setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-all z-10 cursor-pointer hidden group-hover:flex"
                      >
                        <ArrowLeftRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button
                        onClick={() => setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/85 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-cyan-500/50 transition-all z-10 cursor-pointer hidden group-hover:flex"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>

                      {/* Selector indicator circles */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {slides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                              activeSlide === idx ? 'bg-cyan-400 w-5' : 'bg-slate-600 hover:bg-slate-400'
                            }`}
                            aria-label={`Show slide ${idx + 1}`}
                          ></button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 🔍 SEAMLESS CENTERED SEARCH BAR */}
                <div className="max-w-2xl mx-auto w-full pt-1" dir="rtl">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'AR' ? 'ابحث عن باقات يمن موبايل، شدات ببجي، عسل دوعني، أو الكترونيات...' : 'Search for Yemen Mobile recharges, PUBG UC, gourmet foods...'}
                      className="w-full bg-slate-900/50 border border-slate-800/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-2xl pr-12 pl-4 py-3.5 text-sm text-right text-slate-100 placeholder-slate-500 transition-all shadow-xl"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyan-400 pointer-events-none" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section selection matrix */}
                <Sections
                  language={language}
                  onCategorySelect={setActiveCategory}
                  activeCategory={activeCategory}
                  onBrandSelect={setActiveBrand}
                  activeBrand={activeBrand}
                  categories={categories}
                />

                {/* ⭐ FEATURED PRODUCTS */}
                <div className="space-y-4" dir="rtl">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                    <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                    <h3 className="text-xs md:text-sm font-black text-white font-sans uppercase tracking-wide">
                      {language === 'AR' ? 'الأصناف الأكثر طلباً والمنتجات المميزة 🌟' : 'BEST-SELLING & FEATURED SELECTIONS 🌟'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        language={language}
                        currency={currency}
                        exchangeUSD={config.exchangeRateUSD}
                        exchangeSAR={config.exchangeRateSAR}
                        onAddToCart={(p) => handleAddToCart(p, 1, p.category.startsWith('DIGITAL_') ? { notes: 'Featured Quick Checkout' } : undefined)}
                      />
                    ))}
                  </div>
                </div>

                {/* 🏷️ SPECIAL EXCLUSIVE OFFERS */}
                <div className="space-y-4" dir="rtl">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                    <Gift className="w-4.5 h-4.5 text-cyan-400" />
                    <h3 className="text-xs md:text-sm font-black text-white font-sans uppercase tracking-wide">
                      {language === 'AR' ? 'أقوى باقات الاتصالات وكروت الألعاب الحصرية 🎁' : 'EXCLUSIVE DIGITAL BUNDLES & OFFERS 🎁'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.filter(p => p.category.startsWith('DIGITAL_')).slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        language={language}
                        currency={currency}
                        exchangeUSD={config.exchangeRateUSD}
                        exchangeSAR={config.exchangeRateSAR}
                        onAddToCart={(p) => handleAddToCart(p, 1, p.category.startsWith('DIGITAL_') ? { notes: 'Bundle promo' } : undefined)}
                      />
                    ))}
                  </div>
                </div>

                {/* 🆕 LATEST STORE ARRIVALS */}
                <div className="space-y-4" dir="rtl">
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                    <Clock className="w-4.5 h-4.5 text-emerald-400" />
                    <h3 className="text-xs md:text-sm font-black text-white font-sans uppercase tracking-wide">
                      {language === 'AR' ? 'آخر المنتجات والأجهزة المضاف حديثاً للكتالوج 🆕' : 'NEW DROPS & RECENT ARRIVALS 🆕'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(() => {
                      const latest = [...products].reverse().slice(0, 4);
                      return latest.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          language={language}
                          currency={currency}
                          exchangeUSD={config.exchangeRateUSD}
                          exchangeSAR={config.exchangeRateSAR}
                          onAddToCart={(p) => handleAddToCart(p, 1, p.category.startsWith('DIGITAL_') ? { notes: 'New Drop Instant Buy' } : undefined)}
                        />
                      ));
                    })()}
                  </div>
                </div>

                {/* 📋 NEON ORDER TRACKING LAUNCHER WIDGET */}
                <div className="bg-[#0b1220]/75 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
                    <div className="text-right flex flex-col gap-1">
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2.5 bg-gradient-to-l from-cyan-400/10 via-cyan-400/5 to-transparent p-1.5 px-3 rounded-xl border-r-2 border-cyan-400 w-fit">
                        <Truck className="w-5 h-5 text-cyan-400" />
                        <span>{language === 'AR' ? 'بوابة تتبع طلبات الشحن الفورية مجهرياً' : 'VIP Microscopic Order Tracking Portal'}</span>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                        {language === 'AR' 
                          ? 'هل قمت بطلب باقة شحن رصيد أو منتج؟ تتبع تقدم معالجة وتسليم طلبك لحظياً بدقة السيرفر، مع استعراض كامل الفواتير والطباعة.' 
                          : 'Track your live order fulfillment status and view/print your official invoice receipts instantly.'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowTrackerModal(true);
                        setStorefrontTrackedOrder(null);
                        setStorefrontTrackingId('');
                        setStorefrontTrackingError('');
                      }}
                      className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg hover:shadow-cyan-500/20 active:scale-98 shrink-0"
                    >
                      <Search className="w-4 h-4" />
                      <span>{language === 'AR' ? 'افتح شاشة التتبع الفوري 🔍' : 'Open live tracker 🔍'}</span>
                    </button>
                  </div>
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

          {/* 5️⃣ AI FLOATING ASSISTANT DISPATCHER BUTTON & DRAWER (قسم AI الشامل والتحدث الصوتي) */}
          {!isAssistantActive && (
            <div className="fixed bottom-6 left-6 z-50">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTriggerAI}
              className="w-15 h-15 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-2xl border border-cyan-400/20 shadow-cyan-500/20 cursor-pointer relative"
              id="btn-trigger-ai-bot"
            >
              <Bot className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400"></span>
              </span>
            </motion.button>

            {/* Expandable Assistant Drawer Panel */}
            <AnimatePresence>
              {showAIAgent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 50, x: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute bottom-18 left-0 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
                >
                  {/* AI Header */}
                  <div className="bg-gradient-to-r from-cyan-900 to-slate-900 p-4 border-b border-cyan-800 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-2.5 rounded-xl bg-cyan-500 text-slate-950">
                        <Sparkles className="w-4 h-4 text-slate-950 inline fill-slate-950 animate-bounce" />
                        <span className="text-xs font-black font-mono ml-1">AI</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black tracking-wide leading-none">{language === 'AR' ? 'محرك الذكاء الاصطناعي' : 'Super-Agent Chat'}</h3>
                        <span className="text-[10px] text-cyan-300 font-mono">gemini-1.5-flash</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAIAgent(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Chat Contents */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-none bg-slate-950">
                    {chatHistory.map((msg, i) => (
                      <div 
                         key={i} 
                         className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'self-end bg-cyan-600 text-white rounded-tr-none'
                            : msg.isAction 
                              ? 'self-start bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-tl-none font-bold'
                              : 'self-start bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800'
                        }`}
                      >
                        <span>{msg.text}</span>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="self-start bg-slate-850 text-slate-500 rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2 border border-slate-800">
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                        <span>{t('ai.thinking', language)}</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestions Panel */}
                  <div className="px-3 py-2 bg-slate-950 border-t border-slate-850 flex gap-1.5 overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => sendAIChatMessage(language === 'AR' ? 'أضف عسل سدر يمني ملكي فاخر' : 'Add royal yemeni honey')}
                      className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 rounded-full flex-shrink-0 transition-all cursor-pointer"
                    >
                      🐝 {t('ai.add_honey_chip', language)}
                    </button>
                    <button
                      onClick={() => sendAIChatMessage(language === 'AR' ? 'ما هي باقات يمن موبايل المتوفرة؟' : 'What recharges are available?')}
                      className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 rounded-full flex-shrink-0 transition-all cursor-pointer"
                    >
                      📱 {t('ai.telecom_chip', language)}
                    </button>
                    <button
                      onClick={() => sendAIChatMessage(language === 'AR' ? 'كيف أشحن شدات ببجي؟' : 'How do I top up PUBG?')}
                      className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 rounded-full flex-shrink-0 transition-all cursor-pointer"
                    >
                      🎮 {t('ai.game_chip', language)}
                    </button>
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 bg-slate-900 border-t border-slate-850 flex gap-1.5">
                    <input
                      type="text"
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          sendAIChatMessage();
                        }
                      }}
                      placeholder={t('ai.input_placeholder', language)}
                      className="flex-1 bg-slate-950 text-xs text-slate-100 placeholder-slate-600 rounded-xl px-3 border border-slate-800 focus:outline-none focus:border-cyan-500"
                      id="ai-control-input"
                    />
                    
                    {/* Micro Input */}
                    <button
                      onClick={toggleAiListening}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isAiListening 
                          ? 'bg-red-955 border-red-500 text-red-400 animate-pulse' 
                          : 'bg-slate-955 border-slate-800 text-slate-450 hover:border-cyan-500 hover:text-cyan-400'
                      }`}
                      id="btn-voice-chat-control"
                    >
                      {isAiListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => sendAIChatMessage()}
                      disabled={!aiChatInput.trim()}
                      className="p-2 px-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center animate-pulse"
                      id="btn-send-chat"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}

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

          {/* 🔍 PREMIUM OVERLAY ORDER TRACKING receipts MODAL */}
          <AnimatePresence>
            {showTrackerModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-[#0b1220] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_24px_50px_rgba(0,0,0,0.85)] font-sans"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-850 flex items-center justify-between" dir="rtl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-sans font-black text-white text-base tracking-wide">
                          {language === 'AR' ? 'بوابة كشف وتتبع الفواتير المتكاملة 🔱' : 'VIP Live Invoice Tracker Portal 🔱'}
                        </h3>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {language === 'AR' ? 'تتبع تقدم السيرفر الفوري وطباعة الفاتورة' : 'Micro-track server processing & claim digital receipts'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTrackerModal(false)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right" dir="rtl">
                    {/* Search Field */}
                    <form onSubmit={handleStorefrontTrackOrder} className="space-y-2">
                      <label className="block text-xs font-black text-slate-300 font-mono">
                        {language === 'AR' ? 'أدخل الرقم المرجعي للطلب فائق الدقة (ID):' : 'ENTER MICROSCOPIC CLIENT REFERENCE ID:'}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={storefrontTrackingId}
                            onChange={(e) => setStorefrontTrackingId(e.target.value)}
                            placeholder={language === 'AR' ? 'مثال: ALDH-2026-XXXX...' : 'e.g. ALDH-2026-...' }
                            className="w-full bg-slate-950 border border-slate-800/80 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide text-slate-100 placeholder-slate-600 focus:outline-none transition-all pr-10 text-right"
                          />
                          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                        </div>
                        <button
                          type="submit"
                          disabled={storefrontIsSearching}
                          className="px-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:shadow-lg disabled:opacity-50"
                        >
                          {storefrontIsSearching ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>{language === 'AR' ? 'كشف البيانات 🔍' : 'Scan DB 🔍'}</span>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Loader */}
                    {storefrontIsSearching && (
                      <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <div className="relative w-12 h-12">
                          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/10"></div>
                          <div className="absolute inset-0 rounded-full border-2 border-t-cyan-500 animate-spin"></div>
                        </div>
                        <span className="text-xs font-mono font-bold animate-pulse text-cyan-400">
                          {language === 'AR' ? 'جاري الاتصال بقاعدة البيانات وفك تشفير الفاتورة...' : 'Querying secure ledger & decoding transaction...'}
                        </span>
                      </div>
                    )}

                    {/* Error message */}
                    {storefrontTrackingError && (
                      <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-400 text-xs flex gap-3 items-start">
                        <span className="text-base">⚠️</span>
                        <div>
                          <p className="font-extrabold">{language === 'AR' ? 'فشل التحقق من الهوية' : 'Unrecognized Reference ID'}</p>
                          <p className="text-[10px] leading-normal opacity-90 mt-1">{storefrontTrackingError}</p>
                        </div>
                      </div>
                    )}

                    {/* Receipt Details Rendering */}
                    {storefrontTrackedOrder && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Status timeline */}
                        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 space-y-4">
                          <span className="text-[10px] bg-slate-900 border border-slate-850 text-slate-400 px-2 py-0.5 rounded-lg font-mono font-bold uppercase select-none inline-block">
                            {language === 'AR' ? 'الحالة اللحظية المعالجة' : 'Server Execution Status Timeline'}
                          </span>
                          
                          <div className="grid grid-cols-3 gap-2 relative">
                            {/* Lines connecting the points */}
                            <div className="absolute top-4 left-[15%] right-[15%] h-[2px] bg-slate-800 -z-0"></div>

                            {/* Standard statuses progress: PENDING -> PROCESSING -> COMPLETED */}
                            <div className="flex flex-col items-center gap-2 relative z-10 text-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                ['PENDING', 'PROCESSING', 'COMPLETED'].includes(storefrontTrackedOrder.status) 
                                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/50' 
                                  : 'bg-slate-800 text-slate-500'
                              }`}>
                                {['PROCESSING', 'COMPLETED'].includes(storefrontTrackedOrder.status) ? '✓' : '1'}
                              </div>
                              <span className={`text-[10px] font-black ${
                                ['PENDING', 'PROCESSING', 'COMPLETED'].includes(storefrontTrackedOrder.status) ? 'text-amber-400' : 'text-slate-500'
                              }`}>
                                {language === 'AR' ? 'تحت المراجعة والتدقيق' : 'Pending'}
                              </span>
                            </div>

                            <div className="flex flex-col items-center gap-2 relative z-10 text-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                ['PROCESSING', 'COMPLETED'].includes(storefrontTrackedOrder.status) 
                                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/50' 
                                  : 'bg-slate-800 text-slate-500'
                              }`}>
                                {storefrontTrackedOrder.status === 'COMPLETED' ? '✓' : '2'}
                              </div>
                              <span className={`text-[10px] font-black ${
                                ['PROCESSING', 'COMPLETED'].includes(storefrontTrackedOrder.status) ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
                              }`}>
                                {language === 'AR' ? 'جاري الشحن/التسليم' : 'Processing'}
                              </span>
                            </div>

                            <div className="flex flex-col items-center gap-2 relative z-10 text-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                storefrontTrackedOrder.status === 'COMPLETED' 
                                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/50' 
                                  : 'bg-slate-800 text-slate-500'
                              }`}>
                                3
                              </div>
                              <span className={`text-[10px] font-black ${
                                storefrontTrackedOrder.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-500'
                              }`}>
                                {language === 'AR' ? 'تم الاكتمال بنجاح' : 'Delivered'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Invoice detailed receipt */}
                        <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl relative overflow-hidden font-mono text-[11px] space-y-4">
                          <div className="absolute top-0 inset-x-0 h-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-400/10 to-transparent"></div>

                          <div className="flex justify-between items-start border-b border-slate-850 pb-3" dir="rtl">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 uppercase block font-black">INVOICE ID / المعرف:</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-sm font-bold text-cyan-400">{storefrontTrackedOrder.id}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(storefrontTrackedOrder.id);
                                    alert(language === 'AR' ? 'تم نسخ المعرف بنجاح!' : 'Copied Reference ID!');
                                  }}
                                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                                  title="Copy"
                                >
                                  <ClipboardList className="w-3.5 h-3.5 text-slate-450" />
                                </button>
                              </div>
                            </div>
                            <div className="text-left font-sans">
                              <div className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border flex items-center gap-1.5 ${
                                storefrontTrackedOrder.status === 'COMPLETED' 
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                  : storefrontTrackedOrder.status === 'PENDING' 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                                {getStorefrontStatusLabel(storefrontTrackedOrder.status)}
                              </div>
                            </div>
                          </div>

                          {/* Customer meta info */}
                          <div className="grid grid-cols-2 gap-4 border-b border-slate-850 pb-3 font-sans text-right">
                            <div>
                              <span className="text-[9px] text-slate-500 block">العميل الفاضل / Client:</span>
                              <span className="font-bold text-slate-200">{storefrontTrackedOrder.customerName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">رقم الهاتف المعمد / Line:</span>
                              <span className="text-slate-200 font-mono font-bold">{storefrontTrackedOrder.customerPhone}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">طريقة السداد / Payment:</span>
                              <span className="text-slate-200 font-bold">{storefrontTrackedOrder.paymentMethod}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 block">تاريخ العملية / Created At:</span>
                              <span className="text-slate-200 font-mono">{new Date(storefrontTrackedOrder.createdAt).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Items table */}
                          <div className="space-y-2 font-sans text-right">
                            <span className="text-[9px] text-slate-500 block font-mono">ORDERED SHIPPED ITEMS / السلع والخدمات المعمدة:</span>
                            <div className="space-y-1.5 pt-1">
                              {storefrontTrackedOrder.items ? (
                                storefrontTrackedOrder.items.map((item: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center text-xs text-slate-300 border-b border-slate-900 pb-1.5">
                                    <div className="flex gap-2 items-center">
                                      <span className="text-[10px] text-slate-500 font-mono">x{item.quantity}</span>
                                      <span className="font-extrabold">{item.name}</span>
                                    </div>
                                    <span className="font-mono font-bold text-slate-400">{(item.price * item.quantity).toLocaleString()} YER</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-slate-400">{language === 'AR' ? 'الصنف المعروض تفعيله فورا' : 'Digital Fast Top-Up Bundle'}</div>
                              )}
                            </div>
                          </div>

                          {/* Remarks */}
                          {storefrontTrackedOrder.notes && (
                            <div className="p-3 bg-slate-900/50 border border-slate-850 rounded-xl text-[10px] font-sans text-amber-300 space-y-1 text-right">
                              <span className="font-black text-slate-500 block text-[9px] uppercase">BOARD CONTROL REMARKS / ملاحظات الدعم الفني:</span>
                              <p className="leading-relaxed font-bold">{storefrontTrackedOrder.notes}</p>
                            </div>
                          )}

                          {/* Detailed Billing Summary */}
                          <div className="pt-2 border-t border-slate-850 font-sans space-y-2 text-right">
                            <div className="flex justify-between items-center text-xs text-slate-400">
                              <span>المبلغ الأساسي للسلع / Subtotal Amount:</span>
                              <span className="font-mono">{storefrontTrackedOrder.totalYER.toLocaleString()} YER</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-400">
                              <span>رسوم المعالجة السحابية / Cloud Fees:</span>
                              <span className="font-mono">0 YER</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-black text-white pt-1.5 border-t border-dashed border-slate-850">
                              <span className="text-cyan-400">{language === 'AR' ? 'الإجمالي سداداً فواً YER:' : 'Settle Total YER:'}</span>
                              <span className="font-mono text-emerald-400 text-lg">{storefrontTrackedOrder.totalYER.toLocaleString()} YER</span>
                            </div>
                            
                            <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-900 pt-1 font-mono">
                              <span>Ref USD / ما يعادل بالدولار:</span>
                              <span>${(storefrontTrackedOrder.totalYER / (config.exchangeRateUSD || 500)).toFixed(2)} USD</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                              <span>Ref SAR / ما يعادل بالريال السعودي:</span>
                              <span>{(storefrontTrackedOrder.totalYER / (config.exchangeRateSAR || 140)).toFixed(1)} SAR</span>
                            </div>
                          </div>
                        </div>

                        {/* Receipt Control Buttons */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (!printWindow) return;
                              const isAR = language === 'AR';
                              const itemsHTML = (storefrontTrackedOrder.items || []).map((item: any) => `
                                <tr>
                                  <td style="text-align: right; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding: 10px 0;">${item.name}</td>
                                  <td style="text-align: center; border-bottom: 1px solid #e2e8f0; padding: 10px 0;">${item.quantity}</td>
                                  <td style="text-align: left; font-family: monospace; border-bottom: 1px solid #e2e8f0; padding: 10px 0;">${item.price.toLocaleString()} YER</td>
                                </tr>
                              `).join('');

                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>VIP Invoice - ${storefrontTrackedOrder.id}</title>
                                    <style>
                                      body {
                                        background-color: #ffffff;
                                        color: #0d1117;
                                        font-family: system-ui, -apple-system, sans-serif;
                                        margin: 24px;
                                        direction: ${isAR ? 'rtl' : 'ltr'};
                                        text-align: ${isAR ? 'right' : 'left'};
                                      }
                                      .receipt-container {
                                        max-width: 550px;
                                        margin: 0 auto;
                                        border: 2px solid #000000;
                                        padding: 24px;
                                        border-radius: 12px;
                                      }
                                      .header {
                                        text-align: center;
                                        border-bottom: 3px dashed #000000;
                                        padding-bottom: 16px;
                                        margin-bottom: 16px;
                                      }
                                      .title {
                                        font-size: 22px;
                                        font-weight: 900;
                                        margin: 0;
                                      }
                                      .subtitle {
                                        font-size: 11px;
                                        color: #4a5568;
                                        margin-top: 6px;
                                      }
                                      .metadata {
                                        margin-bottom: 24px;
                                        font-size: 13px;
                                        line-height: 1.7;
                                      }
                                      .table-items {
                                        width: 100%;
                                        border-collapse: collapse;
                                        font-size: 13px;
                                      }
                                      .total-section {
                                        margin-top: 24px;
                                        border-top: 3px dashed #000;
                                        padding-top: 16px;
                                        font-size: 15px;
                                        font-weight: bold;
                                      }
                                      .footer {
                                        margin-top: 32px;
                                        text-align: center;
                                        font-size: 11px;
                                        color: #718096;
                                        border-top: 1px dashed #cbd5e0;
                                        padding-top: 12px;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="receipt-container">
                                      <div class="header">
                                        <h1 class="title">${isAR ? 'فاتورة سداد ومبيعات معمدة 🔱' : 'CERTIFIED SALES RECEIPT 🔱'}</h1>
                                        <p class="subtitle">${isAR ? 'مستودع ومخازن الذيباني VIP للأجهزة وشحن رصيد يمن موبايل الفوري' : 'Al-Dhibani VIP Live Recharge & Logistics Hub'}</p>
                                      </div>
                                      <div class="metadata">
                                        <div><strong>${isAR ? 'رقم الإذن الفني:' : 'Transaction Reference:'}</strong> <span style="font-family: monospace; font-weight: bold;">${storefrontTrackedOrder.id}</span></div>
                                        <div><strong>${isAR ? 'العميل الفاضل:' : 'Noble Customer:'}</strong> ${storefrontTrackedOrder.customerName}</div>
                                        <div><strong>${isAR ? 'رقم الهاتف المعتمد للمشترك:' : 'Assigned Phone line:'}</strong> ${storefrontTrackedOrder.customerPhone}</div>
                                        <div><strong>${isAR ? 'الحالة المعممة للعملية:' : 'Current Pipeline Status:'}</strong> ${getStorefrontStatusLabel(storefrontTrackedOrder.status)}</div>
                                        <div><strong>${isAR ? 'آلية تسليم / دفع الفاتورة:' : 'Payment Mechanism:'}</strong> ${storefrontTrackedOrder.paymentMethod}</div>
                                        <div><strong>${isAR ? 'توقيت الطلب بموجب السيرفر:' : 'Timestamp (GMT+3):'}</strong> ${new Date(storefrontTrackedOrder.createdAt).toLocaleString()}</div>
                                      </div>
                                      <table class="table-items">
                                        <thead>
                                          <tr style="border-bottom: 2px solid #000;">
                                            <th style="text-align: right; padding-bottom: 8px;">${isAR ? 'الخدمة / الصنف المتجر' : 'Product / Digital Bundle'}</th>
                                            <th style="text-align: center; padding-bottom: 8px;">${isAR ? 'الكمية' : 'Qty'}</th>
                                            <th style="text-align: left; padding-bottom: 8px;">${isAR ? 'السعر' : 'Unit Price'}</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          ${itemsHTML}
                                        </tbody>
                                      </table>
                                      <div class="total-section">
                                        <div style="display: flex; justify-content: space-between;">
                                          <span>${isAR ? 'الإجمالي العام سداداً YER:' : 'Grand Settle Amount YER:'}</span>
                                          <span style="font-family: monospace; font-size: 16px; color: #10b981;">${storefrontTrackedOrder.totalYER.toLocaleString()} YER</span>
                                        </div>
                                      </div>
                                      ${storefrontTrackedOrder.notes ? `
                                        <div style="margin-top: 16px; padding: 12px; background-color: #f7fafc; border: 1px solid #edf2f7; border-radius: 8px; font-size: 11px;">
                                          <strong>${isAR ? 'ملاحظات كادر مراجعة مستودع الذيباني:' : 'Logistics Admin Remarks:'}</strong>
                                          <p style="margin: 6px 0 0 0; font-weight: bold;">${storefrontTrackedOrder.notes}</p>
                                        </div>
                                      ` : ''}
                                      <div class="footer">
                                        <p>${isAR ? 'العملية معممة وآمنة وسريعة التجهيز التلقائي.' : 'Protected by secure automatic server queue pipelines.'}</p>
                                        <p>© 2026 Al-Dhibani VIP Logistics. Verified Line: 967770493341</p>
                                      </div>
                                    </div>
                                    <script>
                                      window.addEventListener('load', () => {
                                        setTimeout(() => {
                                          window.print();
                                          window.close();
                                        }, 350);
                                      });
                                    </script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }}
                            className="flex-1 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                          >
                            <Printer className="w-4 h-4" />
                            <span>{language === 'AR' ? 'طباعة الفاتورة والوصل 🖨️' : 'Print VIP Receipt 🖨️'}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-950 border-t border-slate-850 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowTrackerModal(false)}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white font-black text-xs border border-slate-800 transition-all cursor-pointer"
                    >
                      {language === 'AR' ? 'إغلاق النافذة' : 'Close'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Floating Smart Assistant Action Widget */}
          {!isAssistantActive && (
            <FloatingChatButton 
              orgId={config.orgId} 
              userRole={currentUser?.role || 'GUEST'} 
            />
          )}

        </div>
      )}

    </div>
    </AssistantProvider>
  );
}
