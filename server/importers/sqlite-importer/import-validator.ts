export interface ValidationError {
  severity: 'error' | 'warning';
  entity: string;
  message: string;
  key?: string;
  legacyId?: number | string;
}

export interface ValidationReport {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  errors: ValidationError[];
}

export class ImportValidator {
  /**
   * Run structural pre-flight checks on parsed legacy arrays.
   */
  public static validate(payload: {
    categories: any[];
    products: any[];
    customers: any[];
    orders: any[];
    accounts: any[];
    accountingEntries: any[];
  }): ValidationReport {
    const errors: ValidationError[] = [];

    const { categories, products, customers, orders, accounts, accountingEntries } = payload;

    // 1. Categories Validation
    const categoryIds = new Set<string>();
    categories.forEach(cat => {
      if (!cat.id || cat.id === '') {
        errors.push({ severity: 'error', entity: 'categories', message: 'مجموعة الفئات تحتوي على معرف مفقود أو فارغ', legacyId: cat.legacy_id });
      } else {
        categoryIds.add(cat.id);
      }
      if (!cat.nameAR || cat.nameAR.trim() === '') {
        errors.push({ severity: 'warning', entity: 'categories', message: `الفئة ذات الرقم المرجعي ${cat.legacy_id} تفتقر لاسم عربي`, legacyId: cat.legacy_id });
      }
    });

    // 2. Products Validation
    const productBarcodes = new Set<string>();
    const productNameARs = new Set<string>();
    products.forEach(p => {
      if (!p.id) {
        errors.push({ severity: 'error', entity: 'products', message: 'تم العثور على منتج بمعرّف مفقود', legacyId: p.legacy_id });
      }
      if (!p.nameAR || p.nameAR.trim() === '') {
        errors.push({ severity: 'error', entity: 'products', message: `المنتج ذو المعرف رقم ${p.legacy_id} لا يحتوي على اسم عربي`, legacyId: p.legacy_id });
      } else {
        if (productNameARs.has(p.nameAR.trim())) {
          errors.push({ severity: 'warning', entity: 'products', message: `تكرار في الاسم العربي للمنتج: "${p.nameAR}"`, key: p.nameAR, legacyId: p.legacy_id });
        }
        productNameARs.add(p.nameAR.trim());
      }

      // Barcode collision
      if (p.barcode && p.barcode.trim() !== '') {
        if (productBarcodes.has(p.barcode.trim())) {
          errors.push({ severity: 'warning', entity: 'products', message: `تكرار في رمز الباركود للمنتج: "${p.barcode}"`, key: p.barcode, legacyId: p.legacy_id });
        }
        productBarcodes.add(p.barcode.trim());
      }

      // Check category reference exists
      if (p.category_id && !categoryIds.has(p.category_id)) {
        errors.push({ severity: 'warning', entity: 'products', message: `المنتج "${p.nameAR}" يشير إلى فئة غير موجودة رقم: ${p.legacy_id}`, key: p.category_id, legacyId: p.legacy_id });
      }
    });

    // 3. Customers Validation
    const customerPhones = new Set<string>();
    const customerNames = new Set<string>();
    customers.forEach(cust => {
      if (!cust.customerName || cust.customerName.trim() === '') {
        errors.push({ severity: 'error', entity: 'customers', message: `العميل ذو المعرف ${cust.legacy_id} لا يحتوي على اسم`, legacyId: cust.legacy_id });
      } else {
        if (customerNames.has(cust.customerName.trim())) {
          errors.push({ severity: 'warning', entity: 'customers', message: `تكرار اسم العميل: "${cust.customerName}" في كشوفات وسجلات البيانات`, legacyId: cust.legacy_id });
        }
        customerNames.add(cust.customerName.trim());
      }

      if (cust.customerPhone && cust.customerPhone.trim() !== '') {
        const cleanPhone = cust.customerPhone.trim();
        if (customerPhones.has(cleanPhone)) {
          errors.push({ severity: 'warning', entity: 'customers', message: `تكرار رقم الهاتف للعميل "${cust.customerName}": ${cust.customerPhone}`, key: cleanPhone, legacyId: cust.legacy_id });
        }
        customerPhones.add(cleanPhone);
      }
    });

    // 4. Orders & Invoices Validation
    const customerUuidSet = new Set(customers.map(c => c.id));
    orders.forEach(order => {
      if (!order.id) {
        errors.push({ severity: 'error', entity: 'orders', message: 'تم العثور على فاتورة مجهولة الهوية ومفقودة المعرّف', legacyId: order.legacy_id });
      }
      if (order.customer_id && !customerUuidSet.has(order.customer_id)) {
        errors.push({ severity: 'warning', entity: 'orders', message: `الفاتورة "${order.order_number}" مرتبطة بعميل غير معروف بالرقم: ${order.customer_id}`, legacyId: order.legacy_id });
      }
      if (!order.items_json || order.items_json.length === 0) {
        errors.push({ severity: 'warning', entity: 'orders', message: `الفاتورة "${order.order_number}" خالية وبدون بنود مضافة`, legacyId: order.legacy_id });
      }
    });

    const totalErrors = errors.filter(e => e.severity === 'error').length;
    const totalWarnings = errors.filter(e => e.severity === 'warning').length;

    return {
      isValid: totalErrors === 0,
      totalErrors,
      totalWarnings,
      errors
    };
  }
}
