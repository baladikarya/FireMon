import "./globals.css";

export const metadata = {
  title: "FireMon — Estimasi Area Terbakar",
  description: "Estimasi area terbakar berbasis hotspot FIRMS untuk areal konsesi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-800">{children}</body>
    </html>
  );
}
