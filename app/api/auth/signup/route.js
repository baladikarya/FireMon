import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  const { companyName, email, password } = await request.json();

  if (!companyName?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: "Data pendaftaran tidak lengkap atau password terlalu pendek." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName.trim() })
    .select()
    .single();
  if (companyError) {
    return NextResponse.json({ error: "Gagal membuat perusahaan: " + companyError.message }, { status: 400 });
  }

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError) {
    await admin.from("companies").delete().eq("id", company.id);
    return NextResponse.json({ error: "Gagal membuat akun: " + userError.message }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userData.user.id,
    company_id: company.id,
    email,
  });
  if (profileError) {
    return NextResponse.json({ error: "Gagal menyimpan profil: " + profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
