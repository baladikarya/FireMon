// Klien untuk NASA FIRMS Area API.
// Dokumentasi: https://firms.modaps.eosdis.nasa.gov/api/area/
// Endpoint: /api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{day_range}/{date}
//
// SOURCE dipanggil satu per satu (API tidak reliably mendukung gabungan
// beberapa source dalam satu call), lalu hasilnya digabung.

const SOURCES = ["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"];

function instrumentOf(source) {
  return source.startsWith("MODIS") ? "MODIS" : "VIIRS";
}

function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h] = cols[i]));
    return row;
  });
}

// bbox: {minLon,maxLon,minLat,maxLat} → dayRange: jumlah hari ke belakang (maks 10)
export async function fetchFirmsHotspots({ mapKey, bbox, dayRange = 1, date }) {
  const area = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;
  const dateSegment = date ? `/${date}` : "";
  const results = [];

  for (const source of SOURCES) {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${source}/${area}/${dayRange}${dateSegment}`;
    let res;
    try {
      res = await fetch(url);
    } catch (err) {
      console.error(`FIRMS fetch gagal untuk ${source}:`, err.message);
      continue;
    }
    if (!res.ok) {
      console.error(`FIRMS ${source} status ${res.status}`);
      continue;
    }
    const text = await res.text();
    if (!text || text.startsWith("<") || text.toLowerCase().includes("invalid")) {
      console.error(`FIRMS ${source} respons tidak valid: ${text.slice(0, 120)}`);
      continue;
    }
    const rows = parseCSV(text);
    const instrument = instrumentOf(source);

    for (const r of rows) {
      const lat = Number(r.latitude);
      const lon = Number(r.longitude);
      const frp = Number(r.frp);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(frp)) continue;

      const isViirs = instrument === "VIIRS";
      const brightness = Number(isViirs ? r.bright_ti4 : r.brightness);
      const brightT31 = Number(isViirs ? r.bright_ti5 : r.bright_t31);
      const confidence = isViirs ? String(r.confidence).trim().toLowerCase() : Number(r.confidence);

      results.push({
        acqDate: r.acq_date,
        acqTime: r.acq_time,
        lat,
        lon,
        satellite: r.satellite,
        instrument,
        frp,
        confidence,
        brightness: Number.isFinite(brightness) ? brightness : 0,
        brightT31: Number.isFinite(brightT31) ? brightT31 : 0,
        daynight: r.daynight,
      });
    }
  }
  return results;
}
