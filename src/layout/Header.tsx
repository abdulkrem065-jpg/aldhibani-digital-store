/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Shield, Bot, Languages, ArrowLeftRight, Mic, MicOff, Sparkles, 
  HelpCircle, ClipboardList, CheckCircle2, Clock, Truck, Play, RefreshCw, X, LogOut, ShoppingCart 
} from 'lucide-react';
import { Language, Currency, StaffUser, StoreConfig, Order, Product } from '../types';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  config: StoreConfig;
  user: StaffUser | null;
  onLogout: () => void;
  onToggleAdminView: () => void;
  isAdminView: boolean;
  onAddToCart: (p: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export default function Header({
  language,
  setLanguage,
  currency,
  setCurrency,
  searchQuery,
  setSearchQuery,
  config,
  user,
  onLogout,
  onToggleAdminView,
  isAdminView,
  onAddToCart,
  cartCount,
  onOpenCart
}: HeaderProps) {
  // Voice & Speech Recognition States (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Order tracking states
  const [trackingId, setTrackingId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingError, setTrackingError] = useState('');
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [isSearchingOrder, setIsSearchingOrder] = useState(false);

  // AI Assistant states
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [aiChatInput, setAiChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'bot'; text: string; isAction?: boolean }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === 'AR' ? 'ar-YE' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (showAIAgent) {
          setAiChatInput(transcript);
        } else {
          setSearchQuery(transcript);
        }
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language, showAIAgent, setSearchQuery]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(language === 'AR' 
        ? 'التعرف على الصوت غير مدعوم في متصفحك الحالي.' 
        : 'Voice recognition is not supported in this browser.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Submit query tracking to server
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setIsSearchingOrder(true);
    setTrackingError('');
    setTrackedOrder(null);

    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const orders: Order[] = await response.json();
        const found = orders.find(o => o.id.toUpperCase() === trackingId.trim().toUpperCase());
        if (found) {
          setTrackedOrder(found);
        } else {
          setTrackingError(language === 'AR' 
            ? 'لم نجد طلباً بهذا الكود. يرجى التأكد وإعادة المحاولة.' 
            : 'Order code not found. Please review and try again.'
          );
        }
      } else {
        setTrackingError(language === 'AR' ? 'حدث خطأ بالاتصال بالشبكة يرجى المحاولة لاحقاً.' : 'Network error.');
      }
    } catch (err) {
      setTrackingError(language === 'AR' ? 'فشل في الاتصال بمحرك التتبع.' : 'Tracking server is unresponsive.');
    } finally {
      setIsSearchingOrder(false);
    }
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
          onAddToCart(data.action.product);
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

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'PROCESSING': return <Truck className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <X className="w-5 h-5 text-red-500" />;
    }
  };

  const getOrderStatusLabel = (status: string) => {
    if (language === 'AR') {
      switch (status) {
        case 'PENDING': return 'قيد الانتظار';
        case 'PROCESSING': return 'جاري التجهيز والشحن';
        case 'COMPLETED': return 'تم التسليم بنجاح';
        default: return 'ملغي';
      }
    } else {
      switch (status) {
        case 'PENDING': return 'Pending Review';
        case 'PROCESSING': return 'Processing & Dispatching';
        case 'COMPLETED': return 'Delivered successfully';
        default: return 'Cancelled';
      }
    }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 z-40 sticky top-0 font-sans">
      
      {/* 1️⃣ MOVING ANNOUNCEMENTS BANNER (شريط الإعلانات المتحرك) */}
      <div className="w-full bg-cyan-950 border-b border-cyan-800/50 py-1.5 px-4 overflow-hidden relative">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-xs font-semibold text-cyan-300 md:text-sm tracking-wide gap-8 flex">
            <span>{language === 'AR' ? config.tickerTextAR : config.tickerTextEN}</span>
            <span className="text-slate-505 select-none">•</span>
            <span>{language === 'AR' ? config.tickerTextAR : config.tickerTextEN}</span>
            <span className="text-slate-505 select-none">•</span>
            <span>{language === 'AR' ? config.tickerTextAR : config.tickerTextEN}</span>
          </span>
        </div>
      </div>

      {/* 2️⃣ MAIN HIGH END BRANDING AND OPERATIONS BAR IN AL-DHEEBANI VIP BRAND */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col lg:flex-row-reverse items-center justify-between gap-6" dir="rtl">
        
        {/* PREMIUM YELLOW LOGO CARD ON THE RIGHT (AS REQUESTED) */}
        <div className="bg-[#facc15] text-slate-950 p-5 rounded-2xl flex flex-col justify-center text-center items-center shadow-2xl border border-yellow-300 w-full lg:w-[260px] shrink-0 select-none transition-all hover:scale-102">
          <div className="text-[17px] font-black tracking-tight leading-none text-slate-950 font-sans">
            {language === 'AR' ? 'مستودع ومتجر' : 'Warehouse & Store'}
          </div>
          <div className="text-[20px] font-extrabold tracking-widest text-[#9a1b1b] font-sans mt-0.5 leading-none uppercase drop-shadow-sm">
            {language === 'AR' ? 'الذيباني VIP' : 'AL-DHEEBANI VIP'}
          </div>
          <div className="text-[10px] text-slate-900 border-t border-slate-950/15 pt-2 mt-2 leading-relaxed font-bold font-sans">
            {language === 'AR' 
              ? 'خدمة شحن ألعاب فوري، توابل فاخرة، مواد تموينية وإلكترونيات بجودة معتمدة'
              : 'Instant game recharges, premium spices, luxury groceries and certified hardware assets'}
          </div>
        </div>

        {/* LEFT COLUMN SYSTEM CONTROLS AND NAVIGATION PILLS */}
        <div className="flex-1 w-full flex flex-col gap-4 items-start lg:items-end text-right">
          
          {/* TOP ROW: CURRENCY SELECTORS & LANGUAGE DEALS (EXACTLY AS PICTURED) */}
          <div className="flex flex-wrap gap-4 items-center justify-end w-full lg:w-auto">
            
            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-full border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold px-2">{language === 'AR' ? 'تحديد العملة:' : 'Currency:'}</span>
              <button
                type="button"
                onClick={() => setCurrency('YER')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  currency === 'YER'
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
                id="currency-nav-yer-custom"
                title="Yemeni Rial"
              >
                <span>🇾🇪 {language === 'AR' ? 'يمني' : 'YER'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('SAR')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  currency === 'SAR'
                    ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
                id="currency-nav-sar-custom"
                title="Saudi Riyal"
              >
                <span>🇸🇦 {language === 'AR' ? 'سعودي' : 'Saudi'}</span>
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-full border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold px-2">{language === 'AR' ? 'اللغة:' : 'Language:'}</span>
              <button
                type="button"
                onClick={() => setLanguage('AR')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  language === 'AR'
                    ? 'bg-amber-450 bg-amber-400 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <span>🇾🇪 {language === 'AR' ? 'عربي' : 'Arabic'}</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                  language === 'EN'
                    ? 'bg-amber-450 bg-amber-400 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <span>🇬🇧 {language === 'AR' ? 'EN' : 'English'}</span>
              </button>
            </div>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="p-2 px-3 rounded-full border border-slate-800 bg-slate-950 hover:bg-slate-900 text-white transition-all flex items-center gap-2 relative cursor-pointer text-xs font-bold"
              id="cart-trigger-nav"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>{language === 'AR' ? 'السلة' : 'Basket'}</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-[10px] font-sans font-black flex items-center justify-center border border-slate-900 shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Panel Access */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onToggleAdminView}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isAdminView 
                      ? 'bg-amber-500 text-slate-900 hover:bg-amber-400' 
                      : 'bg-slate-950 border border-slate-800 text-amber-400 hover:bg-slate-900'
                  }`}
                  id="btn-admin-view-toggle"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isAdminView ? (language === 'AR' ? 'المعرض والسلع' : 'Showroom') : (language === 'AR' ? 'لوحة التحكم' : 'Control Area')}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-full bg-red-950/60 border border-red-800/80 hover:bg-red-900 text-red-300 transition-all cursor-pointer"
                  title={language === 'AR' ? 'تسجيل الخروج' : 'Log Out'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

          </div>

          {/* LOWER ROW: HORIZONTAL ACTION ACTIVE BUTTON PILLS (EXACTLY AS PICTURED) */}
          <div className="flex flex-wrap gap-3 items-center justify-start lg:justify-end w-full">
            
            {/* 1. المعرض والمعروضات  */}
            <button
              type="button"
              onClick={() => {
                if (isAdminView && onToggleAdminView) {
                  onToggleAdminView();
                }
                const el = document.getElementById('products-showroom-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-md select-none ${
                !isAdminView 
                  ? 'bg-[#facc15] text-slate-950 font-black border border-[#facc15]' 
                  : 'bg-slate-950 text-slate-300 border border-slate-850 hover:border-slate-700'
              }`}
            >
              <span>🏠</span>
              <span>{language === 'AR' ? 'المعرض والمعروضات' : 'Catalog & Exhibits'}</span>
            </button>

            {/* 2. المساعد الذكي AI */}
            <button
              type="button"
              onClick={() => {
                setShowAIAgent(true);
                if (chatHistory.length <= 1) {
                  setChatHistory([
                    { 
                      sender: 'bot', 
                      text: language === 'AR'
                        ? 'أهلاً بك في خدمات ومستودعات الذيباني VIP! يمكنني إرشادك وتجهيز طلبياتك وإضافة كروت الألعاب فوريًا برقم الآيدي الخاص بك. كيف يمكنني خدمتك اليوم؟'
                        : 'Welcome to Al-Dheebani VIP! I can guide your shopping, dispatch game vouchers, and top up credits. How can I assist you?'
                    }
                  ]);
                }
              }}
              className="px-5 py-2.5 rounded-2xl text-xs font-black bg-[#0d1425] hover:bg-slate-950 text-slate-100 border border-slate-800 hover:border-amber-400 cursor-pointer flex items-center gap-2 transition-all shadow-md"
            >
              <span>🤖</span>
              <span>{language === 'AR' ? 'المساعد الذكي AI' : 'Smart AI Curator'}</span>
            </button>

            {/* 3. تتبع الطلبات */}
            <button
              type="button"
              onClick={() => setShowTrackerModal(true)}
              className="px-5 py-2.5 rounded-2xl text-xs font-black bg-[#0d1425] hover:bg-slate-950 text-slate-100 border border-slate-800 hover:border-amber-400 cursor-pointer flex items-center gap-2 transition-all shadow-md"
            >
              <span>📋</span>
              <span className="flex items-center gap-1.5">
                <span>{language === 'AR' ? 'تتبع الطلبات' : 'Track Orders'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#facc15] animate-pulse"></span>
              </span>
            </button>

          </div>

          {/* MINIFIED SEARCH ROW (SHOWN NEATLY UNDER CONTROLS) */}
          <div className="w-full max-w-lg mt-1 relative flex items-center gap-2" dir="ltr">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'AR' ? '🔴 ابحث عن المنتجات هنا: عسل، باقة شحن، كود ألعاب...' : 'Search airtime packages, honey, game codes...'}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 text-right border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#facc15] transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={toggleListening}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isListening 
                  ? 'bg-red-950 border-red-500 text-red-400 animate-ping' 
                  : 'bg-slate-950 border-slate-850 text-amber-400 hover:border-amber-400'
              }`}
              title={language === 'AR' ? 'البحث الصوتي' : 'Voice Search'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

        </div>

      </div>

      {/* 5️⃣ AI FLOATING ASSISTANT DISPATCHER BUTTON & DRAWER (قسم AI الشامل والتحدث الصوتي) */}
      <div className="fixed bottom-6 left-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowAIAgent(!showAIAgent);
            if (chatHistory.length === 0) {
              setChatHistory([
                { 
                  sender: 'bot', 
                  text: language === 'AR'
                    ? 'مرحباً بك! أنا مستشارك التسوقي لمشروع الطيب الفاخر. يمكنني البحث عن الباقات والأسعار وإضافتها لسلتك بالصوت! اسألني مثلاً: "أضف عسل سدر للسلة" أو "كم سعر شدات ببجي؟"'
                    : 'Welcome! I am your AI curator. I can hunt recharges, list honey costs, and add products directly by speech. Say "add royal honey" or "how much is PUBG 660 UC?"'
                }
              ]);
            }
          }}
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
                    <span className="text-[10px] text-cyan-300 font-mono">gemini-3.5-flash @ YER</span>
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
                    <span>{language === 'AR' ? 'جاري التفكير والتنشيط...' : 'Processing audio/semantic nodes...'}</span>
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
                  🐝 {language === 'AR' ? 'أضف عسل' : 'Add Honey'}
                </button>
                <button
                  onClick={() => sendAIChatMessage(language === 'AR' ? 'ما هي باقات يمن موبايل المتوفرة؟' : 'What recharges are available?')}
                  className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 rounded-full flex-shrink-0 transition-all cursor-pointer"
                >
                  📱 {language === 'AR' ? 'باقات الرصيد' : 'Telecoms'}
                </button>
                <button
                  onClick={() => sendAIChatMessage(language === 'AR' ? 'كيف أشحن شدات ببجي؟' : 'How do I top up PUBG?')}
                  className="text-[10px] px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 rounded-full flex-shrink-0 transition-all cursor-pointer"
                >
                  🎮 {language === 'AR' ? 'شحن ألعاب' : 'Game Cards'}
                </button>
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-1.5">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendAIChatMessage();
                    }
                  }}
                  placeholder={language === 'AR' ? 'اكتب أمرك أو سؤالك هنا...' : 'Type message or command...'}
                  className="flex-1 bg-slate-950 text-xs text-slate-100 placeholder-slate-600 rounded-xl px-3 border border-slate-800 focus:outline-none focus:border-cyan-500"
                  id="ai-control-input"
                />
                
                {/* Micro Input */}
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isListening 
                      ? 'bg-red-950 border-red-500 text-red-500 animate-pulse' 
                      : 'bg-slate-955 border-slate-800 text-slate-450 hover:border-cyan-500 hover:text-cyan-400'
                  }`}
                  id="btn-voice-chat-control"
                >
                  <Mic className="w-4.5 h-4.5" />
                </button>

                <button
                  onClick={() => sendAIChatMessage()}
                  disabled={!aiChatInput.trim()}
                  className="p-2 px-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center"
                  id="btn-send-chat"
                >
                  <Play className="w-3 h-3 fill-slate-950" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6️⃣ ORDER TRACKER DIALOG (تتبع الطلب) */}
      <AnimatePresence>
        {showTrackerModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-800 p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-cyan-400" />
                  {language === 'AR' ? 'تتبع حالات الطلبات فوراً' : 'Instant Order Tracking Terminal'}
                </h3>
                <button
                  onClick={() => setShowTrackerModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  id="btn-close-tracker-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Input tracking */}
              <form onSubmit={handleTrackOrder} className="flex gap-2 mb-4">
                <input
                  type="text"
                  required
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g., HYB-847291"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-center font-mono font-bold tracking-widest text-cyan-300 uppercase placeholder-slate-700"
                  id="input-ordertrack-id"
                />
                <button
                  type="submit"
                  disabled={isSearchingOrder}
                  className="bg-slate-100 hover:bg-slate-250 text-slate-900 px-5 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                  id="btn-track-submit"
                >
                  {isSearchingOrder ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {language === 'AR' ? 'بحث' : 'Query'}
                </button>
              </form>

              {trackingError && (
                <div className="p-3 bg-red-950/45 border border-red-900 text-red-300 rounded-xl text-xs text-center mb-2">
                  {trackingError}
                </div>
              )}

              {/* Order Tracking outputs */}
              {trackedOrder ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-3"
                  id="tracked-order-results-card"
                >
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ORDER SERIAL</span>
                      <span className="text-sm font-mono font-black text-cyan-300">{trackedOrder.id}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-lg">
                      {getOrderStatusIcon(trackedOrder.status)}
                      <span className="text-xs font-bold text-slate-200">{getOrderStatusLabel(trackedOrder.status)}</span>
                    </div>
                  </div>

                  {/* Customer details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="block text-[10px] text-slate-550">{language === 'AR' ? 'اسم العميل:' : 'Buyer Name:'}</span>
                      <span className="font-semibold text-slate-200">{trackedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-550">{language === 'AR' ? 'رقم الهاتف:' : 'Telephone:'}</span>
                      <span className="font-semibold text-slate-200 font-mono">{trackedOrder.customerPhone}</span>
                    </div>
                  </div>

                  {/* Itemizations */}
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-550 border-b border-slate-900 pb-1 uppercase tracking-wider">{language === 'AR' ? 'السلع والخدمات الشاحنة:' : 'Purchased Items:'}</span>
                    {trackedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 items-center border-b border-slate-900/50 last:border-0">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-250">{language === 'AR' ? item.product.nameAR : item.product.nameEN}</span>
                          {item.rechargeDetails && (
                            <span className="text-[10px] text-cyan-400 font-mono">
                              {item.rechargeDetails.phoneNumber ? `🌐 Phone: ${item.rechargeDetails.phoneNumber}` : `🎮 Player ID: ${item.rechargeDetails.playerId}`}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-200 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                          {item.quantity}x
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing summaries */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-850 text-xs">
                    <span className="text-slate-400 font-bold">{language === 'AR' ? 'إجمالي الدفع (يمني):' : 'Sum total:'}</span>
                    <span className="text-sm font-mono font-black text-emerald-400">{trackedOrder.totalYER.toLocaleString()} YER</span>
                  </div>

                  {trackedOrder.notes && (
                    <div className="bg-slate-900 p-2 text-[10px] text-amber-300 border border-amber-950/50 rounded-lg">
                      <span className="font-bold block uppercase mb-0.5">NOTES:</span>
                      {trackedOrder.notes}
                    </div>
                  )}

                </motion.div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-slate-6 text-center text-slate-500">
                  <ClipboardList className="w-12 h-12 text-slate-700 mb-2" />
                  <span className="text-xs leading-relaxed">{language === 'AR' ? 'أدخل رمز الـ Serial الموثق (مثل HYB-847291) لمراقبة تزويد رصيدك أو تجهيز طرد العسل فوريًا.' : 'Query database above to check status of digital and physical dispatches.'}</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </header>
  );
}
