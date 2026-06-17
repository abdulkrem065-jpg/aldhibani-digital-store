import { Product } from '../../../../src/types';
import { mapProductFromDB } from '../../../../src/lib/supabase';

export async function getInventoryContext(storeDatabase: any, supabase: any, orgId?: string): Promise<string> {
  try {
    let products: Product[] = [];

    // Prioritize querying Supabase if connected
    if (supabase) {
      const query = supabase.from('products').select('*');
      if (orgId) {
        query.eq('org_id', orgId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(error, null, 2));
      }
      if (!error && data) {
        products = data.map(mapProductFromDB);
      }
    }

    const totalProducts = products.length;
    const physicalProducts = products.filter(p => p.stock !== undefined);
    const digitalProducts = products.filter(p => p.stock === undefined);
    
    // Low stock cutoff is 10 units
    const lowStockThreshold = 10;
    const lowStockItems = physicalProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= lowStockThreshold);
    const outOfStockItems = physicalProducts.filter(p => (p.stock || 0) === 0);
    
    // Categorization list
    const categoryCounts: { [key: string]: number } = {};
    products.forEach(p => {
      const cat = p.category || 'عام';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const contextJSON = {
      summary: {
        total_products_count: totalProducts,
        physical_products_count: physicalProducts.length,
        digital_cards_and_services_count: digitalProducts.length,
        out_of_stock_count: outOfStockItems.length,
        low_stock_count: lowStockItems.length,
        categories_count: Object.keys(categoryCounts).length
      },
      categories_distribution: categoryCounts,
      out_of_stock_sample: outOfStockItems.slice(0, 5).map(p => ({
        id: p.id,
        name: p.nameAR || p.nameEN,
        category: p.category
      })),
      low_stock_sample: lowStockItems.slice(0, 5).map(p => ({
        id: p.id,
        name: p.nameAR || p.nameEN,
        stock_remaining: p.stock,
        category: p.category
      }))
    };

    return JSON.stringify(contextJSON, null, 2);
  } catch (error: any) {
    console.error('Error compiling inventory context:', error);
    return JSON.stringify({ error: 'Failed to compile inventory context: ' + error.message });
  }
}
