import { BaseRepository } from './base.repository';

export class SettingsRepository {
  public static async getConfig(): Promise<any | null> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('store_config').select('*').limit(1).maybeSingle();
      if (!error && data) return data;
    }
    return null;
  }

  public static async saveConfig(config: any): Promise<any> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('store_config').upsert({ id: 'single-row', ...config }).select();
      if (!error && data) return data[0];
    }
    return config;
  }

  public static async getBanners(): Promise<any[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('banners').select('*');
      if (!error && data) return data;
    }
    return [];
  }

  public static async upsertBanner(banner: any): Promise<any> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('banners').upsert(banner).select();
      if (!error && data) return data[0];
    }
    return banner;
  }

  public static async deleteBanner(id: string): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      return !error;
    }
    return false;
  }
}
