import { BaseRepository } from './base.repository';

export class CategoryRepository {
  public static async getAll(): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data) return data;
    }
    return [];
  }

  public static async upsert(category: any): Promise<any> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('categories').upsert(category).select();
      if (!error && data) return data[0];
    }
    return category;
  }

  public static async upsertBatch(categories: any[]): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('categories').upsert(categories).select();
      if (!error && data) return data;
    }
    return categories;
  }

  public static async delete(id: string): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      return !error;
    }
    return false;
  }

  public static async clearAll(): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('categories').delete().neq('id', 'keep-dummy');
      return !error;
    }
    return false;
  }
}
