import { UUIDGenerator } from './uuid-generator';

export class DataTransformer {
  /**
   * Transforms item_type rows into custom shop category registries.
   */
  public static transformCategory(row: any): Record<string, any> {
    const uuid = UUIDGenerator.getOrCreate(row.id, 'categories');
    return {
      id: uuid,
      nameAR: row.name || 'قسم غير مصنف',
      nameEN: row.param1 || row.name || 'Uncategorized Category',
      icon: row.param2 || 'Folder',
      color: 'from-blue-500 to-indigo-600',
      description_ar: row.remarks || '',
      legacy_id: row.id
    };
  }

  /**
   * Transforms legacy items rows into unified shop products.
   */
  public static transformProduct(row: any, categoryNameMap: Record<number, string> = {}): Record<string, any> {
    const uuid = UUIDGenerator.getOrCreate(row.id, 'products');
    const categoryUuid = row.item_type_id ? UUIDGenerator.getOrCreate(row.item_type_id, 'categories') : 'uncategorized';
    
    // Resolve clean category label text
    const categoryLabel = categoryNameMap[row.item_type_id] || 'عام';

    // Pricing & inventory metrics
    const price = Number(row.price) || Number(row.o_cost) || 0;
    const stock = Number(row.qty) || Number(row.o_qty) || 0;

    return {
      id: uuid,
      nameAR: row.name || 'سلعة مجهولة الاسم',
      nameEN: row.param1 || row.name || 'Unnamed Product',
      descriptionAR: row.remarks || '',
      descriptionEN: row.param2 || '',
      category: categoryLabel,
      category_id: categoryUuid,
      brand: row.brand || 'عام',
      priceYER: price,
      imageUrl: row.pic || '',
      isAvailable: row.IS_ACTIVE === 1 || row.IS_ACTIVE === undefined,
      stock: stock,
      barcode: row.barcode || '',
      legacy_id: row.id
    };
  }

  /**
   * Transforms legacy customers database rows into CRM customers.
   */
  public static transformCustomer(row: any): Record<string, any> {
    const uuid = UUIDGenerator.getOrCreate(row.id, 'customers');
    return {
      id: uuid,
      customerName: row.name || 'عميل مجهول',
      customerPhone: row.gsm || '',
      address: row.ADDRESS || '',
      notes: row.remarks || '',
      totalDebtYER: 0, // dynamic aggregation or loaded separately
      updatedAt: row.date_ || new Date().toISOString(),
      legacy_id: row.id
    };
  }

  /**
   * Transforms legacy accounting trees of accounts.
   */
  public static transformAccount(row: any): Record<string, any> {
    const uuid = UUIDGenerator.getOrCreate(row.id, 'accounts');
    const parentUuid = row.parent_id ? UUIDGenerator.getOrCreate(row.parent_id, 'accounts') : null;
    return {
      id: uuid,
      name: row.name || 'حساب غير مسمى',
      parent_id: parentUuid,
      legacy_id: row.id
    };
  }

  /**
   * Transforms legacy transaction records to General Ledger standard values.
   */
  public static transformAccountingEntry(row: any): Record<string, any> {
    const uuid = UUIDGenerator.getOrCreate(row.id, 'accounting_entries');
    const customerUuid = row.cus_id ? UUIDGenerator.getOrCreate(row.cus_id, 'customers') : null;
    const orderUuid = row.bill_id ? UUIDGenerator.getOrCreate(row.bill_id, 'orders') : null;

    // Convert in/out string figures to real decimal values
    const debit = Number(row.in) || 0;
    const credit = Number(row.out) || 0;

    const parsedDate = row.date_ ? new Date(row.date_) : new Date();
    const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

    return {
      id: uuid,
      customer_id: customerUuid,
      order_id: orderUuid,
      debit: debit,
      credit: credit,
      created_at: isoDate,
      description: row.remarks || row.now_ || 'قيد مالي مرحل',
      legacy_id: row.id
    };
  }
}
