"use client";
import { usePathname, useRouter } from "next/navigation";
import { Flame, Home, History, Settings, LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const items = [
    { href: "/dashboard", label: "Beranda", icon: Home },
    { href: "/dashboard/history", label: "Riwayat Laporan", icon: History },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      <div className="w-56 shrink-0 bg-slate-900 text-slate-300 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Flame size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold leading-tight text-sm">FireMon</div>
            <div className="text-[11px] text-slate-400 leading-tight">Estimasi Area Terbakar</div>
          </div>
        </div>
        <nav className="flex-1 px-3 mt-2 space-y-1">
          {items.map((it) => {
            const active = it.href === "/dashboard" ? pathname === "/dashboard" || pathname.startsWith("/dashboard/concessions") : pathname.startsWith(it.href);
            return (
              <a
                key={it.href}
                href={it.href}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <it.icon size={16} />
                {it.label}
              </a>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="mx-3 mb-4 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 text-slate-300">
          <LogOut size={16} /> Keluar
        </button>
      </div>
      <div className="flex-1 bg-slate-50 overflow-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
