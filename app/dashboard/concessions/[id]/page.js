"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Flame, Satellite, CheckCircle2, RefreshCw, Loader2, Search, Eye,
  ChevronLeft, ChevronRight, Download, FileSpreadsheet, BarChart3, Table as TableIcon, Map as MapIcon, FileText,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function project(lon, lat, bbox, size = 400, pad = 24) {
  const w = size - pad * 2, h = size - pad * 2;
  const lonSpan = bbox.maxLon - bbox.minLon || 0.001;
  const latSpan = bbox.maxLat - bbox.minLat || 0.001;
  const x = pad + ((lon - bbox.minLon) / lonSpan) * w;
  const y = pad + (1 - (lat - bbox.minLat) / latSpan) * h;
  return [x, y];
}

function MiniMap({ coords, bbox, hotspots, selectedId, onSelect, size = 400 }) {
  const poly = coords.map(([lon, lat]) => project(lon, lat, bbox, size).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full rounded-lg bg-emerald-950">
      <rect width={size} height={size} fill="#052e16" />
      <polygon points={poly} fill="#14532d" fillOpacity="0.55" stroke="#4ade80" strokeWidth="1.5" />
      {hotspots.map((h) => {
        const [x, y] = project(h.lon, h.lat, bbox, size);
        const isSel = h.id === selectedId;
        const color = h.status === "Anomali/Bukan Api" ? "#facc15" : h.instrument === "MODIS" ? "#fb923c" : "#ef4444";
        return (
          <circle key={h.id} cx={x} cy={y} r={isSel ? 7 : 4.5} fill={color} fillOpacity={isSel ? 1 : 0.85}
            stroke={isSel ? "#fff" : "none"} strokeWidth={isSel ? 2 : 0} className="cursor-pointer"
            onClick={() => onSelect && onSelect(h.id)} />
        );
      })}
    </svg>
  );
}

function StatCard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
      <div>
        <div className="text-2xl font-semibold text-slate-800 tabular-nums">{value}</div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function TopTabs({ tab, setTab }) {
  const tabs = [
    { key: "summary", label: "Ringkasan", icon: BarChart3 },
    { key: "detail", label: "Detail Data", icon: TableIcon },
    { key: "map", label: "Peta Interaktif", icon: MapIcon },
    { key: "report", label: "Laporan", icon: FileText },
  ];
  return (
    <div className="flex items-center gap-1 mb-6 border-b border-slate-200">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => setTab(t.key)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px ${tab === t.key ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
          <t.icon size={15} />{t.label}
        </button>
      ))}
    </div>
  );
}

