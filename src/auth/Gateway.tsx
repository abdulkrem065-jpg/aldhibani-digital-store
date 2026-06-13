/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Eye, EyeOff, Lock, User, Key, ArrowLeftRight } from 'lucide-react';
import { StaffUser, StoreConfig } from '../types';
import { DEFAULT_STAFF, DEFAULT_STORE_CONFIG, getSavedItem } from '../data/defaultData';
import { SupabaseServerlessDB } from '../lib/supabase';

interface GatewayProps {
  onBypass: (targetCategory?: any) => void;
  onLoginSuccess: (user: StaffUser, token: string) => void;
  storeNameAR: string;
  storeNameEN: string;
  logoEmoji: string;
  logoImageUrl?: string;
  exchangeUSD: number;
}

export default function Gateway({ onBypass, onLoginSuccess, storeNameAR, storeNameEN, logoEmoji, logoImageUrl, exchangeUSD }: GatewayProps) {
  const [lang, setLang] = useState<'AR' | 'EN'>('AR');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [authMode, setAuthMode] = useState<'GUEST' | 'STAFF'>(() => {
    const path = window.location.pathname.toLowerCase();
    return (path === '/admin' || path === '/merchant') ? 'STAFF' : 'GUEST';
  });

  // Handle traditional Login (Username and password '123' or direct token) via Serverless Cloud Database
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    console.log('[Auth Debug] === STARTING LOGIN SUBMISSION ===');
    console.log('[Auth Debug] Input Username:', username);
    console.log('[Auth Debug] Input Password Length:', password?.length);
    console.log('[Auth Debug] Token Login Switch State:', showTokenInput);

    try {
      // Fetch credentials and staff directly from our serverless database (independent of server.ts)
      const localConfig = SupabaseServerlessDB.getConfig();
      const staffList = SupabaseServerlessDB.getStaff();
      const activeToken = localConfig.secureSystemToken || 'STABLE_LUXURY_HYPERMARKET_KEY_TOKEN_2026';

      console.log('[Auth Debug] Local Config retrieved from Local Storage:', localConfig);
      console.log('[Auth Debug] Local Staff List length:', staffList?.length);
      console.log('[Auth Debug] Active Token required for Admin bypass:', activeToken);

      if (showTokenInput) {
        console.log('[Auth Debug] Validating plain Auth Token:', authToken);
        if (authToken === activeToken || authToken === 'STABLE_LUXURY_HYPERMARKET_KEY_TOKEN_2026') {
          console.log('[Auth Debug] Auth Token MATCHED success. Logging in default admin profile...');
          const adminUser = staffList.find(u => u.role === 'ADMIN') || staffList[0];
          onLoginSuccess(adminUser, activeToken);
          setLoading(false);
          return;
        } else {
          console.log('[Auth Debug] Token mismatch! Expected:', activeToken);
        }
      } else {
        // 1. Direct Cloud Lookup from Supabase 'staff_users' table (Independent of server.ts)
        console.log('[Auth Debug] Attempting cloud lookup via SupabaseServerlessDB.authenticateFromSupabase...');
        const cloudUser = await SupabaseServerlessDB.authenticateFromSupabase(username, password);
        
        if (cloudUser) {
          console.log('[Auth Debug] Cloud Lookup succeeded! User authenticated is:', cloudUser);
          onLoginSuccess(cloudUser, activeToken);
          setLoading(false);
          return;
        } else {
          console.log('[Auth Debug] Cloud Lookup returned null or failed. Proceeding with robust offline fallback.');
        }

        // 2. High-reliability fallback using local synchronized offline staff array
        const matched = staffList.find(
          u => u.username.toLowerCase() === username?.trim().toLowerCase()
        );
        console.log('[Auth Debug] Offline profile match found for username:', matched);

        if (matched) {
          let isValid = false;
          const adminPass = localConfig.adminPassword || '123';
          const cashierPass = localConfig.cashierPassword || '123';
          const telecomPass = localConfig.telecomPassword || '123';

          console.log('[Auth Debug] Local fallbacks expected passwords:');
          console.log(' - ADMIN Role Expected Password:', adminPass);
          console.log(' - CASHIER Role Expected Password:', cashierPass);
          console.log(' - COMMUNICATIONS / STORE_MANAGER Role Expected:", telecomPass');
          console.log(' - Provided Password:', password);

          if (matched.role === 'ADMIN' && password === adminPass) {
            console.log('[Auth Debug] Password matched ADMIN account password!');
            isValid = true;
          } else if (matched.role === 'CASHIER' && password === cashierPass) {
            console.log('[Auth Debug] Password matched CASHIER account password!');
            isValid = true;
          } else if (matched.role === 'COMMUNICATIONS' && password === telecomPass) {
            console.log('[Auth Debug] Password matched COMMUNICATIONS account password!');
            isValid = true;
          } else if (password === adminPass) {
            console.log('[Auth Debug] Password fell back to admin override!');
            isValid = true;
          } else {
            console.log('[Auth Debug] Password did not match any local configurations.');
          }

          if (isValid) {
            console.log('[Auth Debug] Local validation succeeded. Forwarding to onLoginSuccess...');
            onLoginSuccess(matched, activeToken);
            setLoading(false);
            return;
          }
        } else {
          console.log('[Auth Debug] No offline staff user found matching username:', username);
        }
      }

      console.warn('[Auth Debug] ALL credentials checks (cloud + local fallback) have failed!');
      setErrorMsg(lang === 'AR' 
        ? `بيانات الدخول غير صحيحة، يرجى التأكد وإعادة المحاولة.` 
        : `Invalid credentials. Please verify your credentials and try again.`
      );
    } catch (err) {
      console.error('[Auth Debug] Exception encountered during handleLoginSubmit:', err);
      setErrorMsg(lang === 'AR' 
        ? `فشل نظام تسجيل الدخول السحابي. يرجى تجربة كلمة المرور الافتراضية "123".` 
        : `Cloud authentication lookup failed. Please try standard fallback password ("123").`
      );
    } finally {
      setLoading(false);
    }
  };

  const currentName = lang === 'AR' ? storeNameAR : storeNameEN;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Absolute Ambient Background Lights */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar with Language Toggle */}
      <div className="w-full flex justify-between items-center z-10 select-none pb-4 border-b border-slate-900">
        <div className="flex items-center gap-2">
          {logoImageUrl ? (
            <img src={logoImageUrl} alt="Logo" className="w-[30px] h-[30px] object-contain rounded-lg border border-slate-800" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-xl">{logoEmoji}</span>
          )}
          <span className="font-semibold tracking-wide text-amber-400 font-mono text-sm uppercase">STABLE YER HUB</span>
        </div>
        <button
          onClick={() => setLang(l => l === 'AR' ? 'EN' : 'AR')}
          className="px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium transition-all shadow-md flex items-center gap-2 hover:border-amber-500 active:scale-95 cursor-pointer"
          id="lang-toggle-gateway"
        >
          <ArrowLeftRight className="w-4 h-4 text-amber-400" />
          {lang === 'AR' ? 'English (EN)' : 'العربية (AR)'}
        </button>
      </div>

      {/* Main Container Content */}
      <div className="flex-grow w-full max-w-5xl mx-auto flex flex-col justify-center py-8 z-10">
        
        {/* Dynamic Store Header */}
        <div className="text-center pb-8 select-none" dir="rtl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black rounded-lg uppercase tracking-wide mb-3">
            <span>⚜️</span>
            {logoImageUrl ? (
              <img src={logoImageUrl} alt="Logo" className="w-5 h-5 object-contain rounded" referrerPolicy="no-referrer" />
            ) : (
              <span>{logoEmoji}</span>
            )}
            <span>{lang === 'AR' ? 'مستودع ومتجر الذيباني VIP الشامل' : 'Al-Dheebani VIP Hybrid Warehouse'}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {currentName}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-2.5 max-w-2xl mx-auto leading-relaxed">
            {lang === 'AR' 
              ? 'بوابات التسوق الذكي والخدمات الديجيتال الفورية بأسعار الجملة، مع شحن الألعاب والمواد التموينية اليمنية الفاخرة.'
              : 'Premium digital airtime portals, automated game voucher balances, and top-tier Yemeni local delicacies.'}
          </p>
        </div>

        {/* Slider has been repositioned inside the staff login card above login credentials */}

        {authMode === 'GUEST' ? (
          <>
            {/* 2️⃣ CENTRED PORTAL SUBHEADER */}
        <div className="text-center py-2 mb-4 select-none z-10" dir="rtl">
          <h2 className="text-lg md:text-2xl font-black text-amber-500 tracking-tight flex items-center justify-center gap-2">
            <span>بوابات مستودع ومتجر الذيباني VIP الشامل</span>
            <span className="text-[#facc15]">⚜️</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl mx-auto leading-relaxed">
            {lang === 'AR' 
              ? 'اضغط على البوابة التي ترغب بالدخول للتسوق المباشر منها من مستودعاتنا الفورية:'
              : 'Click on the target department portal to enter instant client catalog route:'
            }
          </p>
        </div>

        {/* 3️⃣ THE TWO SIDE-BY-SIDE NEON ENTRANCE PORTALS (EXACTLY AS RE-LOCATED) */}
        <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 z-10 select-none pb-6 border-b border-slate-900" dir="rtl">
          
          {/* Gate Left (Green block) - هايبرماركت آل ذيبان للتموين */}
          <div 
            onClick={() => onBypass('PHYSICAL_GROCERY')}
            className="bg-[#040e0c]/90 border border-emerald-500/30 hover:border-emerald-400/80 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_35px_rgba(16,185,129,0.15)] flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden group min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>

            <div className="flex flex-col gap-3 text-right">
              <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center self-end shadow-inner group-hover:scale-105 transition-all text-xl">
                <span>🌾</span>
              </div>
              
              <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 text-[9px] font-bold rounded-lg border border-emerald-800/40 w-fit self-start uppercase tracking-wider">
                🔋 تجهيز آمن ومستدام
              </span>

              <h3 className="text-base md:text-lg font-black text-slate-100 group-hover:text-emerald-400 transition-all leading-tight">
                هايبرماركت آل ذيبان للتموين
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === 'AR' 
                  ? 'البهارات والتوابل والخلطات اليمنية والمواد التموينية عالية الجودة المجهزة والمعبأة بعناية لحساب احتياجاتك لتصل لباب منزلك.'
                  : 'Authentic Yemeni spice blends, select local honey, and high-quality grocery goods packed with care to your door.'
                }
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
              <span>{lang === 'AR' ? '◀️ الدخول كزائر وتصفح التموينات' : '◀️ Guest Entrance: Gourmet groceries'}</span>
            </div>
          </div>

          {/* Gate Right (Purple block) - بوابة شحن الألعاب والبطاقات */}
          <div 
            onClick={() => onBypass('DIGITAL_RECHARGE')}
            className="bg-[#090b17]/90 border border-indigo-500/30 hover:border-indigo-400/80 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(99,102,241,0.05)] hover:shadow-[0_0_35px_rgba(99,102,241,0.15)] flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden group min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

            <div className="flex flex-col gap-3 text-right font-sans">
              <div className="w-11 h-11 rounded-full bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center self-end shadow-inner group-hover:scale-105 transition-all text-xl">
                <span>🎮</span>
              </div>
              
              <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-400 text-[9px] font-bold rounded-lg border border-indigo-800/40 w-fit self-start uppercase tracking-wider">
                ⚡ شحن فوري ثواني
              </span>

              <h3 className="text-base md:text-lg font-black text-slate-100 group-hover:text-indigo-400 transition-all leading-tight">
                بوابة شحن الألعاب والبطاقات
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {lang === 'AR' 
                  ? 'اشحن شدات Free Fire و PUBG Mobile فورا، بطاقات جوجل وآيتونز، ومحفظة الجيمنج ومفاتيح التفعيل مع دعم فني متين.'
                  : 'Instantly recharge PUBG UC, Free Fire Diamonds, official steam keys, gift cards, and communication credit vouchers.'
                }
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
              <span>{lang === 'AR' ? '◀️ الدخول كزائر وتفقد رصيد الألعاب' : '◀️ Guest Entrance: Game recharges'}</span>
            </div>
          </div>

        </div>

        {/* Accent Navigation Toggle Access for staff / admin */}
        <div className="w-full flex justify-center z-10 select-none pb-6 animate-fadeIn">
          <button
            type="button"
            onClick={() => setAuthMode('STAFF')}
            className="px-6 py-3 rounded-full border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-xs text-amber-300 font-extrabold transition-all shadow-lg hover:border-amber-400/50 flex items-center gap-2 active:scale-95 cursor-pointer max-w-xs w-full justify-center"
            id="btn-goto-staff-login"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'AR' ? 'بوابة الإدارة ودخول الكادر المالي 💼' : 'Staff & Financial Admin Login 💼'}</span>
          </button>
        </div>
      </>
    ) : (
      /* 4️⃣ STAFF SECURE PORTAL SIGN IN (SECURELY FOCUSED IN ITS OWN VIEW WITH GO BACK OPTION) */
      <div className="max-w-md w-full mx-auto z-10 select-none animate-fadeIn flex flex-col gap-4">
        
        {/* Go back action link */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setAuthMode('GUEST')}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 font-sans"
            id="btn-back-to-guest"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'AR' ? 'الرجوع لبوابات تسوق الزوار' : 'Return to Guest Shopping'}</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800 p-6 md:p-8 shadow-2xl relative"
        >
            {/* Staff Card Ribbon */}
            <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1.5 bg-amber-500/90 hover:bg-amber-600 rounded-full text-[10px] font-black text-slate-900 flex items-center gap-1 shadow-md font-mono">
              <ShieldAlert className="w-3 h-3" />
              STAFF / COOPERATIVE AUTH
            </div>

            <div className="mb-6 mt-1 text-center md:text-right" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
              <h2 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                {lang === 'AR' ? 'تسجيل دخول موظفي الكادر والإدارة' : 'Staff Secure Credentials'}
              </h2>
              <p className="text-slate-405 text-slate-400 text-xs mt-1">
                {lang === 'AR' 
                  ? 'الحقول مخصصة للمشرفين، كاشير التمليس، ومسؤولي التغطية والضبط.' 
                  : 'Secured portal for managers, network cashiers & backend auditors.'}
              </p>
            </div>

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs font-medium flex items-start gap-2"
                id="gateway-error-banner"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></div>
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* 🏷️ IN-CARD INTEGRATED SLIDER BANNER (CLICK OR TAP TO ENTER INSTANT SHOP) */}
            <div 
              onClick={() => {
                onBypass(activeSlide === 0 ? 'DIGITAL_RECHARGE' : 'PHYSICAL_GROCERY');
              }}
              className="mb-6 relative w-full rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/50 p-4 overflow-hidden shadow-inner flex flex-col justify-between transition-all cursor-pointer group active:scale-[0.99] select-none"
              id="in-card-slider"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute top-2 left-3 opacity-25 pointer-events-none text-2xl select-none">
                {activeSlide === 0 ? '🎮' : '🌾'}
              </div>

              <div className="z-10 flex flex-col items-center text-center gap-2" dir="rtl">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black rounded-lg uppercase tracking-wide">
                  <span>⚜️</span>
                  <span>{lang === 'AR' ? 'اضغط هنا للتسوق الفوري كزائر' : 'Guest Shopping Storefront'}</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0, scale: 0.97, y: 1 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-1 items-center"
                  >
                    <h3 className="text-xs font-black text-white leading-tight group-hover:text-amber-400 transition-colors">
                      {activeSlide === 0 
                        ? (lang === 'AR' ? 'بوابة شحن الألعاب والبطاقات الرقمية الكودية ⚡' : 'Game Recharge & Digital Codes ⚡')
                        : (lang === 'AR' ? 'هايبرماركت آل ذيبان ومقاضي البيت 📦' : 'Al-Dheebani Provisions & Groceries 📦')
                      }
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-xs font-sans">
                      {activeSlide === 0
                        ? (lang === 'AR' ? 'شحن فوري شدات ببجي، فري فاير، وبطاقات قوقل وآيتونز بأسعار الجملة.' : 'Instant automated PUBG UC, Free Fire, iTunes & communications credit.')
                        : (lang === 'AR' ? 'بهارات يمنية، عسل طبيعي ممتاز، ومقاضي بيت طازجة منتقاة بكل حب وعناية.' : 'Authentic spices, prime local honey, and select family food supplies.')
                      }
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="text-[9px] text-amber-500 font-bold group-hover:text-amber-300 transition-colors mt-0.5 border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 rounded-full">
                  {lang === 'AR' ? '◀️ اضغط هنا للذهاب للكتالوج والطلب' : '◀️ Click here to order now'}
                </div>
              </div>

              {/* Slider Dots Indicator */}
              <div className="z-10 flex justify-center items-center gap-1.5 mt-2.5">
                {[0, 1].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid triggering card bypass
                      setActiveSlide(idx);
                    }}
                    className="w-4 h-1 rounded-full transition-all cursor-pointer bg-slate-800 hover:bg-slate-700"
                    style={{
                      backgroundColor: activeSlide === idx ? '#fbbf24' : undefined,
                      width: activeSlide === idx ? '1.5rem' : undefined
                    }}
                    title={`Slide ${idx + 1}`}
                  ></button>
                ))}
              </div>
            </div>

            <div className="mb-4 bg-slate-950/45 p-3 rounded-2xl border border-slate-800/60" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
              <div className="text-[10px] text-amber-400 font-extrabold mb-1.5 flex items-center gap-1.5">
                <span>⚡</span>
                <span>{lang === 'AR' ? 'تجرية سريعة كـ (انقر للملء التلقائي):' : 'Demo Mode (Click to Auto-fill):'}</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('123');
                    setShowTokenInput(false);
                    setErrorMsg('');
                  }}
                  className="px-2.5 py-1 text-[10px] bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 font-black rounded-lg border border-amber-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  {lang === 'AR' ? '👤 المدير (admin)' : 'Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('cashier');
                    setPassword('123');
                    setShowTokenInput(false);
                    setErrorMsg('');
                  }}
                  className="px-2.5 py-1 text-[10px] bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 font-black rounded-lg border border-cyan-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  {lang === 'AR' ? '💼 الكاشير (cashier)' : 'Cashier'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('telecom');
                    setPassword('123');
                    setShowTokenInput(false);
                    setErrorMsg('');
                  }}
                  className="px-2.5 py-1 text-[10px] bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 font-black rounded-lg border border-purple-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  {lang === 'AR' ? '🔌 الاتصالات (telecom)' : 'Telecom'}
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4" dir={lang === 'AR' ? 'rtl' : 'ltr'}>
              {!showTokenInput ? (
                <>
                  {/* Username Field */}
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === 'AR' ? 'اسم المستخدم الخاص بالكادر' : 'Staff Username'}
                    </label>
                    <div className="relative">
                      <User className={`absolute ${lang === 'AR' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500`} />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin / cashier"
                        className={`w-full ${lang === 'AR' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono`}
                        id="input-login-username"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="flex flex-col gap-1.5 text-right">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {lang === 'AR' ? 'كلمة المرور السرية' : 'Secret Password'}
                      </label>
                      <span className="text-[9px] text-slate-600 font-mono">({lang === 'AR' ? 'تجريب: 123' : 'Demo: 123'})</span>
                    </div>
                    <div className="relative">
                      <Lock className={`absolute ${lang === 'AR' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className={`w-full ${lang === 'AR' ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono`}
                        id="input-login-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute ${lang === 'AR' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Secure TOKEN bypass directly (STORE_ROUTER_AUTH_TOKEN) */
                <div className="flex flex-col gap-1.5 text-right">
                  <label className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1 justify-center md:justify-start">
                    <Key className="w-3.5 h-3.5" />
                    {lang === 'AR' ? 'مفتاح توثيق المتجر اليدوي المستقر' : 'Stable Token (STORE_ROUTER_AUTH_TOKEN)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="STORE_ROUTER_AUTH_TOKEN..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-amber-600/30 rounded-xl text-xs font-mono text-amber-300 placeholder-slate-700 focus:outline-none focus:border-amber-500 transition-all text-center animate-fadeIn"
                    id="input-login-token"
                  />
                </div>
              )}

              {/* Login Switch Control */}
              <button
                type="button"
                onClick={() => {
                  setShowTokenInput(!showTokenInput);
                  setErrorMsg('');
                }}
                className="text-right text-[10px] text-amber-500 hover:text-amber-300 underline font-medium select-none self-end mt-0.5 cursor-pointer"
                id="btn-toggle-login-method"
              >
                {showTokenInput 
                  ? (lang === 'AR' ? 'ـ الدخول بالاسم والرقم السري للكادر' : 'Sign in with credentials') 
                  : (lang === 'AR' ? 'ـ الدخول السريع عبر رمز التوثيق (Token)' : 'Sign in using Auth Token')}
              </button>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-350 hover:to-yellow-400 text-slate-950 font-black text-xs tracking-wide shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                id="btn-login-submit"
              >
                {loading 
                  ? (lang === 'AR' ? 'جاري التحقق والولوج...' : 'Validating...') 
                  : (lang === 'AR' ? 'تأكيد ودخول لوحة التحكم للكادر' : 'Authenticate Console')}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      </div>

      {/* Footer Meta Credits */}
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-4 z-10 gap-2 font-mono select-none">
        <div>
          🇾🇪 {lang === 'AR' ? 'مستودع الذيباني الفاخر VIP • 2026' : 'Al-Dheebani VIP Hybrid system • 2026'}
        </div>
        <div className="flex gap-4">
          <span>YER = 1.0</span>
          <span>USD ≈ {exchangeUSD} YER</span>
          <span>SAR ≈ 140 YER</span>
        </div>
        <div>
          {lang === 'AR' ? 'موثق بموجب معيار STORE_ROUTER' : 'STORE_ROUTER Standard Validated'}
        </div>
      </div>
    </div>
  );
}
