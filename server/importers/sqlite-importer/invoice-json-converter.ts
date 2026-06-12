import { UUIDGenerator } from './uuid-generator';

export interface LegacyBill {
  id: number | string;
  date_?: string;
  remarks?: string;
  bill_no?: string;
  amount?: number;
  cus_id?: number;
  user_id?: number;
  paymentMethod?: string;
}

export interface LegacyBillTransaction {
  bill_id: number | string;
  item_id: number | string;
  qty: number;
  sls_u_price: number;
  cost_price?: number;
  remark?: string;
}

export interface TransformedOrderItem {
  product_id: string;
  qty: number;
  price: number;
  cost_price?: number;
  notes?: string;
}

export interface TransformedOrder {
  id: string;
  order_number: string;
  total_yer: number;
  notes: string;
  customer_id: string | null;
  created_at: string;
  items_json: TransformedOrderItem[]; // JSONB column value representation
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
}

export class InvoiceJsonConverter {
  /**
   * Compiles flat bill headers and child rows into modern nested structures.
   */
  public static compile(
    bill: LegacyBill,
    transactions: LegacyBillTransaction[],
    productNamesMap: Record<string, string> = {}
  ): TransformedOrder {
    const orderUuid = UUIDGenerator.getOrCreate(bill.id, 'orders');
    const customerUuid = bill.cus_id ? UUIDGenerator.getOrCreate(bill.cus_id, 'customers') : null;

    // Filter relevant transactions for this invoice
    const billTransactions = transactions.filter(t => String(t.bill_id) === String(bill.id));

    // Map children lines into compact JSONB fields
    const itemsJson: TransformedOrderItem[] = billTransactions.map(tx => {
      const productUuid = UUIDGenerator.getOrCreate(tx.item_id, 'products');
      return {
        product_id: productUuid,
        qty: tx.qty || 1,
        price: tx.sls_u_price || 0,
        cost_price: tx.cost_price || 0,
        notes: tx.remark || ''
      };
    });

    const parsedDate = bill.date_ ? new Date(bill.date_) : new Date();
    const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

    return {
      id: orderUuid,
      order_number: bill.bill_no || `OLD-INV-${bill.id}`,
      total_yer: bill.amount || 0,
      notes: bill.remarks || '',
      customer_id: customerUuid,
      created_at: isoDate,
      items_json: itemsJson,
      status: 'COMPLETED' // Default history migration is settled completed
    };
  }

  /**
   * Batch compiles bills and transactions fast.
   */
  public static compileBatch(
    bills: LegacyBill[],
    transactions: LegacyBillTransaction[]
  ): TransformedOrder[] {
    const transactionByBillId: Record<string, LegacyBillTransaction[]> = {};
    for (const tx of transactions) {
      const bid = String(tx.bill_id);
      if (!transactionByBillId[bid]) {
        transactionByBillId[bid] = [];
      }
      transactionByBillId[bid].push(tx);
    }

    return bills.map(bill => {
      const txs = transactionByBillId[String(bill.id)] || [];
      return this.compile(bill, txs);
    });
  }
}
