import dotenv from 'dotenv';
dotenv.config();

console.log('--- AVAILABLE ENVIRONMENT VARIABLE KEYS ---');
Object.keys(process.env).forEach(key => {
  if (
    key.includes('SUPABASE') ||
    key.includes('DATABASE') ||
    key.includes('POSTGRES') ||
    key.includes('SQL') ||
    key.includes('KEY') ||
    key.includes('SECRET') ||
    key.includes('URL') ||
    key.includes('PORT')
  ) {
    const value = process.env[key];
    const length = value ? value.length : 0;
    const preview = value ? value.substring(0, 15) + '...' : 'undefined';
    console.log(`- 🔑 ${key}: Length=${length}, Preview=${preview}`);
  }
});
