import { Order, DebtRecord } from '../../../../src/types';

export async function getFinanceContext(storeDatabase: any, supabase: any, orgId?: string): Promise<string> {
  try {
    let orders: Order[] = [];
    let debts: DebtRecord[] = [];

    // Prioritize querying Supabase if connected
    if (supabase) {
      const ordersQuery = supabase.from('orders').select('*');
      const debtsQuery = supabase.from('debts').select('*');
      
      if (orgId) {
        ordersQuery.eq('org_id', orgId);
        debtsQuery.eq('org_id', orgId);
      }

      const [ordersRes, debtsRes] = await Promise.all([ordersQuery, debtsQuery]);
      
      if (!ordersRes.error && ordersRes.data) orders = ordersRes.data;
      else orders = storeDatabase.orders || [];

      if (!debtsRes.error && debtsRes.data) debts = debtsRes.data;
      else debts = storeDatabase.debts || [];
    } else {
      orders = storeDatabase.orders || [];
      debts = storeDatabase.debts || [];
    }

    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const totalCashSalesYER = completedOrders.reduce((sum, o) => sum + (o.totalYER || 0), 0);
    const totalOutstandingDebtYER = debts.reduce((sum, d) => sum + (d.totalDebtYER || 0), 0);

    // Group sales by payment method
    const salesByPaymentMethod: { [key: string]: number } = {};
    completedOrders.forEach(o => {
      const method = o.paymentMethod || 'نقدي (كاشير)';
      salesByPaymentMethod[method] = (salesByPaymentMethod[method] || 0) + o.totalYER;
    });

    const config = storeDatabase.config || {};

    const contextJSON = {
      summary: {
        total_cash_sales_yer: totalCashSalesYER,
        total_outstanding_debt_yer: totalOutstandingDebtYER,
        net_liquid_plus_liabilities_yer: totalCashSalesYER + totalOutstandingDebtYER,
        exchange_rates: {
          usd_to_yer: config.exchangeRateUSD || 530,
          sar_to_yer: config.exchangeRateSAR || 140
        }
      },
      sales_by_payment_channel: salesByPaymentMethod,
      operating_metrics: {
        completed_orders_count: completedOrders.length,
        average_basket_size_yer: completedOrders.length > 0 ? Math.round(totalCashSalesYER / completedOrders.length) : 0,
        unrealized_debt_percentage: totalCashSalesYER + totalOutstandingDebtYER > 0 
          ? Math.round((totalOutstandingDebtYER / (totalCashSalesYER + totalOutstandingDebtYER)) * 100)
          : 0
      }
    };

    return JSON.stringify(contextJSON, null, 2);
  } catch (error: any) {
    console.error('Error compiling finance context:', error);
    return JSON.stringify({ error: 'Failed to compile finance context: ' + error.message });
  }
}
