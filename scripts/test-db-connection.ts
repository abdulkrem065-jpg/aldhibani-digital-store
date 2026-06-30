import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const candidateTables = [
  'store_config',
  'categories',
  'products',
  'orders',
  'debts',
  'staff_users',
  'banners',
  'audit_log',
  'ai_audit_logs',
  'ai_usage',
  'ai_conversations',
  'ai_messages',
  'ai_tools',
  'system_errors',
  'ai_feedback',
  'import_jobs',
  'import_job_events',
  'import_chunks',
  'import_rollbacks',
  'money_boxes',
  'youth_workforce'
];

async function run() {
  console.log('--- START DATABASE ANALYSIS ---');
  for (const table of candidateTables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table [${table}]: Status=${status}, ErrorCode=${error.code}, Message=${error.message}`);
      } else {
        console.log(`✅ Table [${table}]: Status=${status}, Found=${data.length} row(s)`);
        if (data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err: any) {
      console.log(`💥 Table [${table}]: Exception: ${err.message}`);
    }
  }
}

run();
