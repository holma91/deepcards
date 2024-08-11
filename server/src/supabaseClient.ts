import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from './types/supabase/database.types';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or key');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
