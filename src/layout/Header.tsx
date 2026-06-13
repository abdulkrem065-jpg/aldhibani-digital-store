/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Shield, Bot, Languages, ArrowLeftRight, Mic, MicOff, Sparkles, 
  HelpCircle, ClipboardList, CheckCircle2, Clock, Truck, Play, RefreshCw, X, LogOut, ShoppingCart, Share2 
} from 'lucide-react';
import { Language, Currency, StaffUser, StoreConfig, Order, Product } from '../types';
import { t } from '../lib/translations';

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
  showAssistantPage: boolean;
  onToggleAssistantPage: () => void;
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
  onOpenCart,
  showAssistantPage,
  onToggleAssistantPage
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
        setSearchQuery(transcript);
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
  }, [language, setSearchQuery]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(t('errors.voice_not_supported', language));
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
          setTrackingError(t('errors.order_not_found', language));
        }
      } else {
        setTrackingError(t('errors.network_error', language));
      }
    } catch (err) {
      setTrackingError(t('errors.tracking_failed', language));
    } finally {
      setIsSearchingOrder(false);
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
    switch (status) {
      case 'PENDING': return t('tracking.received', language);
      case 'PROCESSING': return t('tracking.processing', language);
      case 'COMPLETED': return t('tracking.completed', language);
      default: return t('tracking.cancelled', language);
    }
  };

  const handleShareWhatsApp = () => {
    if (!trackedOrder) return;
    
    const statusStr = getOrderStatusLabel(trackedOrder.status);
    const itemsStr = trackedOrder.items.map(item => {
      const prodName = language === 'AR' ? item.product.nameAR : item.product.nameEN;
      return `- ${prodName} (${item.quantity}x)`;
    }).join('\n');
    
    const currentUrl = window.location.origin;
    const textMsg = language === 'AR' 
      ? `📋 *حالة وتفاصيل طلبك*:\n\n*الرقم التسلسلي للطلب:* \`${trackedOrder.id}\`\n*حالة الطلب:* ${statusStr}\n*اسم العميل:* ${trackedOrder.customerName}\n\n*السلع المطلوبة:* \n${itemsStr}\n\n*الإجمالي:* ${trackedOrder.totalYER.toLocaleString()} YER\n\nويمكنك متابعة حالة الطلب فوريًا في أي وقت عبر هذا الرابط:\n${currentUrl}`
      : `📋 *Order Tracking Status*:\n\n*Order Serial:* \`${trackedOrder.id}\`\n*Status:* ${statusStr}\n*Customer:* ${trackedOrder.customerName}\n\n*Items:* \n${itemsStr}\n\n*Total Amount:* ${trackedOrder.totalYER.toLocaleString()} YER\n\nTrack your order online in real-time here:\n${currentUrl}`;

    const encoded = encodeURIComponent(textMsg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <header className="w-full bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800/80 z-40 sticky top-0 font-sans shadow-xl">
      
      {/* 1️⃣ MOVING ANNOUNCEMENTS BANNER (شريط الإعلانات المتحرك) */}
      <div className="w-full bg-cyan-950/70 border-b border-cyan-800/20 py-1 px-4 overflow-hidden relative">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[10px] md:text-xs font-semibold text-cyan-300 tracking-wide gap-8 flex">
            <span>{language === 'AR' ? config.tickerTextAR : config.tickerTextEN}</span>
            <span className="text-slate-500 select-none">•</span>
            <span>{language === 'AR' ? config.tickerTextAR : config.tickerTextEN}</span>
            <span className="text-slate-500 select-none">•</span>
            <span>{language === 'AR' ? config.tickerTextAR : config.tickerTextEN}</span>
          </span>
        </div>
      </div>

      {/* 2️⃣ TOP UTILITY MINI-TIER (Language, Currency, Quick Admin details) */}
      <div className="bg-slate-950/60 border-b border-slate-900/40 py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row-reverse sm:items-center sm:justify-between gap-1 text-[10px] md:text-[11px]" dir="rtl">
          {/* Right text info */}
          <div className="text-slate-400 font-medium text-right sm:text-right hidden sm:block">
            {language === 'AR' 
              ? '⚡ بوابة الذيباني VIP: شحن ألعاب فوري، توابل فاخرة، وتموين بموثوقية فائقة'
              : '⚡ Al-Dheebani VIP: Premium vouchers, pure honey & high-end spices'}
          </div>

          {/* Left selectors */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            {/* Currency Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">{t('nav.currency', language)}</span>
              <button
                type="button"
                onClick={() => setCurrency('YER')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  currency === 'YER'
                    ? 'text-amber-400 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="currency-nav-yer-custom"
                title="Yemeni Rial"
              >
                <span>🇾🇪 {t('nav.yemeni_rial', language)}</span>
              </button>
              <span className="text-slate-800">|</span>
              <button
                type="button"
                onClick={() => setCurrency('SAR')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  currency === 'SAR'
                    ? 'text-amber-400 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="currency-nav-sar-custom"
                title="Saudi Riyal"
              >
                <span>🇸🇦 {t('nav.saudi_riyal', language)}</span>
              </button>
            </div>

            <span className="text-slate-800 hidden sm:inline">|</span>

            {/* Language Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500">{t('nav.language', language)}</span>
              <button
                type="button"
                onClick={() => setLanguage('AR')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  language === 'AR'
                    ? 'text-amber-400 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>عربي</span>
              </button>
              <span className="text-slate-800">|</span>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  language === 'EN'
                    ? 'text-amber-400 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>EN</span>
              </button>
            </div>

            {/* Admin Toggle Panel Access if logged in */}
            {user && (
              <>
                <span className="text-slate-800">|</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onToggleAdminView}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all flex items-center gap-1 ${
                      isAdminView 
                        ? 'bg-amber-500 text-slate-950 font-black' 
                        : 'text-amber-400 hover:bg-slate-900 override:hover:text-amber-300'
                    }`}
                    id="btn-admin-view-toggle"
                  >
                    <Shield className="w-2.5 h-2.5" />
                    <span>{isAdminView ? t('nav.showroom', language) : t('nav.dashboard', language)}</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-1 rounded bg-red-955/20 border border-red-900/40 text-red-400 hover:bg-red-900 hover:text-white transition-all scale-90 cursor-pointer"
                    title={language === 'AR' ? 'تسجيل الخروج' : 'Log Out'}
                  >
                    <LogOut className="w-2.5 h-2.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3️⃣ MAIN COMPACT NAVBAR (SLIM & STYLISH) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-2.5 flex flex-col lg:flex-row-reverse items-center justify-between gap-2.5 lg:h-14" dir="rtl">
        
        {/* PREMIUM COMPACT BRAND LOGO */}
        <div 
          onClick={() => {
            if (isAdminView && onToggleAdminView) {
              onToggleAdminView();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="bg-[#facc15] text-[#0f172a] px-3 py-1 rounded-xl flex items-center justify-center gap-2 border border-yellow-400 shadow-sm transition-all active:scale-95 hover:brightness-105 select-none cursor-pointer w-full lg:w-auto shrink-0"
        >
          {config.logoImageUrl ? (
            <img 
              src={config.logoImageUrl} 
              alt="Logo" 
              className="w-7 h-7 object-contain rounded-lg shadow-md border border-amber-400/30" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5.5 h-5.5 rounded bg-slate-950 text-amber-400 flex items-center justify-center text-[10px] font-black shadow-inner">
              {config.logoEmoji || '👑'}
            </div>
          )}
          <div className="flex flex-col text-right leading-none">
            <span className="text-[8px] font-bold text-slate-900/60 leading-none">{language === 'AR' ? 'مستودع ومتجر' : 'Warehouse & Store'}</span>
            <span className="text-xs md:text-sm font-black text-[#9a1b1b] tracking-wider uppercase leading-none mt-0.5">
              {language === 'AR' ? config.shopNameAR : config.shopNameEN}
            </span>
          </div>
        </div>

        {/* COMPACT MIDDLE SEARCH BAR & CORE CONTROLS */}
        <div className="flex-1 w-full flex flex-col md:flex-row-reverse md:items-center justify-between gap-2">
          
          {/* SEARCH FIELD WITH INTEGRATED MIC */}
          <div className="w-full md:max-w-xs xl:max-w-md relative flex items-center gap-1" dir="ltr">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.search_placeholder', language)}
                className="w-full pl-7 pr-7 py-1 bg-slate-950/80 text-right border border-slate-850 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#facc15] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <button
              onClick={toggleListening}
              className={`p-1 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isListening 
                  ? 'bg-red-955 border-red-500 text-red-400 animate-pulse' 
                  : 'bg-slate-950 border-slate-850 text-amber-500 hover:border-amber-400'
              }`}
              title={t('nav.voice_search', language)}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* COMPACT RECTANGULAR MENU NAVIGATION BUTTONS */}
          <div className="flex items-center gap-1 overflow-x-auto justify-center md:justify-start w-full md:w-auto pb-0.5 md:pb-0 scrollbar-none">
            
            {/* 1. المعرض والمعروضات */}
            <button
              type="button"
              onClick={() => {
                if (isAdminView && onToggleAdminView) {
                  onToggleAdminView();
                }
                if (showAssistantPage && onToggleAssistantPage) {
                  onToggleAssistantPage();
                }
                const el = document.getElementById('products-showroom-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-2 py-1 rounded-lg text-[10px] md:text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all border ${
                !isAdminView && !showAssistantPage
                  ? 'bg-[#facc15] text-slate-950 border-amber-400 font-extrabold shadow-sm' 
                  : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <span>🏠</span>
              <span>
                {isAdminView 
                  ? (language === 'AR' ? 'العودة للمعرض 🛒' : 'Back to Store 🛒')
                  : t('nav.showroom', language)
                }
              </span>
            </button>

            {!isAdminView && (
              <>
                {/* 2. المساعد الذكي AI */}
                <button
                  type="button"
                  onClick={onToggleAssistantPage}
                  className={`px-2 py-1 rounded-lg text-[10px] md:text-[11px] font-black flex items-center gap-1 transition-all border cursor-pointer ${
                    showAssistantPage
                      ? 'bg-[#facc15] text-slate-950 border-amber-400 font-extrabold shadow-sm'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-amber-400'
                  }`}
                >
                  <span>🤖</span>
                  <span>{t('nav.bot', language)}</span>
                </button>

                {/* 3. تتبع الطلبات */}
                <button
                  type="button"
                  onClick={() => setShowTrackerModal(true)}
                  className="px-2 py-1 rounded-lg text-[10px] md:text-[11px] font-black bg-slate-950/60 hover:bg-slate-900 text-slate-100 border border-slate-800 hover:border-amber-400 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <span>📋</span>
                  <span>{t('nav.track', language)}</span>
                </button>

                {/* 4. السلة */}
                <button
                  onClick={onOpenCart}
                  className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-white transition-all flex items-center gap-1 cursor-pointer text-[10px] md:text-[11px] font-bold"
                  id="cart-trigger-nav"
                >
                   <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('nav.cart', language)}</span>
                  {cartCount > 0 && (
                    <span className="px-1 rounded bg-red-600 text-white font-bold leading-none text-[9px] min-w-4 text-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}

          </div>

        </div>

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

                  {/* Share status integration */}
                  <div className="mt-2 pt-2 border-t border-slate-900 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/10 hover:border-emerald-500/20 text-xs font-bold font-sans tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/10"
                    >
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <span>{language === 'AR' ? 'مشاركة حالة الطلب عبر واتساب' : 'Share status to WhatsApp'}</span>
                    </button>
                  </div>

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
