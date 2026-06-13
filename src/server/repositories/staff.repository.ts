import { BaseRepository } from './base.repository';

export class StaffRepository {
  public static async getByUsername(username: string): Promise<any | null> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .eq('username', username.trim());
      
      if (!error && data && data.length > 0) {
        return data.find((u: any) => u.username.toLowerCase() === username.trim().toLowerCase()) || data[0];
      }
    }
    return null;
  }

  public static async getById(id: string): Promise<any | null> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return data;
    }
    return null;
  }

  public static async updatePasswordHash(id: string, hash: string): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('staff_users')
        .update({ password_hash: hash, password: null })
        .eq('id', id);
      return !error;
    }
    return false;
  }

  public static async updatePermissions(id: string, permissions: any): Promise<any | null> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('staff_users')
        .update({ permissions })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (!error && data) return data;
    }
    return null;
  }

  public static async updatePasswordPlain(id: string, passwordPlain: string): Promise<any | null> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('staff_users')
        .update({ password: passwordPlain, password_hash: null })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (!error && data) return data;
    }
    return null;
  }
}
