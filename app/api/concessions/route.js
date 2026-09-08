import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionCompany } from "@/lib/session";
import { parseKML, areaHa, getBBox } from "@/lib/geo";

// Vercel Functions membatasi ukuran body request ke 4.5 MB (batas platform,
// tidak bisa diubah lewat konfigurasi Next.js). Kalau file lebih besar dari
// itu, request akan ditolak sebelum sampai ke handler ini, jadi kita batasi
// lebih ketat di sini + validasi di client supaya user dapat pesan yang
// jelas, bukan error JSON yang membingungkan.
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB, beri sedikit margin dari batas 4.5MB Vercel

export async function GET() {
  const session = await getSessionCompany();
  if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("concessions")
    .select("id,name,area_ha,created_at")
    .eq("company_id", session.companyId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ concessions: data });
}

export async function POST(request) {
  // Bungkus SELURUH proses (bukan cuma parseKML) dalam try/catch, supaya
  // error apa pun (termasuk bug tak terduga) tetap direspons sebagai JSON
  // yang valid, bukan crash tanpa body yang bikin client gagal parse
  // ("Unexpected end of JSON input").
  try {
    const session = await getSessionCompany();
    if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ error: "File KML tidak ditemukan." }, { status: 400 });

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Ukuran file (${(file.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimal 4 MB.` },
        { status: 413 }
      );
    }

    const text = await file.text();
    let parsed;
    try {
      parsed = parseKML(text);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const bbox = getBBox(parsed.coords);
    const area = areaHa(parsed.coords);

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("concessions")
      .insert({
        company_id: session.companyId,
        name: parsed.name,
        kml_coords: parsed.coords,
        bbox,
        area_ha: area,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ concession: data });
  } catch (err) {
    console.error("Gagal memproses upload KML:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan tak terduga saat memproses file KML: " + err.message },
      { status: 500 }
    );
  }
}
