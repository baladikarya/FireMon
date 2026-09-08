"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, X, ChevronRight, Loader2 } from "lucide-react";

export default function DashboardHome() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [concessions, setConcessions] = useState(null);

  useEffect(() => {
    fetch("/api/concessions")
      .then((r) => r.json())
      .then((d) => setConcessions(d.concessions || []))
      .catch(() => setConcessions([]));
  }, []);

  async function handleUpload(f) {
    setError("");
    setFile(f);
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setError(`Ukuran file (${(f.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimal 4 MB.`);
      setFile(null);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/concessions", { method: "POST", body: form });

      // Baca sebagai teks dulu, baru coba parse JSON. Kalau server/platform
      // mengembalikan body kosong atau non-JSON (mis. error 413 dari batas
      // ukuran request Vercel), ini menghindari crash
      // "Unexpected end of JSON input" dan menampilkan pesan yang jelas.
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          res.status === 413
            ? "File terlalu besar untuk diunggah (maksimal 4 MB)."
            : "Server tidak memberikan respons yang valid. Coba lagi beberapa saat."
        );
      }

      if (!res.ok) throw new Error(data.error || "Gagal mengunggah KML.");
      router.push(`/dashboard/concessions/${data.concession.id}`);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-slate-800 mb-1">Beranda</h1>
      <p className="text-sm text-slate-500 mb-6">Unggah areal konsesi baru, atau lanjutkan ke konsesi yang sudah ada.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-800">Upload File Areal Konsesi</h2>
        <p className="text-sm text-slate-500 mt-1">Unggah file KML areal konsesi untuk mulai mengambil data hotspot dari FIRMS.</p>

        <div
          className="mt-5 border-2 border-dashed border-slate-200 rounded-xl py-10 flex flex-col items-center justify-center text-center hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleUpload(f);
          }}
        >
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            {uploading ? <Loader2 size={20} className="text-blue-600 animate-spin" /> : <Upload size={20} className="text-blue-600" />}
          </div>
          <div className="text-sm font-medium text-slate-700">
            {uploading ? "Memproses file..." : "Upload File KML Areal Konsesi"}
          </div>
          <div className="text-xs text-slate-400 mt-1">File yang didukung: .kml (maks. 4 MB)</div>
          <button
            type="button"
            disabled={uploading}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            Pilih File KML
          </button>
          <input ref={inputRef} type="file" accept=".kml" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] || null)} />
        </div>

        {file && !error && (
          <div className="mt-3 flex items-center gap-2 text-sm rounded-lg px-3 py-2 bg-emerald-50 text-emerald-700">
            <FileText size={15} /><span className="truncate flex-1">{file.name}</span><CheckCircle2 size={16} />
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm rounded-lg px-3 py-2 bg-red-50 text-red-600">
            <X size={15} /><span className="flex-1">{error}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">Areal Konsesi Anda</h3>
        {concessions === null && <div className="text-sm text-slate-400">Memuat...</div>}
        {concessions?.length === 0 && <div className="text-sm text-slate-400">Belum ada konsesi. Unggah KML di atas untuk memulai.</div>}
        <div className="divide-y divide-slate-100">
          {concessions?.map((c) => (
            <a key={c.id} href={`/dashboard/concessions/${c.id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
              <div>
                <div className="text-sm font-medium text-slate-700">{c.name}</div>
                <div className="text-xs text-slate-400">Luas: {Number(c.area_ha).toFixed(2)} ha · dibuat {new Date(c.created_at).toLocaleDateString("id-ID")}</div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
