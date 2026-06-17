import { Product } from '../../../../src/types';
import { mapProductFromDB } from '../../../../src/lib/supabase';

export async function getProductsContext(storeDatabase: any, supabase: any, orgId?: string): Promise<string> {
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

    const totalCount = products.length;
    const availableCount = products.filter(p => p.isAvailable).length;
    
    // Gather distinct brands
    const brandsSet = new Set<string>();
    products.forEach(p => {
      if (p.brand) brandsSet.add(p.brand);
    });

    // Group sample products by category
    const categorizedSample: { [key: string]: any[] } = {};
    products.slice(0, 30).forEach(p => {
      const cat = p.category || 'عام';
      if (!categorizedSample[cat]) {
        categorizedSample[cat] = [];
      }
      if (categorizedSample[cat].length < 4) {
        categorizedSample[cat].push({
          id: p.id,
          name: p.nameAR || p.nameEN,
          price_yer: p.priceYER,
          brand: p.brand || 'عام',
          is_available: p.isAvailable,
          stock: p.stock
        });
      }
    });

    const contextJSON = {
      summary: {
        total_products: totalCount,
        available_products: availableCount,
        brands_available: Array.from(brandsSet)
      },
      catalog_samples: categorizedSample
    };

    return JSON.stringify(contextJSON, null, 2);
  } catch (error: any) {
    console.error('Error compiling products context:', error);
    return JSON.stringify({ error: 'Failed to compile products context: ' + error.message });
  }
}
