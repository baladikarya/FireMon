import { createClient } from "@supabase/supabase-js";

// PENTING: file ini hanya boleh diimpor dari kode yang berjalan di server
// (app/api/**/route.js). Jangan pernah import ini dari komponen client atau
// mengirim SUPABASE_SERVICE_ROLE_KEY ke browser.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
