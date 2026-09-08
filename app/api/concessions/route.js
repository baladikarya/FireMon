import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionCompany } from "@/lib/session";

// Preset rentang waktu tampilan (jam) dihitung mundur dari waktu sekarang.
// "all" (default, bila parameter range tidak dikirim) = tidak difilter sama
// sekali, supaya endpoint ini tetap kompatibel dengan pemanggil lain (mis.
// halaman Riwayat) yang butuh total keseluruhan data, bukan hanya 24 jam.
const RANGE_HOURS = { "24h": 24, "3d": 72, "7d": 168, "30d": 720 };

// Gabungkan acq_date ("YYYY-MM-DD") + acq_time ("HHMM", UTC dari FIRMS)
// menjadi epoch ms, supaya filter waktu akurat sampai ke jam-menit deteksi,
// bukan cuma tanggalnya saja.
function acqTimestampMs(h) {
  const t = String(h.acq_time).padStart(4, "0");
  const hh = t.slice(0, 2);
  const mm = t.slice(2, 4);
  const d = new Date(`${h.acq_date}T${hh}:${mm}:00Z`);
  return d.getTime();
}

function filterByRange(hotspots, { range, from, to }) {
  if (range === "custom" && (from || to)) {
    const fromMs = from ? new Date(`${from}T00:00:00Z`).getTime() : -Infinity;
    const toMs = to ? new Date(`${to}T23:59:59Z`).getTime() : Infinity;
    return hotspots.filter((h) => {
      const ts = acqTimestampMs(h);
      return ts >= fromMs && ts <= toMs;
    });
  }
  const hours = RANGE_HOURS[range];
  if (!hours) return hotspots; // range tidak dikenali atau "all" -> tidak difilter
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return hotspots.filter((h) => acqTimestampMs(h) >= cutoff);
}

export async function GET(request, { params }) {
  const session = await getSessionCompany();
  if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "all"; // "24h" | "3d" | "7d" | "30d" | "all" | "custom"
  const from = searchParams.get("from"); // dipakai kalau range=custom, format YYYY-MM-DD
  const to = searchParams.get("to");

  const admin = supabaseAdmin();
  const { data: concession, error: cErr } = await admin
    .from("concessions")
    .select("*")
    .eq("id", params.id)
    .eq("company_id", session.companyId)
    .single();
  if (cErr || !concession) return NextResponse.json({ error: "Konsesi tidak ditemukan." }, { status: 404 });

  const { data: allHotspots, error: hErr } = await admin
    .from("hotspots")
    .select("*")
    .eq("concession_id", params.id)
    .order("acq_date", { ascending: false })
    .order("acq_time", { ascending: false });
  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 400 });

  const hotspots = filterByRange(allHotspots || [], { range, from, to });

  return NextResponse.json({ concession, hotspots, range: { range, from, to } });
}
