"use client";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

export default function HistoryPage() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/concessions");
      const data = await res.json();
      const list = data.concessions || [];
      const withStats = await Promise.all(
        list.map(async (c) => {
          const r = await fetch(`/api/concessions/${c.id}`);
          const d = await r.json();
          const hotspots = d.hotspots || [];
          const total = hotspots.reduce((s, h) => s + Number(h.estimasi_area), 0);
          return { ...c, jumlahHotspot: hotspots.length, totalArea: total };
        })
      );
      setRows(withStats);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-800">Riwayat Laporan</h1>
      <p className="text-sm text-slate-500 mb-5">Semua areal konsesi yang pernah dianalisis oleh perusahaan Anda.</p>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 pr-3 font-medium">No</th>
              <th className="py-2 pr-3 font-medium">Nama Konsesi</th>
              <th className="py-2 pr-3 font-medium">Jumlah Hotspot</th>
              <th className="py-2 pr-3 font-medium">Estimasi Area (ha)</th>
              <th className="py-2 pr-3 font-medium">Dibuat</th>
              <th className="py-2 pr-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows === null && <tr><td colSpan={6} className="py-6 text-center text-slate-400">Memuat...</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-400">Belum ada data.</td></tr>}
            {rows?.map((r, i) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="py-2.5 pr-3 text-slate-500">{i + 1}</td>
                <td className="py-2.5 pr-3 text-slate-700 font-medium">{r.name}</td>
                <td className="py-2.5 pr-3 text-slate-600">{r.jumlahHotspot}</td>
                <td className="py-2.5 pr-3 text-slate-700 font-medium tabular-nums">{r.totalArea.toFixed(2)}</td>
                <td className="py-2.5 pr-3 text-slate-600">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                <td className="py-2.5 pr-3"><a href={`/dashboard/concessions/${r.id}`} className="text-blue-600"><Eye size={14} /></a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
