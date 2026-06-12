export interface TableMapping {
  legacyTable: string;
  targetEntity: string;
  description: string;
  fieldMap: Record<string, string>;
}

export const SCHEMA_MAPPINGS: Record<string, TableMapping> = {
  categories: {
    legacyTable: 'item_type',
    targetEntity: 'categories',
    description: 'Maps product item types to custom categories.',
    fieldMap: {
      id: 'id',
      name: 'name_ar',
      remarks: 'description_ar'
    }
  },
  products: {
    legacyTable: 'items',
    targetEntity: 'products',
    description: 'Maps standard catalog items to products store.',
    fieldMap: {
      id: 'id',
      name: 'name_ar',
      barcode: 'barcode',
      price: 'price_yer',
      qty: 'stock',
      remarks: 'description_ar',
      item_type_id: 'category_id'
    }
  },
  customers: {
    legacyTable: 'customers',
    targetEntity: 'customers',
    description: 'Maps retail/wholesale profile customers.',
    fieldMap: {
      id: 'id',
      name: 'name',
      gsm: 'phone',
      ADDRESS: 'address',
      remarks: 'notes'
    }
  },
  orders: {
    legacyTable: 'bills',
    targetEntity: 'orders',
    description: 'Maps cash/credit bills invoices to master orders.',
    fieldMap: {
      id: 'id',
      bill_no: 'order_number',
      date_: 'created_at',
      amount: 'total_yer',
      remarks: 'notes',
      cus_id: 'customer_id'
    }
  },
  order_items: {
    legacyTable: 'bill_transactions',
    targetEntity: 'order_items',
    description: 'Maps sub-bills item lines to order items lists.',
    fieldMap: {
      bill_id: 'order_id',
      item_id: 'product_id',
      qty: 'quantity',
      sls_u_price: 'unit_price',
      cost_price: 'cost_price',
      remark: 'notes'
    }
  },
  accounts: {
    legacyTable: 'account_tree',
    targetEntity: 'accounts',
    description: 'Maps financial accounting structures.',
    fieldMap: {
      id: 'id',
      name: 'name',
      parent_id: 'parent_id'
    }
  },
  accounting_entries: {
    legacyTable: 'transactions',
    targetEntity: 'accounting_entries',
    description: 'Maps operational entries ledger rules.',
    fieldMap: {
      id: 'id',
      cus_id: 'customer_id',
      in: 'debit',
      out: 'credit',
      date_: 'created_at',
      remarks: 'description',
      bill_id: 'order_id'
    }
  }
};
