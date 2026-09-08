// Rumus Estimasi Luas Area Terbakar — persis sesuai diagram alur logika.

export function bobotFRP(instrument, frp) {
  if (instrument === "MODIS") {
    if (frp > 250) return 100;
    if (frp > 100) return 50;
    if (frp > 20) return 10;
    if (frp > 5) return 1;
    return 0;
  }
  if (instrument === "VIIRS") {
    if (frp > 100) return 14;
    if (frp > 50) return 7;
    if (frp > 10) return 3;
    if (frp > 5) return 1;
    return 0;
  }
  return 0;
}

export function bobotConfidence(instrument, confidence) {
  if (instrument === "MODIS") {
    const c = Number(confidence);
    if (c >= 80) return 1;
    if (c >= 50) return 0.7;
    if (c >= 30) return 0.4;
    return 0.1;
  }
  if (instrument === "VIIRS") {
    if (confidence === "h") return 1;
    if (confidence === "n") return 0.6;
    return 0.2; // "l"
  }
  return 0;
}

export function bobotKontras(selisihBrightness) {
  if (selisihBrightness >= 15) return 1;
  if (selisihBrightness >= 8) return 0.7;
  if (selisihBrightness >= 3) return 0.4;
  return 0.1;
}

export function bobotDaynight(daynight) {
  if (daynight === "N") return 1;
  if (daynight === "D") return 0.8;
  return 0.5;
}

export function hitungStatus(instrument, confidence, selisihBrightness) {
  if (instrument === "MODIS") {
    const c = Number(confidence);
    return c < 30 && selisihBrightness < 3 ? "Anomali/Bukan Api" : "Api Terindikasi";
  }
  if (instrument === "VIIRS") {
    const low = confidence === "l" || confidence === "n";
    return low && selisihBrightness < 3 ? "Anomali/Bukan Api" : "Api Terindikasi";
  }
  return "";
}

// h = { instrument, frp, confidence, brightness, brightT31, daynight, ... }
export function hitungHotspot(h) {
  const selisihBrightness = h.brightness - h.brightT31;
  const bFRP = bobotFRP(h.instrument, h.frp);
  const bConf = bobotConfidence(h.instrument, h.confidence);
  const bKontras = bobotKontras(selisihBrightness);
  const bDay = bobotDaynight(h.daynight);
  const status = hitungStatus(h.instrument, h.confidence, selisihBrightness);
  const estimasiArea = status === "Anomali/Bukan Api" ? 0 : bFRP * bConf * bKontras * bDay;
  return {
    ...h,
    selisihBrightness,
    bobotFRP: bFRP,
    bobotConfidence: bConf,
    bobotKontras: bKontras,
    bobotDaynight: bDay,
    status,
    estimasiArea,
  };
}
