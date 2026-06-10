import { Language } from '../types';
import arTranslations from '../locales/ar.json';
import enTranslations from '../locales/en.json';

export type TranslationDictionary = typeof arTranslations;

export const translations: Record<Language, any> = {
  AR: arTranslations,
  EN: enTranslations
};

/**
 * Retrieves a translated string based on dot-separated keys.
 * Supports fallback to key and variable interpolation like {{param}}.
 * 
 * Example usage:
 * t('cart.title', 'AR') -> "سلة المشتريات المدمجة"
 * t('product.stock_left', 'AR', { stock: 5 }) -> "متبقي 5 قطعة"
 */
export function t(
  path: string, 
  language: Language, 
  replacements?: Record<string, string | number>
): string {
  const dict = translations[language] || translations['AR'];
  const keys = path.split('.');
  
  let val: any = dict;
  for (const key of keys) {
    if (val && typeof val === 'object' && key in val) {
      val = val[key];
    } else {
      val = undefined;
      break;
    }
  }

  // If translation not found, fallback to English dict, then to the path itself
  if (val === undefined) {
    const enDict = translations['EN'];
    let enVal: any = enDict;
    for (const key of keys) {
      if (enVal && typeof enVal === 'object' && key in enVal) {
        enVal = enVal[key];
      } else {
        enVal = undefined;
        break;
      }
    }
    val = enVal !== undefined ? enVal : path;
  }

  if (typeof val !== 'string') {
    return path;
  }

  // Handle replacements
  if (replacements) {
    let replacedStr = val;
    Object.entries(replacements).forEach(([k, v]) => {
      replacedStr = replacedStr.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
    return replacedStr;
  }

  return val;
}
