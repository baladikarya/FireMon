# FireMon — Estimasi Area Terbakar (Multi-Perusahaan)

Aplikasi SaaS: setiap perusahaan punya akun & data terpisah. Upload KML areal
konsesi → sistem otomatis mengambil hotspot dari NASA FIRMS tiap 24 jam →
rumus estimasi luas dihitung otomatis → laporan bisa diunduh (PDF/Excel).

Stack: **Next.js** (frontend + API dalam satu aplikasi) di **Vercel**,
database & login di **Supabase**, data kebakaran dari **NASA FIRMS**.
Semua gratis untuk mulai, tidak perlu kelola server sendiri.

---

## 1. Siapkan Supabase (database + login)

1. Buka https://supabase.com → Sign up (bisa pakai akun GitHub) → **New Project**.
2. Beri nama project, buat password database (simpan baik-baik), pilih region terdekat (Singapore).
3. Setelah project aktif, buka menu **SQL Editor** di sidebar kiri.
4. Copy seluruh isi file `supabase/schema.sql` dari folder ini, tempel di SQL Editor, klik **Run**.
   Ini membuat semua tabel (companies, profiles, concessions, hotspots) beserta aturan keamanannya.
5. Buka menu **Project Settings → API**. Catat 3 nilai ini (dibutuhkan di langkah 4):
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → jadi `SUPABASE_SERVICE_ROLE_KEY` (⚠️ rahasia, jangan pernah dibagikan/di-commit ke GitHub)

## 2. Dapatkan API key NASA FIRMS

1. Buka https://firms.modaps.eosdis.nasa.gov/api/map_key/
2. Isi email Anda, klik submit. MapKey akan dikirim ke email (gratis, instan).
3. Catat MapKey ini → jadi `FIRMS_MAP_KEY`.

## 3. Push kode ini ke GitHub

```bash
cd firemon-app
git init
git add .
git commit -m "FireMon initial commit"
```
Buat repository baru di GitHub (repo **private** disarankan, karena ini kode
berisi logika bisnis Anda), lalu:
```bash
git remote add origin https://github.com/USERNAME/firemon-app.git
git branch -M main
git push -u origin main
```

## 4. Deploy ke Vercel

1. Buka https://vercel.com → Sign up/login dengan akun GitHub Anda.
2. Klik **Add New → Project**, pilih repo `firemon-app` yang baru di-push.
3. Sebelum klik Deploy, buka bagian **Environment Variables**, isi 5 variabel ini
   (nilainya dari langkah 1 & 2, contoh formatnya ada di file `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FIRMS_MAP_KEY`
   - `CRON_SECRET` — isi bebas, string acak panjang (misal hasil dari https://generate-secret.vercel.app/32)
4. Klik **Deploy**. Tunggu 1-2 menit sampai selesai.
5. Vercel akan otomatis mengaktifkan cron job harian (lihat `vercel.json`) yang
   memanggil `/api/cron/daily` — ini yang mengambil data FIRMS tiap 24 jam
   untuk **semua** konsesi dari **semua** perusahaan yang terdaftar, tanpa perlu
   tindakan manual apa pun.

## 5. Selesai — coba aplikasinya

1. Buka URL yang diberikan Vercel (misal `firemon-app.vercel.app`).
2. Klik **Daftar perusahaan baru**, isi nama perusahaan + email + password.
3. Setelah masuk, upload file KML areal konsesi.
4. Klik **Ambil Data Terbaru (24 jam)** untuk mengambil data FIRMS pertama kali
   secara manual (tidak perlu menunggu jadwal cron otomatis).
5. Lihat hasilnya di tab Ringkasan / Detail Data / Peta Interaktif / Laporan.
6. Perusahaan lain bisa mendaftar sendiri di URL yang sama — datanya otomatis
   terpisah dan tidak bisa saling melihat (diatur oleh `company_id` + Row Level
   Security di database).

---

## Catatan penting

- **Ganti nomor jam cron sesuai zona waktu Anda.** `vercel.json` diset jalan
  jam `20:00 UTC` (= 03:00 WIB) setiap hari. Ubah angka `"0 20 * * *"` sesuai
  kebutuhan (format cron standar, waktu selalu UTC).
- **Jangan pernah expose `SUPABASE_SERVICE_ROLE_KEY` ke frontend.** Kunci ini
  hanya dipakai di kode yang jalan di server (`app/api/**`), yang di Next.js
  otomatis tidak pernah dikirim ke browser.
- **Batas FIRMS Area API**: maksimal 10 hari data per request, dan ada batas
  jumlah request per 10 menit untuk akun gratis. Untuk kebutuhan volume besar,
  NASA FIRMS punya kontak khusus untuk menaikkan limit.
- **SIPONGI** tetap tidak diambil otomatis (tidak ada API resmi) — aplikasi
  ini memakai FIRMS sebagai sumber data utama karena secara teknis berasal
  dari satelit yang sama (Terra/Aqua/SNPP/NOAA).
- Kalau nanti butuh fitur tambahan (multi-user per perusahaan dengan role
  berbeda, notifikasi email/WhatsApp saat ada hotspot baru, ekspor PDF yang
  lebih rapi, dsb), semuanya bisa ditambahkan bertahap di atas fondasi ini.
