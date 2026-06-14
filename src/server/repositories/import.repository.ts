import { BaseRepository } from './base.repository';

export interface DBImportJob {
  id: string;
  organization_id: string;
  branch_id: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'rolled_back';
  progress: number;
  current_chunk: number;
  current_offset?: number | null;
  current_stage?: string | null;
  info: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  summary?: any;
  errors?: any;
  inserted_ids?: any;
}

export interface DBImportEvent {
  id?: string;
  job_id: string;
  event_type: string;
  message: string;
  created_at?: string;
}

export interface DBImportRollback {
  id?: string;
  job_id: string;
  status: 'pending' | 'rolling_back' | 'success' | 'failed';
  rolled_back_by: string;
  rolled_back_at?: string;
  error_message?: string | null;
}

export interface DBImportChunk {
  id?: string;
  job_id: string;
  chunk_number: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  record_count: number;
  processed_at?: string | null;
  error_message?: string | null;
}

export class ImportRepository {
  /**
   * Safe execution wrapper to avoid throwing crashes if a table does not exist or schema is missing.
   * Keeps track of a local backup registry on memory disk for resilient fallback.
   */
  private static localJobsBackup = new Map<string, DBImportJob>();
  private static localEventsBackup: DBImportEvent[] = [];
  private static localChunksBackup: DBImportChunk[] = [];
  private static localRollbacksBackup: DBImportRollback[] = [];

  public static async createJob(job: DBImportJob): Promise<DBImportJob> {
    const supabase = BaseRepository.getSupabase();
    const cleanJob = {
      ...job,
      created_at: job.created_at || new Date().toISOString(),
      updated_at: job.updated_at || new Date().toISOString()
    };

    this.localJobsBackup.set(job.id, cleanJob);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('import_jobs')
          .insert(cleanJob)
          .select()
          .single();

        if (error) {
          console.warn('[ImportRepository] error inserting job, fallback to local', error.message);
        } else if (data) {
          return data;
        }
      } catch (err: any) {
        console.warn('[ImportRepository] Failed to insert job schema, using local fallback:', err.message);
      }
    }
    return cleanJob;
  }

  public static async getJob(id: string): Promise<DBImportJob | null> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('import_jobs')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.warn('[ImportRepository] error query job:', error.message);
        } else if (data) {
          this.localJobsBackup.set(id, data);
          return data;
        }
      } catch (err: any) {
        console.warn('[ImportRepository] getJob database query fallback:', err.message);
      }
    }
    return this.localJobsBackup.get(id) || null;
  }

  public static async updateJob(id: string, updates: Partial<DBImportJob>): Promise<DBImportJob | null> {
    const supabase = BaseRepository.getSupabase();
    const current = this.localJobsBackup.get(id) || { id } as DBImportJob;
    const merged = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    } as DBImportJob;

    this.localJobsBackup.set(id, merged);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('import_jobs')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          console.warn('[ImportRepository] error updating job:', error.message);
        } else if (data) {
          this.localJobsBackup.set(id, data);
          return data;
        }
      } catch (err: any) {
        console.warn('[ImportRepository] updateJob database update fallback:', err.message);
      }
    }
    return merged;
  }

  public static async logEvent(event: DBImportEvent): Promise<DBImportEvent> {
    const supabase = BaseRepository.getSupabase();
    const cleanEvent = {
      ...event,
      created_at: event.created_at || new Date().toISOString()
    };
    this.localEventsBackup.push(cleanEvent);

    if (supabase) {
      try {
        await supabase.from('import_job_events').insert(cleanEvent);
      } catch (err: any) {
        console.warn('[ImportRepository] Failed to log event:', err.message);
      }
    }
    return cleanEvent;
  }

  public static async createChunk(chunk: DBImportChunk): Promise<DBImportChunk> {
    const supabase = BaseRepository.getSupabase();
    this.localChunksBackup.push(chunk);

    if (supabase) {
      try {
        await supabase.from('import_chunks').insert(chunk);
      } catch (err: any) {
        console.warn('[ImportRepository] Failed to log chunk:', err.message);
      }
    }
    return chunk;
  }

  public static async updateChunk(jobId: string, chunkNumber: number, updates: Partial<DBImportChunk>): Promise<void> {
    const supabase = BaseRepository.getSupabase();
    
    // Update local cache
    const match = this.localChunksBackup.find(c => c.job_id === jobId && c.chunk_number === chunkNumber);
    if (match) {
      Object.assign(match, updates);
    }

    if (supabase) {
      try {
        await supabase
          .from('import_chunks')
          .update(updates)
          .eq('job_id', jobId)
          .eq('chunk_number', chunkNumber);
      } catch (err: any) {
        console.warn('[ImportRepository] Failed to update chunk:', err.message);
      }
    }
  }

  public static async createRollback(rollback: DBImportRollback): Promise<DBImportRollback> {
    const supabase = BaseRepository.getSupabase();
    const cleanRollback = {
      ...rollback,
      rolled_back_at: rollback.rolled_back_at || new Date().toISOString()
    };
    this.localRollbacksBackup.push(cleanRollback);

    if (supabase) {
      try {
        await supabase.from('import_rollbacks').insert(cleanRollback);
      } catch (err: any) {
        console.warn('[ImportRepository] Failed to log rollback:', err.message);
      }
    }
    return cleanRollback;
  }

  /**
   * Fetch any jobs currently in pending or processing states to support resumed recovery.
   */
  public static async getUnfinishedJobs(): Promise<DBImportJob[]> {
    const supabase = BaseRepository.getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('import_jobs')
          .select('*')
          .in('status', ['pending', 'processing'])
          .order('created_at', { ascending: true });

        if (!error && data) {
          data.forEach((j: DBImportJob) => this.localJobsBackup.set(j.id, j));
          return data;
        }
      } catch (err: any) {
        console.warn('[ImportRepository] getUnfinishedJobs DB query failed:', err.message);
      }
    }

    return Array.from(this.localJobsBackup.values()).filter(
      j => j.status === 'pending' || j.status === 'processing'
    );
  }
}
