// Parsing KML dan operasi geometri poligon, jalan di server (Node) maupun browser.

// Parser XML sederhana khusus untuk mengambil <coordinates> dari KML,
// tanpa dependency tambahan (cukup regex yang aman untuk struktur KML standar).
export function parseKML(text) {
  const nameMatch = text.match(/<name>([\s\S]*?)<\/name>/);
  const name = nameMatch ? nameMatch[1].trim() : "Areal Konsesi";

  const coordMatches = [...text.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/g)];
  if (!coordMatches.length) throw new Error("Tidak ditemukan koordinat pada file KML.");

  let best = null;
  for (const m of coordMatches) {
    const pts = m[1]
      .trim()
      .split(/\s+/)
      .map((triplet) => {
        const [lon, lat] = triplet.split(",").map(Number);
        return [lon, lat];
      })
      .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (!best || pts.length > best.length) best = pts;
  }
  if (!best || best.length < 3) throw new Error("Geometri poligon pada KML tidak valid.");
  return { name, coords: best };
}

export function areaHa(coords) {
  const lat0 = coords.reduce((s, p) => s + p[1], 0) / coords.length;
  const mPerDegLat = 110540;
  const mPerDegLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const pts = coords.map(([lon, lat]) => [lon * mPerDegLon, lat * mPerDegLat]);
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2) / 10000;
}

export function getBBox(coords) {
  // Hindari Math.min(...array) / Math.max(...array): untuk array koordinat
  // yang sangat besar (KML batas konsesi yang detail bisa berisi ribuan
  // titik), spread operator ke Math.min/max bisa melempar
  // "RangeError: Maximum call stack size exceeded". Loop manual aman untuk
  // ukuran array berapa pun.
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return { minLon, maxLon, minLat, maxLat };
}

export function pointInPolygon([x, y], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
