import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzdldrzlhtprdwbvepuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZGxkcnpsaHRwcmR3YnZlcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTUxNzQsImV4cCI6MjA3NTI3MTE3NH0.AcqwX7FuJz4lx9gRKFt_sWhTbUKFZQdvQ5QGyjH-xf8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);