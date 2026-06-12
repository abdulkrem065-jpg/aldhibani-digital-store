import { Order } from '../../../../src/types';

export async function getSalesContext(storeDatabase: any, supabase: any, orgId?: string): Promise<string> {
  try {
    let orders: Order[] = [];

    // Prioritize querying Supabase if connected
    if (supabase) {
      const query = supabase.from('orders').select('*');
      if (orgId) {
        // Multi-tenant isolation filter if orgId is given
        query.eq('org_id', orgId);
      }
      const { data, error } = await query;
      if (!error && data) {
        orders = data;
      } else {
        orders = storeDatabase.orders || [];
      }
    } else {
      orders = storeDatabase.orders || [];
    }

    // Filter by branch or org if applicable (if they are saved with identifiers)
    // Note: storeDatabase orders can be queried
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');
    const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING');
    
    // Total Sales in YER
    const totalSalesYER = completedOrders.reduce((sum, o) => sum + (o.totalYER || 0), 0);
    
    // Gather popular products from completed orders
    const productFrequency: { [key: string]: { name: string; count: number; sales: number } } = {};
    completedOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(itm => {
          if (itm.product) {
            const pId = itm.product.id;
            const name = itm.product.nameAR || itm.product.nameEN || 'صنف غير معروف';
            const qty = itm.quantity || 1;
            const subtotal = (itm.product.priceYER || 0) * qty;
            
            if (!productFrequency[pId]) {
              productFrequency[pId] = { name, count: 0, sales: 0 };
            }
            productFrequency[pId].count += qty;
            productFrequency[pId].sales += subtotal;
          }
        });
      }
    });

    const popularList = Object.values(productFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const contextJSON = {
      summary: {
        total_orders_count: totalOrders,
        completed_orders_count: completedOrders.length,
        pending_orders_count: pendingOrders.length,
        total_sales_yer: totalSalesYER,
        average_order_value_yer: completedOrders.length > 0 ? Math.round(totalSalesYER / completedOrders.length) : 0,
        exchange_rates: {
          usd: storeDatabase.config?.exchangeRateUSD || 530,
          sar: storeDatabase.config?.exchangeRateSAR || 140
        }
      },
      top_selling_products: popularList.map(p => ({
        product_name: p.name,
        quantity_sold: p.count,
        total_sales_yer: p.sales
      })),
      recent_orders: orders.slice(0, 5).map(o => ({
        order_id: o.id,
        customer: o.customerName || 'عميل نقدي',
        status: o.status,
        total_yer: o.totalYER,
        created_at: o.createdAt
      }))
    };

    return JSON.stringify(contextJSON, null, 2);
  } catch (error: any) {
    console.error('Error generating sales context:', error);
    return JSON.stringify({ error: 'Failed to compile sales context: ' + error.message });
  }
}
