import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zajqozgzblsbbiebwhzn.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphanFvemd6YmxzYmJpZWJ3aHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjYzOTgsImV4cCI6MjA3NzEwMjM5OH0.pTFRHKI0lP0TJlr0_3N56DvqVib79EjK9reDQ5jmIUA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
