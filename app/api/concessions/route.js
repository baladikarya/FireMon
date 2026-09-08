import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionCompany } from "@/lib/session";
import { parseKML, areaHa, getBBox } from "@/lib/geo";

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
  const session = await getSessionCompany();
  if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!file) return NextResponse.json({ error: "File KML tidak ditemukan." }, { status: 400 });

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
}
