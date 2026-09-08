import { supabaseServer } from "./supabaseServer";
import { supabaseAdmin } from "./supabaseAdmin";

// Mengembalikan { user, companyId } dari sesi login yang sedang aktif,
// atau null jika belum login. Dipakai di setiap API route untuk memastikan
// setiap query database dibatasi ke company_id milik user tersebut.
export async function getSessionCompany() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = supabaseAdmin();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;
  return { user, companyId: profile.company_id };
}
