import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function SettingsPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("email, company_id, companies(name)").eq("id", user.id).single();

  return (
    <div className="max-w-md bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-800 mb-4">Pengaturan</h2>
      <div className="space-y-3 text-sm">
        <div><span className="text-slate-400">Perusahaan</span><div className="font-medium text-slate-700">{profile?.companies?.name}</div></div>
        <div><span className="text-slate-400">Email</span><div className="font-medium text-slate-700">{profile?.email}</div></div>
      </div>
      <p className="text-xs text-slate-400 mt-4">Pengaturan jadwal pengambilan data, notifikasi, dan anggota tim akan tersedia di sini.</p>
    </div>
  );
}
