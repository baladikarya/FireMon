import { fetchFirmsHotspots } from "./firms";
import { pointInPolygon } from "./geo";
import { hitungHotspot } from "./formula";

// concession: row dari tabel concessions (punya kml_coords, bbox, id)
// dayRange: berapa hari ke belakang diambil dari FIRMS (maks 10, default 1 = 24 jam terakhir)
export async function fetchAndStoreForConcession(admin, concession, dayRange = 1) {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) throw new Error("FIRMS_MAP_KEY belum diset di environment variables.");

  const raw = await fetchFirmsHotspots({ mapKey, bbox: concession.bbox, dayRange });

  const inside = raw.filter((h) => pointInPolygon([h.lon, h.lat], concession.kml_coords));

  const computed = inside.map((h) => {
    const r = hitungHotspot(h);
    return {
      concession_id: concession.id,
      acq_date: r.acqDate,
      acq_time: r.acqTime,
      lat: r.lat,
      lon: r.lon,
      satellite: r.satellite,
      instrument: r.instrument,
      frp: r.frp,
      confidence: String(r.confidence),
      brightness: r.brightness,
      bright_t31: r.brightT31,
      daynight: r.daynight,
      selisih_brightness: r.selisihBrightness,
      bobot_frp: r.bobotFRP,
      bobot_confidence: r.bobotConfidence,
      bobot_kontras: r.bobotKontras,
      bobot_daynight: r.bobotDaynight,
      status: r.status,
      estimasi_area: r.estimasiArea,
    };
  });

  if (computed.length) {
    // upsert supaya titik yang sudah pernah tersimpan (misal tumpang tindih
    // antar hari fetch) tidak terduplikasi — unique key: concession_id + lat
    // + lon + acq_date + acq_time + instrument (lihat schema.sql).
    const { error } = await admin
      .from("hotspots")
      .upsert(computed, { onConflict: "concession_id,lat,lon,acq_date,acq_time,instrument" });
    if (error) throw new Error("Gagal menyimpan hotspot: " + error.message);
  }

  return computed.length;
}
