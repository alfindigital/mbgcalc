# Implementasi Batch UX/Growth — 9 Fitur

Semua perubahan terkonsentrasi di FE (frontend). Tidak butuh backend.

## 1. Deep-link `?amount=` & `?compare=`
- Di `Index.tsx`, tambah `useEffect` on-mount baca `URLSearchParams`:
  - `amount` → set `rawInput` (clamp ≥ 0, sanitize digits).
  - `compare` → set `rawInput2` + `setCompareMode(true)`.
  - `reverse` + `unit` (opsional) → buka mode terbalik.
- Tambah efek sinkronisasi state → URL (debounced ~500ms) pakai `history.replaceState` supaya tombol back tidak terganggu.
- Bonus: tombol "Salin Teks" diperluas jadi "Salin Link" sebagai aksi sekunder kecil di dalam card (atau tambah tombol Share terpisah di batch berikutnya — di sini cukup deep-link bidirectional).

## 2. Hero copy & value prop
Di atas mode toggle, sebelum kalkulator:
```
<section> 
  <h1>Berapa lama Rp segini bisa menjalankan program MBG?</h1>
  <p>Ketik nominal apa pun — lihat setara berapa porsi, hari, dan persen dari APBN MBG.</p>
</section>
```
- Promote H1 dari sr-only "Kalkulator Konversi…" ke H1 visible (pendek). Tag `<h1>` sekarang ada di header → ubah jadi `<p>` brand label, dan pakai `<h1>` baru di hero. Hindari dua H1.
- Sub-line muted, 1 baris di desktop, wrap di mobile.

## 3. Sumber data patokan (fixed + cited)
- Konstanta tetap (`MBG_DAILY_COST`, `MBG_ANNUAL_BUDGET`, `MBG_COST_PER_PORSI`) dipindah ke `src/lib/mbg-constants.ts` dengan komentar sumber + URL.
- Footer diupgrade: tampilkan ringkasan + tombol "Sumber data" → buka `Popover` (sudah ada di shadcn) berisi:
  - "Anggaran MBG 2025: Rp 71 T (Perpres 201/2024)"
  - "Biaya harian ≈ Rp 1,2 T (71 T ÷ 60 hari aktif/bulan × 12, pembulatan)"
  - "Biaya per porsi: Rp 10.000 (standar BGN)"
  - Tanggal update: 25 Mei 2026.
  - 2 link referensi (BGN, Kemenkeu) — placeholder; user bisa ganti.

## 4. Konfeti milestone
- Install `canvas-confetti` (lib mungil, ~10KB).
- `useEffect` watch `debouncedRupiah`: ketika menyebrang threshold 1T / 10T / 71T (dan belum di-fire utk sesi), trigger `confetti({ particleCount, spread, origin })`.
- Simpan firedMilestones di `useRef<Set<number>>`, di-reset saat clear input.
- Hormati `prefers-reduced-motion` → no-op.

## 5. Preset rasio Save Gambar
- Ganti tombol "Simpan Gambar" jadi `DropdownMenu` (sudah ada di shadcn):
  - 1:1 — Instagram Feed (1080×1080) [default]
  - 9:16 — Story/Reels (1080×1920)
  - 16:9 — Twitter/Web (1920×1080)
- Refactor `captureRef` → komponen `<ShareCanvas ratio="1:1" />` dengan layout responsif per rasio (padding & font scale). Tetap render off-screen.
- `handleSaveImage(ratio)` set state aktif sebelum capture, await re-render (microtask), lalu html2canvas dengan width/height sesuai.

## 6. Audit kontras dark mode
- `--muted-foreground` di dark saat ini `220 15% 58%` → naikkan ke `220 18% 70%` (AA pada bg `--card` 225 25% 10%).
- Hapus penggunaan `/70` opacity tambahan pada teks micro (Porsi/Hari "@ Rp 10rb/porsi", bar caption). Pakai `text-muted-foreground` langsung.
- Verifikasi: stat caption (`text-muted-foreground/80`), label bar APBN, terbilang italic — semua dibuat solid `text-muted-foreground` (contrast >= 4.5 utk text < 18px).

## 7. PWA installable
- **Manifest-only** (no service worker, sesuai guidance). `public/manifest.json` sudah ada — hanya perlu pastikan icon 192 & 512 valid.
- Generate `public/icon-192.png` dan `public/icon-512.png` (calculator icon dengan brand color #003366) via imagegen.
- Tidak install `vite-plugin-pwa`. Tidak tambah SW. App jadi "Add to Home Screen"-able tanpa risiko cache stale di iframe.
- Hapus baris "offline shell" dari scope ini — secara eksplisit skip, dengan note di chat kenapa.

## 8. Embed mode `/embed`
- Route baru di `App.tsx`: `<Route path="/embed" element={<Embed />} />`.
- `src/pages/Embed.tsx`: stripped down — hanya input + ResultCard, tanpa header/footer/history/reverse/compare/dark toggle.
  - Baca `?amount=`, `?minimal=1` (sembunyikan input, jadi read-only display), `?theme=light|dark`.
  - Body bg transparan / minimal padding agar embeddable di iframe.
- Tambah ke `sitemap.xml`? Tidak — pakai `<meta name="robots" content="noindex">` via react-helmet-async (atau static check + `document.head` mutate di Embed.tsx mount). Install `react-helmet-async` + provider.
- Footer Kalkulator MBG utama: tambah tombol kecil "Sematkan" → tampilkan dialog dengan snippet `<iframe src="https://mbgcal.lovable.app/embed?amount=…" width=… height=… style=…>`.

## 9. OG image statis polished
- Generate `public/og-image.png` (1200×630) — premium quality, ada text "Kalkulator MBG", subtitle, brand gradient.
- Update `index.html`:
  - Ganti `og:image` dan `twitter:image` ke `https://mbgcal.lovable.app/og-image.png`.
  - Set `twitter:card` ke `summary_large_image`.
  - Tambah `og:image:width=1200`, `og:image:height=630`.

## Files berubah
- `src/pages/Index.tsx` — hero, deep-link, milestone confetti, save image dropdown, kontras tweaks, sumber-data popover, link "Sematkan".
- `src/pages/Embed.tsx` — **baru**.
- `src/App.tsx` — route `/embed`, `HelmetProvider`.
- `src/main.tsx` — `<HelmetProvider>` wrap.
- `src/lib/mbg-constants.ts` — **baru** (konstanta + sumber).
- `src/components/ShareCanvas.tsx` — **baru** (render capture per rasio).
- `index.html` — OG image baru.
- `src/index.css` — `--muted-foreground` dark mode + bersihkan opacity tweaks.
- `public/manifest.json` — verifikasi.
- `public/icon-192.png`, `public/icon-512.png`, `public/og-image.png` — generated.
- `package.json` — `canvas-confetti`, `react-helmet-async`.

## Catatan teknis
- TypeScript: `canvas-confetti` butuh `@types/canvas-confetti`.
- Sitemap tidak diubah — `/embed` sengaja tidak diindeks.
- Tidak ada perubahan business logic kalkulasi.
- Tidak ada perubahan backend.
