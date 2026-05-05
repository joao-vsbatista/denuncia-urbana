import { createClient } from '@supabase/supabase-js';

// ─── Configure suas credenciais do Supabase aqui ──────────────────────────────
// Acesse: https://app.supabase.com → seu projeto → Settings → API
const SUPABASE_URL = 'https://tuhbiemrknvqnuldflbx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1aGJpZW1ya252cW51bGRmbGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5Mjk1OTQsImV4cCI6MjA5MzUwNTU5NH0.bmY7E-f5i6Cxw6AO7lEqPCiQhGn06cXDJmcsfnYxp8M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nome do bucket para fotos (crie no Supabase Storage)
export const PHOTOS_BUCKET = 'report-photos';
