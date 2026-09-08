import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionCompany } from "@/lib/session";
import { fetchAndStoreForConcession } from "@/lib/fetchAndStore";

export async function POST(request, { params }) {
  const session = await getSessionCompany();
  if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const dayRange = Math.min(Math.max(Number(body.dayRange) || 1, 1), 10);

  const admin = supabaseAdmin();
  const { data: concession, error } = await admin
    .from("concessions")
    .select("*")
    .eq("id", params.id)
    .eq("company_id", session.companyId)
    .single();
  if (error || !concession) return NextResponse.json({ error: "Konsesi tidak ditemukan." }, { status: 404 });

  try {
    const count = await fetchAndStoreForConcession(admin, concession, dayRange);
    return NextResponse.json({ ok: true, newOrUpdated: count });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
