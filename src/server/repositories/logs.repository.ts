import { BaseRepository } from './base.repository';

export class LogsRepository {
  public static async insertAuditLog(action: string, operator: string, payload: any): Promise<boolean> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('audit_log').insert({
          action,
          operator,
          payload,
          timestamp: new Date().toISOString()
        });
        return !error;
      } catch (err) {
        console.warn('[LogsRepository] audit_log insert failed silently:', err);
      }
    }
    return false;
  }
}