function toCSV(concession, hotspots) {
  const header = ["No","Tanggal","Jam","Lat","Lon","Satelit","Sensor","FRP(MW)","Confidence","Brightness","BrightT31","DayNight","Status","EstimasiArea(ha)"];
  const rows = hotspots.map((h, i) => [i+1, h.acq_date, h.acq_time, h.lat, h.lon, h.satellite, h.instrument, h.frp, h.confidence, h.brightness, h.bright_t31, h.daynight, h.status, Number(h.estimasi_area).toFixed(2)]);
  const total = hotspots.reduce((s, h) => s + Number(h.estimasi_area), 0);
  const lines = [
    `Laporan Estimasi Area Terbakar - ${concession.name}`,
    `Luas Konsesi (ha):,${Number(concession.area_ha).toFixed(2)}`,
    `Jumlah Hotspot:,${hotspots.length}`,
    `Total Estimasi Area Terbakar (ha):,${total.toFixed(2)}`,
    "", header.join(","), ...rows.map((r) => r.join(",")),
  ];
  return lines.join("\n");
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function ConcessionDetailPage() {
  const { id } = useParams();
  const [concession, setConcession] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [tab, setTab] = useState("summary");
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  async function load() {
    const res = await fetch(`/api/concessions/${id}`);
    const data = await res.json();
    setConcession(data.concession);
    setHotspots(data.hotspots || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  async function handleFetchLatest() {
    setFetching(true);
    await fetch(`/api/concessions/${id}/fetch`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayRange: 1 }),
    });
    await load();
    setFetching(false);
  }

  if (loading) return <div className="text-sm text-slate-400">Memuat data konsesi...</div>;
  if (!concession) return <div className="text-sm text-red-500">Konsesi tidak ditemukan.</div>;

  const totalArea = hotspots.reduce((s, h) => s + Number(h.estimasi_area), 0);
  const modisArea = hotspots.filter((h) => h.instrument === "MODIS").reduce((s, h) => s + Number(h.estimasi_area), 0);
  const viirsArea = hotspots.filter((h) => h.instrument === "VIIRS").reduce((s, h) => s + Number(h.estimasi_area), 0);
  const pieData = [{ name: "VIIRS", value: +viirsArea.toFixed(2) }, { name: "MODIS", value: +modisArea.toFixed(2) }];
  const COLORS = ["#2563eb", "#f97316"];
  const bbox = concession.bbox;
  const coords = concession.kml_coords;

  const filtered = hotspots.filter((h) => {
    const q = query.toLowerCase();
    return !q || h.acq_date.includes(q) || String(h.lat).includes(q) || String(h.lon).includes(q) || h.satellite.toLowerCase().includes(q);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);
  const selected = hotspots.find((h) => h.id === selectedId) || hotspots[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{concession.name}</h1>
          <p className="text-sm text-slate-500">Luas konsesi: {Number(concession.area_ha).toFixed(2)} ha</p>
        </div>
        <button onClick={handleFetchLatest} disabled={fetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
          {fetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {fetching ? "Mengambil data..." : "Ambil Data Terbaru (24 jam)"}
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-4">Data diambil otomatis tiap 24 jam dari FIRMS. Tombol di atas untuk mengambil manual di luar jadwal.</p>

      <TopTabs tab={tab} setTab={setTab} />

      {hotspots.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
          Belum ada data hotspot untuk konsesi ini. Klik "Ambil Data Terbaru" atau tunggu jadwal otomatis 24 jam berikutnya.
        </div>
      )}

      {hotspots.length > 0 && tab === "summary" && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard icon={<Flame size={16} className="text-orange-600" />} iconBg="bg-orange-50" value={hotspots.length} label="Total Hotspot FIRMS" />
            <StatCard icon={<Satellite size={16} className="text-blue-600" />} iconBg="bg-blue-50" value={hotspots.filter(h=>h.status==="Api Terindikasi").length} label="Api Terindikasi" />
            <StatCard icon={<Flame size={16} className="text-red-600" />} iconBg="bg-red-50" value={`${totalArea.toFixed(2)} ha`} label="Estimasi Area Terbakar" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Peta Sebaran Hotspot</h3>
              <div className="aspect-square max-h-96"><MiniMap coords={coords} bbox={bbox} hotspots={hotspots} /></div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-1">Rekapitulasi Sensor</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} ha`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-2">
                <div className="text-lg font-semibold text-slate-800">{totalArea.toFixed(2)} ha</div>
                <div className="text-xs text-slate-400">Total Area</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {hotspots.length > 0 && tab === "detail" && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-700">Daftar Hotspot</h3>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Cari koordinat, tanggal, satelit..." className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-72" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-3 font-medium">No</th><th className="py-2 pr-3 font-medium">Tanggal</th>
                  <th className="py-2 pr-3 font-medium">Lat</th><th className="py-2 pr-3 font-medium">Lon</th>
                  <th className="py-2 pr-3 font-medium">Sensor</th><th className="py-2 pr-3 font-medium">FRP</th>
                  <th className="py-2 pr-3 font-medium">Status</th><th className="py-2 pr-3 font-medium">Estimasi (ha)</th>
                  <th className="py-2 pr-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((h, i) => (
                  <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 pr-3 text-slate-500">{(page-1)*perPage+i+1}</td>
                    <td className="py-2 pr-3 text-slate-700">{h.acq_date}</td>
                    <td className="py-2 pr-3 text-slate-700 tabular-nums">{h.lat}</td>
                    <td className="py-2 pr-3 text-slate-700 tabular-nums">{h.lon}</td>
                    <td className="py-2 pr-3 text-slate-700">{h.instrument}</td>
                    <td className="py-2 pr-3 text-slate-700 tabular-nums">{h.frp}</td>
                    <td className="py-2 pr-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.status==="Api Terindikasi"?"bg-orange-50 text-orange-600":"bg-slate-100 text-slate-500"}`}>{h.status}</span></td>
                    <td className="py-2 pr-3 text-slate-700 font-medium tabular-nums">{Number(h.estimasi_area).toFixed(2)}</td>
                    <td className="py-2 pr-3"><button onClick={() => { setSelectedId(h.id); setTab("map"); }} className="text-blue-600"><Eye size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
            <span>Menampilkan {pageData.length ? (page-1)*perPage+1 : 0}–{Math.min(page*perPage, filtered.length)} dari {filtered.length} data</span>
            <div className="flex items-center gap-1">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="p-1.5 rounded border border-slate-200 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={page>=pages} onClick={() => setPage(p=>p+1)} className="p-1.5 rounded border border-slate-200 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {hotspots.length > 0 && tab === "map" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-3">
            <div className="aspect-square"><MiniMap coords={coords} bbox={bbox} hotspots={hotspots} selectedId={selected?.id} onSelect={setSelectedId} /></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Informasi Hotspot</h3>
            {selected ? (
              <div className="space-y-2 text-sm">
                {[["Tanggal", selected.acq_date],["Lat", selected.lat],["Lon", selected.lon],["Sensor", selected.instrument],["FRP", `${selected.frp} MW`],["Status", selected.status],["Estimasi Area", `${Number(selected.estimasi_area).toFixed(2)} ha`]].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between"><span className="text-slate-400">{k}</span><span className="text-slate-700 font-medium">{v}</span></div>
                ))}
              </div>
            ) : <div className="text-sm text-slate-400">Klik titik pada peta.</div>}
          </div>
        </div>
      )}

      {hotspots.length > 0 && tab === "report" && (
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"><Download size={14}/>Download PDF</button>
            <button onClick={() => downloadBlob(toCSV(concession, hotspots), `Laporan_${concession.name.replace(/\s+/g,"_")}.csv`, "text/csv")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"><FileSpreadsheet size={14}/>Download Excel</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="text-slate-400">Nama Konsesi</span><div className="font-medium text-slate-700">{concession.name}</div></div>
              <div><span className="text-slate-400">Luas Konsesi</span><div className="font-medium text-slate-700">{Number(concession.area_ha).toFixed(2)} ha</div></div>
              <div><span className="text-slate-400">Jumlah Hotspot</span><div className="font-medium text-slate-700">{hotspots.length}</div></div>
              <div><span className="text-slate-400">Total Estimasi Area</span><div className="font-medium text-slate-700">{totalArea.toFixed(2)} ha</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
