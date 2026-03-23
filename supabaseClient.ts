
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqgwmlbanxgoljvnrmxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZ3dtbGJhbnhnb2xqdm5ybXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzAzODksImV4cCI6MjA4Njc0NjM4OX0.2UFmeU-_X8xB_aCjCbKKkwvd_3VXaL6abghRA5AU3Tk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
