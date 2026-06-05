/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, Gamepad2, Apple, ChevronLeft, Laptop, Flame, 
  CheckCircle2, ShoppingBag, Radio, Cpu, Layers, Star 
} from 'lucide-react';
import { ProductCategory, Language, CustomCategory } from '../types';

interface SectionsProps {
  language: Language;
  onCategorySelect: (category: ProductCategory | 'ALL') => void;
  activeCategory: ProductCategory | 'ALL';
  onBrandSelect: (brand: string | 'ALL') => void;
  activeBrand: string | 'ALL';
  categories?: CustomCategory[];
}

export default function Sections({
  language,
  onCategorySelect,
  activeCategory,
  onBrandSelect,
  activeBrand,
  categories
}: SectionsProps) {
  
  // Helper to determine icon based on string
  const getIconElement = (iconName: string | undefined, colorClass: string) => {
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className={`w-5 h-5 ${colorClass}`} />;
      case 'Gamepad2':
        return <Gamepad2 className={`w-5 h-5 ${colorClass}`} />;
      case 'Apple':
        return <Apple className={`w-5 h-5 ${colorClass}`} />;
      case 'Laptop':
        return <Laptop className={`w-5 h-5 ${colorClass}`} />;
      default:
        if (iconName && iconName.length <= 3) {
          // It's probably an emoji!
          return <span className="text-xl inline-block leading-none">{iconName}</span>;
        }
        return <Layers className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  const getGradientAndBorder = (id: string) => {
    switch (id) {
      case 'DIGITAL_RECHARGE':
        return { color: 'from-slate-900 to-amber-950/20', borderColor: 'border-slate-800 hover:border-amber-500/50', textColor: 'text-amber-400' };
      case 'DIGITAL_GAME':
        return { color: 'from-slate-900 to-indigo-950/20', borderColor: 'border-slate-800 hover:border-indigo-500/50', textColor: 'text-indigo-400' };
      case 'PHYSICAL_GROCERY':
        return { color: 'from-slate-900 to-emerald-950/20', borderColor: 'border-slate-800 hover:border-emerald-500/50', textColor: 'text-emerald-400' };
      case 'PHYSICAL_ELECTRONICS':
        return { color: 'from-slate-900 to-pink-950/20', borderColor: 'border-slate-800 hover:border-pink-500/50', textColor: 'text-pink-400' };
      default:
        return { color: 'from-slate-900 to-amber-950/10', borderColor: 'border-slate-800 hover:border-cyan-500/50', textColor: 'text-cyan-400' };
    }
  };

  // List of high-level sections
  const mainCategories = [
    {
      id: 'ALL',
      nameAR: 'الكل • المعرض العام',
      nameEN: 'All Products Hub',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      color: 'from-slate-800 to-slate-950',
      borderColor: 'border-slate-800 hover:border-cyan-500/50'
    },
    ...(categories && categories.length > 0
      ? categories.map(c => {
          const style = getGradientAndBorder(c.id);
          return {
            id: c.id,
            nameAR: c.nameAR,
            nameEN: c.nameEN,
            icon: getIconElement(c.icon, style.textColor),
            color: c.color || style.color,
            borderColor: style.borderColor
          };
        })
      : [
          {
            id: 'DIGITAL_RECHARGE',
            nameAR: 'فوري رصيد وباقات اتصالات',
            nameEN: 'Digital Recharges & Bundles',
            icon: <Smartphone className="w-5 h-5 text-amber-400" />,
            color: 'from-slate-900 to-amber-950/20',
            borderColor: 'border-slate-800 hover:border-amber-500/50'
          },
          {
            id: 'DIGITAL_GAME',
            nameAR: 'كروت ألعاب إلكترونية وشحن',
            nameEN: 'Cyber Play & Gaming Cards',
            icon: <Gamepad2 className="w-5 h-5 text-indigo-400" />,
            color: 'from-slate-900 to-indigo-950/20',
            borderColor: 'border-slate-800 hover:border-indigo-500/50'
          },
          {
            id: 'PHYSICAL_GROCERY',
            nameAR: 'تموين ومواد حضرمية وعسل',
            nameEN: 'Gourmet Yemeni Groceries',
            icon: <Apple className="w-5 h-5 text-emerald-400" />,
            color: 'from-slate-900 to-emerald-950/20',
            borderColor: 'border-slate-800 hover:border-emerald-500/50'
          },
          {
            id: 'PHYSICAL_ELECTRONICS',
            nameAR: 'أجهزة ذكية وإلكترونيات فخمة',
            nameEN: 'Premium Smart Devices',
            icon: <Laptop className="w-5 h-5 text-pink-400" />,
            color: 'from-slate-900 to-pink-950/20',
            borderColor: 'border-slate-800 hover:border-pink-500/50'
          }
        ]
    )
  ];

  // List of local telecom providers & gaming platforms
  const localBrands = [
    { id: 'Yemen Mobile', label: 'يمن موبايل 4G', logo: '🔴', bg: 'hover:bg-red-950/50 hover:border-red-500' },
    { id: 'Sabafon', label: 'سبأفون', logo: '🔵', bg: 'hover:bg-blue-950/50 hover:border-blue-500' },
    { id: 'YOU', label: 'يو YOU لخدمات الاتصال', logo: '🟡', bg: 'hover:bg-yellow-950/50 hover:border-yellow-500' },
    { id: 'Y', label: 'واي Y للاتصالات', logo: '🟢', bg: 'hover:bg-green-950/50 hover:border-green-500' },
    { id: 'PUBG', label: 'ببجي PUBG - UC', logo: '🔫', bg: 'hover:bg-amber-950/50 hover:border-amber-500' },
    { id: 'Free Fire', label: 'فري فاير FF', logo: '🔥', bg: 'hover:bg-orange-950/50 hover:border-orange-500' },
  ];

  const handleCategoryClick = (catId: string) => {
    onCategorySelect(catId as ProductCategory | 'ALL');
    onBrandSelect('ALL'); // Reset brand filters when category jumps
  };

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* SECTION CARD Bento Row */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-cyan-400 fill-cyan-400" />
              {language === 'AR' ? 'مصفوفة الأقسام الرئيسية للمتجر' : 'Main Hypermarket Sections Grid'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'AR' ? 'انقر للتنقل السلس وتصنيف المنتجات الهجينة بجودة وحصر دقيق' : 'Interactive category switches for instant digital and tangible filterings'}
            </p>
          </div>
          <span className="text-[10px] text-slate-450 bg-slate-950 border border-slate-850 px-2 rounded-lg font-mono tracking-widest uppercase">
            STABLE CATEGORY ENGINE
          </span>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5" id="bento-category-grid">
          {mainCategories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategoryClick(cat.id)}
                className={`text-right md:text-left p-4.5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between h-28 cursor-pointer shadow-lg ${
                  isSelected 
                    ? 'bg-gradient-to-br from-cyan-950 to-slate-900 border-cyan-500 text-white shadow-cyan-950/50 ring-1 ring-cyan-500/30' 
                    : `bg-gradient-to-br ${cat.color} ${cat.borderColor} text-slate-400`
                }`}
                id={`btn-category-${cat.id}`}
              >
                {/* Background Spark */}
                {isSelected && (
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
                )}
                
                {/* Icon wrapper */}
                <div className={`p-2 w-fit rounded-xl ${isSelected ? 'bg-cyan-500/15' : 'bg-slate-950'}`}>
                  {cat.icon}
                </div>

                {/* Text identifier */}
                <div className="mt-2.5">
                  <span className="block text-xs font-black tracking-wide leading-snug text-slate-200">
                    {language === 'AR' ? cat.nameAR : cat.nameEN}
                  </span>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider mt-0.5">
                    {cat.id === 'ALL' ? (language === 'AR' ? 'كل المنتجات جرد تام' : 'Full Warehouse') : cat.id}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* SUB-SECTION BRAND BADGES (شحن الرصيد والاتصالات وباقات الألعاب) */}
      {(activeCategory === 'ALL' || activeCategory === 'DIGITAL_RECHARGE' || activeCategory === 'DIGITAL_GAME') && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-slate-850 pt-5 mt-2"
        >
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-1.5 uppercase">
              <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
              {language === 'AR' ? 'تخصيص مشغلي الاتصالات والألعاب الإلكترونية:' : 'Network Operators & Cyber Gateways:'}
            </span>
            {activeBrand !== 'ALL' && (
              <button
                onClick={() => onBrandSelect('ALL')}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                id="reset-brand-filter"
              >
                {language === 'AR' ? 'إعادة التعيين للكل' : 'Reset to All'}
              </button>
            )}
          </div>

          {/* Operator Row Grid */}
          <div className="flex flex-wrap gap-2.5" id="brand-operator-grid">
            {localBrands.map((brand) => {
              const isSelected = activeBrand === brand.id;
              return (
                <button
                  key={brand.id}
                  onClick={() => onBrandSelect(brand.id)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950 to-indigo-950 border-cyan-400 text-white shadow-xl ring-1 ring-cyan-500/20'
                      : `bg-slate-950 border-slate-850 text-slate-400 ${brand.bg}`
                  }`}
                  id={`brand-tag-${brand.id.replace(' ', '-')}`}
                >
                  <span className="text-sm shadow-inner">{brand.logo}</span>
                  <span>{brand.label}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

    </div>
  );
}
