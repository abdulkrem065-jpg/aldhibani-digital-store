import { BaseRepository } from './base.repository';
import { mapProductFromDB } from '../../lib/supabase';

export class ProductRepository {
  /**
   * ProductRepository is strictly READ-ONLY.
   * All product writes must go through the server-side WriteGateway or corresponding API routes.
   */
  public static async getAll(): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(error, null, 2));
      }
      if (!error && data) return data.map(mapProductFromDB);
    }
    return [];
  }
}
