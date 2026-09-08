import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchAndStoreForConcession } from "@/lib/fetchAndStore";

// Dipanggil otomatis oleh Vercel Cron (lihat vercel.json, jadwal harian).
// Vercel otomatis mengirim header "Authorization: Bearer <CRON_SECRET>"
// ketika env var CRON_SECRET diset di project — endpoint ini menolak
// permintaan yang tidak membawa header yang cocok.
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const { data: concessions, error } = await admin.from("concessions").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const concession of concessions || []) {
    try {
      const count = await fetchAndStoreForConcession(admin, concession, 1); // 1 hari = 24 jam terakhir
      results.push({ concession: concession.name, id: concession.id, newOrUpdated: count });
    } catch (err) {
      results.push({ concession: concession.name, id: concession.id, error: err.message });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
