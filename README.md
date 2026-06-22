# Kalkulator MBG

Ubah nominal Rupiah apa pun menjadi gambaran konkret: **berapa lama** uang itu bisa
membiayai program Makan Bergizi Gratis (MBG), dan setara **berapa porsi** makan gratis.

🔗 https://mbgcal.lovable.app

## Premis & metodologi

Seluruh konversi memakai SATU basis yang konsisten dan dapat diverifikasi:

| Patokan | Nilai | Sumber |
| --- | --- | --- |
| Anggaran MBG 2026 | **Rp 335 triliun** (pagu Rp 268 T + standby Rp 67 T) | APBN 2026 |
| Biaya harian | **Rp 917,8 miliar/hari** = anggaran tahunan ÷ 365 | turunan |
| Biaya per porsi | **Rp 10.000** | standar BGN |
| Target penerima 2026 | **82,9 juta** orang | BGN |

> Alat edukasi independen — **bukan** afiliasi resmi BGN/pemerintah. Angka berbasis
> sumber publik (lihat tautan di footer aplikasi & `src/lib/mbg-constants.ts`).

**Re-kalibrasi cukup di satu tempat:** ubah `MBG_ANNUAL_BUDGET` di
`src/lib/mbg-constants.ts`; biaya harian dan seluruh hasil ikut menyesuaikan otomatis.

## Fitur

- Mode **Hitung** (Rp → waktu + porsi), **Selisih** (bandingkan 2 nominal), **Balik** (waktu → Rp)
- Preset angka nyata bersumber resmi, slider logaritmik (snap ke angka bulat), riwayat
- Berbagi: **Web Share API** native, salin teks/tautan, ekspor PNG (1:1 / 9:16 / 16:9)
- Tema gelap/terang (tanpa kedip), PWA installable, halaman `/embed` untuk iframe
- Aksesibel: radiogroup + navigasi panah, live region untuk screen reader, slider beraksesibilitas

## Pengembangan

```bash
npm install
npm run dev      # server dev (port 8080)
npm run test     # unit test (Vitest) — logika konversi & terbilang
npm run lint     # ESLint
npm run build    # build produksi
```

## Struktur penting

```
src/lib/mbg-constants.ts   # angka & sumber (single source of truth)
src/lib/units.ts           # konversi inti (rupiah <-> ms <-> porsi, format) + test
src/lib/terbilang.ts       # angka -> kata Indonesia + test
src/lib/presets.ts         # preset bersumber resmi
src/lib/analytics.ts       # wrapper GA4 (aman, no-op bila belum dikonfigurasi)
src/pages/Index.tsx        # kalkulator utama
src/pages/Embed.tsx        # versi embed read-only (noindex)
supabase/functions/og-image # OG dinamis (ditulis, belum di-deploy)
```

## Konfigurasi opsional

- **Analytics:** ganti `G-XXXXXXXXXX` di `index.html` dengan Measurement ID GA4 Anda.
  Selama placeholder, gtag tidak dimuat dan tracking jadi no-op.
- **Custom domain:** ubah `SITE_URL` di `src/lib/site.ts` (satu tempat).
- **OG dinamis:** lihat `supabase/functions/og-image/README.md`.
