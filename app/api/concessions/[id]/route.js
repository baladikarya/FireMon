import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionCompany } from "@/lib/session";

export async function GET(request, { params }) {
  const session = await getSessionCompany();
  if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: concession, error: cErr } = await admin
    .from("concessions")
    .select("*")
    .eq("id", params.id)
    .eq("company_id", session.companyId)
    .single();
  if (cErr || !concession) return NextResponse.json({ error: "Konsesi tidak ditemukan." }, { status: 404 });

  const { data: hotspots, error: hErr } = await admin
    .from("hotspots")
    .select("*")
    .eq("concession_id", params.id)
    .order("acq_date", { ascending: false });
  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 400 });

  return NextResponse.json({ concession, hotspots });
}
