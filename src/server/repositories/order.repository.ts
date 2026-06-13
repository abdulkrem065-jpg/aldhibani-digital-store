import { BaseRepository } from './base.repository';

export class OrderRepository {
  public static async getAll(): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error && data) return data;
    }
    return [];
  }

  public static async upsert(order: any): Promise<any> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('orders').upsert(order).select();
      if (!error && data) return data[0];
    }
    return order;
  }

  public static async upsertBatch(orders: any[]): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('orders').upsert(orders).select();
      if (!error && data) return data;
    }
    return orders;
  }

  public static async delete(id: string): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      return !error;
    }
    return false;
  }

  public static async clearAll(): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('orders').delete().neq('id', 'keep-dummy');
      return !error;
    }
    return false;
  }
}
