import { BaseRepository } from './base.repository';

export class CustomerRepository {
  public static async getAll(): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('debts').select('*');
      if (!error && data) return data;
    }
    return [];
  }

  public static async upsert(debt: any): Promise<any> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('debts').upsert(debt).select();
      if (!error && data) return data[0];
    }
    return debt;
  }

  public static async upsertBatch(debts: any[]): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('debts').upsert(debts).select();
      if (!error && data) return data;
    }
    return debts;
  }

  public static async delete(id: string): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      return !error;
    }
    return false;
  }

  public static async clearAll(): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('debts').delete().neq('id', 'keep-dummy');
      return !error;
    }
    return false;
  }
}
