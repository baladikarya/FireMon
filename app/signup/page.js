"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { Flame } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mendaftar.");

      const supabase = supabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
            <div className="text-xs text-slate-400 leading-tight">Daftar akun perusahaan baru</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-slate-600">Nama Perusahaan</label>
            <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="PT ABC" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="operator@perusahaan.com" />
          </div>
          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Minimal 6 karakter" />
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <button disabled={loading} className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4 text-center">
          Sudah punya akun? <a href="/login" className="text-blue-600 font-medium">Masuk</a>
        </p>
      </div>
    </div>
  );
}
