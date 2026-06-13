import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let serverSupabase: any = null;

export class BaseRepository {
  /**
   * Safe getter for Supabase client.
   * If not initialized, connects using VITE_SUPABASE_URL or SUPABASE_URL.
   */
  public static getSupabase(): any {
    if (serverSupabase) return serverSupabase;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (
      supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' &&
      supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE'
    ) {
      try {
        serverSupabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('⚡ BaseRepository: Supabase client initialized.');
      } catch (err) {
        console.error('⚡ BaseRepository: Failed to init Supabase client:', err);
      }
    }
    return serverSupabase;
  }
}
