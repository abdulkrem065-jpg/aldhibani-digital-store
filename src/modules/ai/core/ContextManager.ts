import { AssistantMode } from '../../assistant/types/assistant.types';

export class ContextManager {
  private static instance: ContextManager;
  private mode: AssistantMode = 'GENERAL';
  private listeners: Set<(mode: AssistantMode) => void> = new Set();

  private constructor() {}

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  public getMode(): AssistantMode {
    return this.mode;
  }

  public setMode(mode: AssistantMode) {
    this.mode = mode;
    this.notify();
  }

  public getModeAlertContent(m: AssistantMode): string {
    switch (m) {
      case 'BUSINESS':
        return '🔄 تم تنشيط نمط الأعمال (Business Mode) - يملك النظام الآن صلاحية قراءة السياق التشغيلي للمنتجات، الجرد والديون والمبيعات المحدثة سحابياً بشكل معزول.';
      case 'ADMIN':
        return '🛡️ تم تنشيط النمط التنفيذي (Executive Admin Mode) - مخصص لمالك المتجر والتحليل المستقبلي الذكي.';
      case 'SUPPORT':
        return '💬 تم تنشيط نمط الدعم الفني المباشر (Customer Support Mode) - مخصص لأسئلة تفعيل الباقات، حلول المشاكل وطرق تحويل المبالغ.';
      default:
        return '🌐 تم التبديل إلى النمط العام (General Mode) - للمحادثات والاستفسارات العامة دون سياق الحسابات الداخلي.';
    }
  }

  public subscribe(listener: (mode: AssistantMode) => void): () => void {
    this.listeners.add(listener);
    // Emit initial value on subscribe
    listener(this.mode);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.mode));
  }
}
