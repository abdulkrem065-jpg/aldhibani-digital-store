import { BaseRepository } from './base.repository';
import { mapProductToDB, mapProductFromDB } from '../../lib/supabase';

export class ProductRepository {
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

  public static async upsert(product: any): Promise<any> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('products').upsert(mapProductToDB(product)).select();
      if (error) {
        console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(error, null, 2));
      }
      if (!error && data && data.length > 0) return mapProductFromDB(data[0]);
    }
    return product;
  }

  public static async upsertBatch(products: any[]): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('products').upsert(products.map(mapProductToDB)).select();
      if (error) {
        console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(error, null, 2));
      }
      if (!error && data) return data.map(mapProductFromDB);
    }
    return products;
  }

  public static async delete(id: string): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(error, null, 2));
      }
      return !error;
    }
    return false;
  }

  public static async clearAll(): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').delete().neq('id', 'keep-dummy');
      if (error) {
        console.error('SUPABASE PRODUCTS ERROR', JSON.stringify(error, null, 2));
      }
      return !error;
    }
    return false;
  }
}
