import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, Plus, ShieldCheck, Gamepad2, Info, User, Phone, CheckCircle, 
  Trash2, X, Clipboard, ArrowRight, ArrowLeftRight, CreditCard, Sparkles 
} from 'lucide-react';
import { Product, CartItem, Currency, Language, StaffUser } from '../types';
import { getSavedItem, saveItem, DEFAULT_ORDERS } from '../data/defaultData';
import { SupabaseServerlessDB } from '../lib/supabase';
import { t } from '../lib/translations';

interface ProductCardProps {
  key?: any;
  product: Product;
  language: Language;
  currency: Currency;
  exchangeUSD: number;
  exchangeSAR: number;
  onAddToCart: (product: Product, quantity: number, details?: any) => void;
}

export function ProductCard({
  product,
  language,
  currency,
  exchangeUSD,
  exchangeSAR,
  onAddToCart
}: ProductCardProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Currency Converter Formula
  const convertPrice = (priceYER: number) => {
    switch (currency) {
      case 'USD': return (priceYER / exchangeUSD).toFixed(2);
      case 'SAR': return (priceYER / exchangeSAR).toFixed(2);
      default: return priceYER.toLocaleString();
    }
  };

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'USD': return '$';
      case 'SAR': return 'ر.س';
      default: return 'ريال يمني';
    }
  };

  const isDigital = product.category === 'DIGITAL_RECHARGE' || product.category === 'DIGITAL_GAME';
  
  const handleAddClick = () => {
    if (isDigital) {
      // Toggle inputs for card config
      setShowConfig(true);
    } else {
      onAddToCart(product, 1);
    }
  };

  const handleConfirmDigitalAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (product.category === 'DIGITAL_RECHARGE') {
      if (!phoneNumber.trim()) {
        setErrorMsg(t('errors.phone_required', language));
        return;
      }
      if (!/^[057]\d{8}$/.test(phoneNumber.trim()) && phoneNumber.trim().length < 9) {
        setErrorMsg(t('errors.invalid_phone', language));
        return;
      }
      onAddToCart(product, 1, { phoneNumber: phoneNumber.trim() });
    } else {
      if (!playerId.trim()) {
        setErrorMsg(t('errors.player_id_required', language));
        return;
      }
      onAddToCart(product, 1, { playerId: playerId.trim() });
    }

    setPhoneNumber('');
    setPlayerId('');
    setShowConfig(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden group">
      
      {/* Visual background gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Ribbon categorizations */}
      <div className="absolute top-4 right-4 z-10 flex gap-1.5">
        <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-md text-white ${
          isDigital ? 'bg-indigo-600/90' : 'bg-emerald-600/90'
        }`}>
          {product.category === 'DIGITAL_RECHARGE' ? t('product.digital_recharge', language) :
           product.category === 'DIGITAL_GAME' ? t('product.digital_game', language) :
           product.category === 'PHYSICAL_GROCERY' ? t('product.physical_grocery', language) :
           t('product.physical_device', language)}
        </span>
        {product.stock !== undefined && product.stock <= 5 && (
          <span className="text-[9px] font-bold bg-amber-500 text-slate-900 px-2.5 py-1 rounded-full shadow-md animate-pulse">
            {t('product.stock_left', language, { stock: product.stock })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3.5 relative z-10">
        
        {/* Product Artwork image */}
        <div className="w-full h-44 rounded-2xl bg-slate-950 overflow-hidden relative border border-slate-850">
          {(() => {
            const resolved = (() => {
              // Priority 1: Admin custom image (has product_image_url and is not AI suggested)
              if (product.product_image_url && !product.is_ai_suggested) {
                return { src: product.product_image_url, isAi: false };
              }
              // Priority 2: Platform library image (has imageUrl that's not a generic placeholder/picsum seed)
              if (product.imageUrl && product.imageUrl !== '' && !product.imageUrl.includes('placeholder') && !product.imageUrl.includes('picsum.photos/seed')) {
                return { src: product.imageUrl, isAi: false };
              }
              // Priority 3: AI Suggested image (either stored in ai_suggested_url or saved as approved with is_ai_suggested)
              if (product.ai_suggested_url) {
                return { src: product.ai_suggested_url, isAi: true };
              }
              if (product.product_image_url && product.is_ai_suggested) {
                return { src: product.product_image_url, isAi: true };
              }
              // Priority 4: Auto-generated image (using standard picsum seed based on product title)
              const safeSeed = encodeURIComponent((product.nameEN || product.nameAR || 'product').toLowerCase().replace(/\s+/g, '-'));
              return { src: `https://picsum.photos/seed/${safeSeed}/600/450`, isAi: false };
            })();

            return (
              <>
                <img
                  src={resolved.src}
                  alt={product.nameEN}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {resolved.isAi && (
                  <div className="absolute bottom-2 left-2 z-10 bg-cyan-950/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-lg">
                    <span>✨</span>
                    <span>{language === 'AR' ? 'صورة توضيحية' : 'Illustrative Image'}</span>
                  </div>
                )}
              </>
            );
          })()}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
              <span className="text-red-400 font-extrabold text-sm border-2 border-red-500 px-4 py-1 rounded-xl rotate-12">
                {t('product.sold_out', language)}
              </span>
            </div>
          )}
        </div>

        {/* Text descriptions */}
        <div>
          {product.brand && (
            <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase block mb-0.5">
              {product.brand}
            </span>
          )}
          <h3 className="text-sm font-black text-white hover:text-cyan-300 transition-colors line-clamp-1">
            {language === 'AR' ? product.nameAR : product.nameEN}
          </h3>
          <p className="text-slate-400 text-xs line-clamp-2 mt-1 leading-relaxed h-8">
            {language === 'AR' ? product.descriptionAR : product.descriptionEN}
          </p>
        </div>

      </div>

      {/* Pricing and cart dispatch panel */}
      <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between gap-4 relative z-10">
        
        {/* Real YER value and converted active money */}
        <div className="flex flex-col">
          <span className="text-lg font-mono font-black text-white">
            {convertPrice(product.priceYER)} <span className="text-xs text-slate-400">{getCurrencySymbol()}</span>
          </span>
          {currency !== 'YER' && (
            <span className="text-[9px] text-slate-500 font-mono">
              ≈ {product.priceYER.toLocaleString()} YER {t('product.stable_base', language)}
            </span>
          )}
        </div>

        {/* Action Button */}
        {!showConfig ? (
          <button
            onClick={handleAddClick}
            disabled={product.stock === 0 || !product.isAvailable}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-white text-slate-900 transition-all font-black hover:shadow-cyan-500/10 cursor-pointer disabled:opacity-30 disabled:hover:bg-slate-100 flex items-center gap-1 text-xs"
            id={`btn-add-card-${product.id}`}
          >
            <Plus className="w-4 h-4" />
            <span>{t('product.get_item', language)}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowConfig(false)}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
            id={`btn-close-card-config-${product.id}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

      </div>

      {/* Pop up configuration form inside card for immediate digital input */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-slate-950 border border-slate-850 rounded-2xl z-20 relative"
          >
            <form onSubmit={handleConfirmDigitalAdd} className="flex flex-col gap-2.5">
              <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5" />
                {t('product.recharge_confirm_title', language)}
              </span>

              {errorMsg && <p className="text-[10px] text-red-400 leading-tight bg-red-955/30 p-1.5 rounded">{errorMsg}</p>}

              {product.category === 'DIGITAL_RECHARGE' ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold">{t('product.recharge_phone_label', language)}</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="77xxxxxxx / 73xxxxxxx"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white font-mono text-center placeholder-slate-700 focus:outline-none focus:border-cyan-500"
                    id={`input-cellrecharge-${product.id}`}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-bold">{t('product.player_id_label', language)}</label>
                  <input
                    type="text"
                    required
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    placeholder="e.g. 517374829"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white font-mono text-center placeholder-slate-700 focus:outline-none focus:border-cyan-500"
                    id={`input-gamerecharge-${product.id}`}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all cursor-pointer"
                id={`btn-confirm-add-${product.id}`}
              >
                {t('product.add_to_cart_btn', language)}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

interface ShoppingCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: Currency;
  language: Language;
  exchangeUSD: number;
  exchangeSAR: number;
  currentUser?: StaffUser | null;
  activePaymentMethods?: string[];
  onUpdateQuantity: (productId: string, quantity: number, rechargeDetails?: any) => void;
  onRemoveItem: (productId: string, rechargeDetails?: any) => void;
  onClearCart: () => void;
  onNewOrderPlaced: () => void;
}

export function ShoppingCartDrawer({
  isOpen,
  onClose,
  cart,
  currency,
  language,
  exchangeUSD,
  exchangeSAR,
  currentUser,
  activePaymentMethods = ['كاش / نقداً', 'الكريمي إكسبرس', 'محفظة يمن باي', 'محفظة جوال باي', 'شحن آجل (حساب المديونية)'],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNewOrderPlaced
}: ShoppingCartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(activePaymentMethods[0] || 'كاش / نقداً');
  const [cashierId, setCashierId] = useState(currentUser?.username || 'guest');
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-sync cashier if logged in user changes
  React.useEffect(() => {
    if (currentUser) {
      setCashierId(currentUser.username);
    } else {
      setCashierId('guest');
    }
  }, [currentUser]);

  // Total calculations strictly anchored in YER to prevent YER exchange rates mismatch
  const totalYER = cart.reduce((sum, item) => sum + (item.product.priceYER * item.quantity), 0);

  const convertPrice = (priceYER: number) => {
    switch (currency) {
      case 'USD': return (priceYER / exchangeUSD).toFixed(2);
      case 'SAR': return (priceYER / exchangeSAR).toFixed(2);
      default: return priceYER.toLocaleString();
    }
  };

  const getCurrencySymbol = () => {
    switch (currency) {
      case 'USD': return '$';
      case 'SAR': return 'ر.س';
      default: return 'YER';
    }
  };

  // Submit order checkout via Serverless Cloud-ready Database authority
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setErrorMessage('');

    const generatedOrderId = `HYB-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id: generatedOrderId,
      items: cart,
      totalYER,
      currency,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      customerName: customerName.trim() || 'زبون فخم',
      customerPhone: customerPhone.trim() || 'دون هاتف',
      notes: checkoutNotes.trim(),
      paymentMethod,
      cashierId
    };

    try {
      // 1. Instantly write to the Supabase serverless local DB (Acts as our direct cloud-replica source of truth)
      SupabaseServerlessDB.saveOrder(newOrder);

      // 2. Quietly attempt to post to the local Express server if they have it running, but never block or crash
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: generatedOrderId,
            items: cart,
            totalYER,
            currency,
            customerName: customerName.trim() || 'زبون فخم',
            customerPhone: customerPhone.trim(),
            notes: checkoutNotes.trim(),
            paymentMethod,
            cashierId
          })
        }).catch(() => null);
      } catch (innerErr) {
        // Safe to ignore network glitches; serverless DB has already processed the order
      }

      setSuccessCode(generatedOrderId);
      onClearCart();
      onNewOrderPlaced(); // Refresh state lists
    } catch (err) {
      setErrorMessage(t('errors.db_checkout_failed', language));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(language === 'AR' ? 'تم نسخ كود التتبع بنجاح!' : 'Tracking code copied to clipboard!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity" onClick={onClose}></div>
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col justify-between shadow-2xl relative"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                  <span className="font-black text-lg tracking-wide">{t('cart.title', language)}</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  id="btn-close-cart-drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SUCCESS VIEW SCREEN */}
              {successCode ? (
                <div className="flex-1 p-6 flex flex-col justify-center items-center text-center gap-5 bg-slate-950">
                  <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-black text-white">{t('cart.success_header', language)}</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {t('cart.success_desc', language)}
                    </p>
                  </div>

                  <div className="bg-slate-900 p-4 border border-cyan-800 rounded-2xl w-full max-w-xs flex flex-col items-center">
                    <span className="text-[10px] text-cyan-400 tracking-widest font-mono font-black mb-1">{t('cart.tracking_code_title', language)}</span>
                    <span className="text-2xl font-mono font-black text-white tracking-widest bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-850 select-all shadow-inner">{successCode}</span>
                    <button
                      onClick={() => copyToClipboard(successCode)}
                      className="mt-3.5 px-3 py-1 bg-slate-800 border border-slate-700 hover:border-cyan-500 text-xs text-cyan-400 rounded-full flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>{t('cart.copy_code', language)}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSuccessCode('');
                      setCustomerName('');
                      setCustomerPhone('');
                      setCheckoutNotes('');
                      onClose();
                    }}
                    className="w-full max-w-xs py-3 rounded-xl bg-slate-105 hover:bg-slate-205 text-slate-900 text-sm font-black transition-all cursor-pointer mt-4"
                  >
                    {t('cart.back_to_shop', language)}
                  </button>
                </div>
              ) : (
                /* Standard Cart Layout */
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-6 text-center select-none py-12">
                        <div className="p-4 bg-slate-950 rounded-full border border-slate-850 text-slate-700 mb-2">
                          <ShoppingCart className="w-10 h-10 text-slate-700" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-300">{t('cart.empty', language)}</h4>
                        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed mt-1">{t('cart.explore_prompt', language)}</p>
                      </div>
                    ) : (
                      <>
                        {/* Cart Items List */}
                        <div className="space-y-3.5">
                          <span className="text-[10px] text-slate-450 font-black tracking-widest uppercase border-b border-slate-850 pb-1.5 block">
                            {t('cart.current_items', language)}
                          </span>
                          {cart.map((item) => (
                            <div key={item.product.id} className="bg-slate-950 rounded-2xl border border-slate-850 p-3.5 flex justify-between gap-3.5">
                              
                              <div className="flex gap-2.5 flex-1">
                                <img
                                  src={item.product.imageUrl}
                                  alt=""
                                  className="w-12 h-12 rounded-xl object-cover"
                                />
                                <div className="flex flex-col flex-1">
                                  <span className="text-xs font-black text-white hover:text-cyan-400 line-clamp-1">
                                    {language === 'AR' ? item.product.nameAR : item.product.nameEN}
                                  </span>
                                  <span className="text-[10px] font-mono text-cyan-300">
                                    {convertPrice(item.product.priceYER)} {getCurrencySymbol()}
                                  </span>
                                  {item.rechargeDetails && (
                                    <div className="mt-1 flex flex-col bg-slate-900 px-2 py-1 rounded border border-slate-850 text-[10px] font-mono">
                                      {item.rechargeDetails.phoneNumber && (
                                        <span className="text-slate-205">📞 Phone: {item.rechargeDetails.phoneNumber}</span>
                                      )}
                                      {item.rechargeDetails.playerId && (
                                        <span className="text-amber-400 font-bold">🎮 Player ID: {item.rechargeDetails.playerId}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end justify-between">
                                <button
                                  onClick={() => onRemoveItem(item.product.id, item.rechargeDetails)}
                                  className="text-slate-500 hover:text-red-400 p-1.5 bg-slate-900 border border-slate-850 hover:border-red-900 rounded-lg cursor-pointer text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                
                                {/* Quantity controls for physical, recharges generally 1 */}
                                {item.product.category.startsWith('PHYSICAL_') ? (
                                  <div className="flex items-center gap-1.5 bg-slate-900 p-0.5. py-1 rounded-lg border border-slate-850 mt-1">
                                    <button
                                      disabled={item.quantity <= 1}
                                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.rechargeDetails)}
                                      className="px-1.5 text-xs text-slate-500 hover:text-white disabled:opacity-30"
                                    >
                                      -
                                    </button>
                                    <span className="text-[11px] font-mono font-black text-slate-300">{item.quantity}</span>
                                    <button
                                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.rechargeDetails)}
                                      className="px-1.5 text-xs text-slate-400 hover:text-white"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : null}
                              </div>

                            </div>
                          ))}
                        </div>

                        {/* Customer Information Checkout Form */}
                        <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-4 border-t border-slate-850">
                          <span className="text-[10px] text-slate-450 font-black tracking-widest uppercase border-b border-slate-850 pb-1.5 block">
                            {t('cart.delivery_info', language)}
                          </span>

                          {errorMessage && <p className="text-xs text-red-400 bg-red-955/35 p-2 rounded-xl text-center">{errorMessage}</p>}

                          {/* Full Name */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('cart.full_name', language)}</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input
                                type="text"
                                required
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder={t('cart.full_name_placeholder', language)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder-slate-705 text-white"
                                id="checkout-customer-name"
                              />
                            </div>
                          </div>

                          {/* Phone number */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('cart.phone_contact', language)}</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <input
                                type="tel"
                                required
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="eg. 777123456"
                                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder-slate-705 text-white font-mono"
                                id="checkout-customer-phone"
                              />
                            </div>
                          </div>

                          {/* Payment Method Selector Dropdown */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{t('cart.payment_method', language)}</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                                id="checkout-payment-method"
                              >
                                {activePaymentMethods.map((meth) => (
                                  <option key={meth} value={meth} className="bg-slate-900 text-slate-100 text-xs">
                                    {meth}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Cashier Box Office Selection */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{t('cart.cashier_box', language)}</label>
                              <select
                                value={cashierId}
                                onChange={(e) => setCashierId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
                                id="checkout-cashier-id"
                              >
                                <option value="admin" className="bg-slate-900 text-slate-100">
                                  {language === 'AR' ? 'صندوق المدير الرئيسي (admin)' : 'Main Admin Box (admin)'}
                                </option>
                                <option value="cashier" className="bg-slate-900 text-slate-100">
                                  {language === 'AR' ? 'صندوق المبيعات الجاد (cashier)' : 'Main Sales Cashier (cashier)'}
                                </option>
                                <option value="telecom" className="bg-slate-900 text-slate-100">
                                  {language === 'AR' ? 'صندوق الاتصالات وباقات الفوري (telecom)' : 'Telecom Desk Box (telecom)'}
                                </option>
                                <option value="guest" className="bg-slate-900 text-slate-100">
                                  {language === 'AR' ? 'خدمة الزائر الذاتي (guest)' : 'Self-Service Terminal (guest)'}
                                </option>
                              </select>
                            </div>

                            {/* Instructions */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('cart.special_notes', language)}</label>
                              <textarea
                                value={checkoutNotes}
                                onChange={(e) => setCheckoutNotes(e.target.value)}
                                placeholder={t('cart.notes_placeholder', language)}
                                className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder-slate-705 text-white h-16 resize-none focus:outline-none"
                                id="checkout-notes"
                              />
                            </div>

                            {/* Trigger Purchase */}
                            <button
                              type="submit"
                              disabled={loading || cart.length === 0}
                              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-455 hover:to-indigo-555 text-slate-950 rounded-xl font-black tracking-wide shadow-lg transition-all animate-shimmer cursor-pointer select-none text-sm leading-none"
                              id="btn-cart-checkout-submit"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <CreditCard className="w-4 h-4 mr-1 text-slate-950 fill-transparent" />
                                <span>
                                  {loading 
                                    ? t('cart.processing', language) 
                                    : t('cart.confirm_btn', language)
                                  }
                                </span>
                              </div>
                            </button>
                        </form>
                      </>
                    )}
                  </div>

                  {/* Pricing footer summary box */}
                  {cart.length > 0 && (
                    <div className="p-5 border-t border-slate-800 bg-slate-950">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>{t('cart.base_total', language)}</span>
                          <span className="font-mono">{totalYER.toLocaleString()} YER</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>{t('cart.conversion_rate', language)}</span>
                          <span className="font-mono">1 USD = {exchangeUSD} YER</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-white border-t border-slate-850 pt-2.5 mt-1.5">
                          <span className="tracking-wide">{t('cart.grand_total', language)}</span>
                          <span className="text-xl font-mono text-emerald-400">{convertPrice(totalYER)} {getCurrencySymbol()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

            </motion.div>
          </div>

        </div>
      )}
    </AnimatePresence>
  );
}
