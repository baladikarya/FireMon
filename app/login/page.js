"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { Flame } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email atau password salah.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
            <Flame size={18} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 leading-tight">FireMon</div>
            <div className="text-xs text-slate-400 leading-tight">Estimasi Area Terbakar</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <button disabled={loading} className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4 text-center">
          Belum punya akun? <a href="/signup" className="text-blue-600 font-medium">Daftar perusahaan baru</a>
        </p>
      </div>
    </div>
  );
}
