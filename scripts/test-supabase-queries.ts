import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery(name: string, queryBuilder: () => any) {
  console.log(`\nTesting [${name}]...`);
  try {
    const { data, error, status } = await queryBuilder();
    if (error) {
      console.log(`❌ Error: status=${status}, code=${error.code}, message="${error.message}"`);
    } else {
      console.log(`✅ Success: status=${status}, found=${Array.isArray(data) ? data.length : 1} row(s)`);
      if (data && Array.isArray(data) && data.length > 0) {
        console.log('   Keys:', Object.keys(data[0]));
        console.log('   Sample:', JSON.stringify(data[0]).slice(0, 200));
      } else {
        console.log('   Data:', JSON.stringify(data));
      }
    }
  } catch (err: any) {
    console.log(`💥 Exception: ${err.message}`);
  }
}

async function run() {
  // Test querying system tables/views
  await testQuery('Query pg_tables', () => supabase.from('pg_tables').select('*').limit(1));
  await testQuery('Query pg_class', () => supabase.from('pg_class').select('*').limit(1));
  await testQuery('Query columns', () => supabase.from('columns').select('*').limit(1));
  await testQuery('Query schema_migrations', () => supabase.from('schema_migrations').select('*').limit(1));
  
  // Test pg_policies, pg_proc, pg_trigger directly
  await testQuery('Query pg_policies', () => supabase.from('pg_policies').select('*').limit(1));
  await testQuery('Query pg_proc', () => supabase.from('pg_proc').select('*').limit(1));
  await testQuery('Query pg_trigger', () => supabase.from('pg_trigger').select('*').limit(1));

  // Test Storage Buckets Access
  console.log('\nTesting [Storage Buckets]...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log(`❌ Error listing buckets: message="${error.message}"`);
    } else {
      console.log(`✅ Success listing buckets: found=${data?.length || 0} bucket(s)`);
      if (data && data.length > 0) {
        console.log('   Buckets:', data.map(b => b.name));
      }
    }
  } catch (err: any) {
    console.log(`💥 Exception listing buckets: ${err.message}`);
  }
  
  // Test some of our existing tables to see if we can get 1 row or see if they are empty
  await testQuery('Query store_config', () => supabase.from('store_config').select('*').limit(1));
  await testQuery('Query categories', () => supabase.from('categories').select('*').limit(1));
  await testQuery('Query products', () => supabase.from('products').select('*').limit(1));
  await testQuery('Query staff_users', () => supabase.from('staff_users').select('*').limit(1));
}

run();
