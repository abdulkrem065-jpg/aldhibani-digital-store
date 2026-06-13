import { BaseRepository } from './base.repository';

export class ProductRepository {
  public static async getAll(): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data) return data;
    }
    return [];
  }

  public static async upsert(product: any): Promise<any> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('products').upsert(product).select();
      if (!error && data) return data[0];
    }
    return product;
  }

  public static async upsertBatch(products: any[]): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('products').upsert(products).select();
      if (!error && data) return data;
    }
    return products;
  }

  public static async delete(id: string): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    }
    return false;
  }

  public static async clearAll(): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').delete().neq('id', 'keep-dummy');
      return !error;
    }
    return false;
  }
}
