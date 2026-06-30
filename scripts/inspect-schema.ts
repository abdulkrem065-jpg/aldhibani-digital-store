import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

async function run() {
  console.log('--- FETCHING POSTGREST OPENAPI SCHEMA ---');
  try {
    let apiEndpoint = supabaseUrl;
    if (!apiEndpoint.includes('/rest/v1')) {
      // If it ends with a slash, strip it, then append
      const baseUrl = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
      apiEndpoint = `${baseUrl}/rest/v1/`;
    }
    console.log(`Connecting to: ${apiEndpoint}`);
    
    const headers: Record<string, string> = {
      'apikey': supabaseAnonKey
    };
    
    const response = await fetch(apiEndpoint, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    const schema = await response.json() as any;
    console.log('✅ Successfully fetched OpenAPI schema!');
    console.log(`Title: ${schema.info?.title}`);
    console.log(`Version: ${schema.info?.version}`);
    
    const definitions = schema.definitions || schema.components?.schemas || {};
    const tableNames = Object.keys(definitions);
    console.log(`\nFound ${tableNames.length} tables/definitions in schema:`);
    
    for (const tableName of tableNames) {
      console.log(`\n========================================`);
      console.log(`TABLE: ${tableName}`);
      console.log(`========================================`);
      const def = definitions[tableName];
      const properties = def.properties || {};
      const required = def.required || [];
      
      console.log('Columns:');
      for (const colName of Object.keys(properties)) {
        const col = properties[colName];
        const isNullable = !required.includes(colName);
        const colType = col.type || 'unknown';
        const format = col.format ? ` (${col.format})` : '';
        const desc = col.description ? ` - ${col.description}` : '';
        const defaultValue = col.default !== undefined ? ` [Default: ${JSON.stringify(col.default)}]` : '';
        console.log(`  - ${colName}: ${colType}${format}${isNullable ? ' (nullable)' : ' (required)'}${defaultValue}${desc}`);
      }
    }
  } catch (err: any) {
    console.error(`💥 Failed to fetch schema: ${err.message}`);
  }
}

run();
