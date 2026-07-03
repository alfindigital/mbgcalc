// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Sumber: PRESETS + PRESET_PAIRS (semua landing angka utama otomatis terdaftar).

import { writeFileSync } from "fs";
import { resolve } from "path";
import { PRESETS } from "../src/lib/presets";

const BASE_URL = "https://mbgcal.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

/** Ubah angka rupiah → slug pendek (500_000_000 → "500m", 1_000_000_000_000 → "1t"). */
function amountToSlug(v: number): string | null {
  if (v <= 0) return null;
  const units: Array<[number, string]> = [
    [1e12, "t"],
    [1e9, "m"],
    [1e6, "jt"],
    [1e3, "rb"],
  ];
  for (const [factor, suffix] of units) {
    if (v >= factor && v % factor === 0) return `${v / factor}${suffix}`;
  }
  // Non-bulat: pakai triliun dengan desimal koma-diganti-titik? Skip agar URL bersih.
  return null;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/tentang", changefreq: "monthly", priority: "0.8" },
];

const presetSlugs = new Set<string>();
for (const p of PRESETS) {
  const s = amountToSlug(p.value);
  if (s) presetSlugs.add(s);
}

const dynamicEntries: SitemapEntry[] = Array.from(presetSlugs).map((slug) => ({
  path: `/${slug}`,
  changefreq: "monthly",
  priority: "0.6",
}));

const entries = [...staticEntries, ...dynamicEntries];

function generateSitemap(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
