# Kalkulator MBG

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](#pengembangan)

Ubah nominal Rupiah apa pun menjadi gambaran konkret: **berapa lama** uang itu bisa
membiayai program Makan Bergizi Gratis (MBG), dan setara **berapa porsi** makan gratis.

> Alat edukasi independen — **bukan** afiliasi resmi BGN/pemerintah.
> Angka berbasis sumber publik yang dapat diverifikasi (lihat [Sumber data](#sumber-data)).

---

## Fitur

| Fitur | Deskripsi |
|---|---|
| **Mode Hitung** | Rp → waktu + jumlah porsi MBG |
| **Mode Selisih** | Bandingkan 2 nominal sekaligus |
| **Mode Balik** | Waktu → setara berapa Rupiah |
| **Slider logaritmik** | Snap ke angka bulat, rentang Rp 1 – Rp 1 T |
| **Preset resmi** | Angka nyata bersumber publik (APBN, BGN, dll) |
| **Riwayat** | Simpan, ekspor/impor sebagai JSON |
| **Ekspor PNG** | Rasio 1:1 / 9:16 / 16:9, siap dibagikan |
| **Web Share API** | Share native di mobile |
| **PWA** | Installable, offline-ready |
| **Dark mode** | Toggle tema tanpa kedip (FOUC-free) |
| **Aksesibilitas** | ARIA, live region, navigasi keyboard, focus ring |

---

## Metodologi & Premis

Seluruh konversi memakai **satu basis yang konsisten** dan dapat diverifikasi:

| Patokan | Nilai | Sumber |
|---|---|---|
| Anggaran MBG 2026 | **Rp 335 triliun** (pagu Rp 268 T + standby Rp 67 T) | APBN 2026 |
| Biaya harian | **Rp 917,8 miliar/hari** = anggaran ÷ 365 | turunan |
| Biaya per porsi | **Rp 10.000** | standar BGN |
| Target penerima 2026 | **82,9 juta** orang | BGN |

Re-kalibrasi cukup di **satu tempat**: ubah `MBG_ANNUAL_BUDGET` di
[`src/lib/mbg-constants.ts`](src/lib/mbg-constants.ts) — biaya harian dan seluruh hasil
ikut menyesuaikan otomatis.

---

## Pengembangan

### Prasyarat

- Node.js ≥ 18 atau Bun ≥ 1.x
- npm / bun

### Mulai

```bash
# Clone
git clone https://github.com/alfindigital/mbgcalc.git
cd mbgcalc

# Install dependensi
npm install

# Jalankan server dev (port 8080)
npm run dev

# Unit test (Vitest)
npm test

# Lint
npm run lint

# Build produksi
npm run build
```

### Konfigurasi opsional

Salin `.env.example` ke `.env.local` lalu sesuaikan:

```bash
cp .env.example .env.local
```

| Variabel | Default | Keterangan |
|---|---|---|
| `VITE_SITE_URL` | `https://YOUR_DOMAIN` | URL produksi untuk OG tags & canonical |

---

## Struktur penting

```
src/
├── lib/
│   ├── mbg-constants.ts   # angka & sumber (single source of truth)
│   ├── units.ts           # konversi inti (rupiah ↔ ms ↔ porsi, format) + test
│   ├── terbilang.ts       # angka → kata Indonesia + test
│   ├── presets.ts         # preset bersumber resmi
│   ├── analytics.ts       # wrapper GA4 (aman, no-op bila belum dikonfigurasi)
│   └── site.ts            # SITE_URL (env-driven)
├── pages/
│   ├── Index.tsx          # kalkulator utama
│   └── Tentang.tsx        # metodologi, FAQ, sumber data
└── components/
    ├── LiveMbgCounter.tsx  # counter real-time anggaran MBG
    └── BudgetChart.tsx     # chart komposisi APBN

supabase/functions/og-image/  # OG dinamis per-nominal (belum di-deploy)
scripts/generate-sitemap.ts   # generate sitemap.xml saat build
```

---

## Stack teknologi

- **React 18** + **TypeScript 5**
- **Vite 5** (bundler, dev server)
- **Tailwind CSS 3** + **shadcn/ui** (komponen UI)
- **Recharts** (visualisasi anggaran)
- **html2canvas** (ekspor PNG)
- **react-helmet-async** (SEO meta tags)
- **Vitest** (unit test)
- **Playwright** (e2e — konfigurasi tersedia)

---

## Sumber data

- [Kompas — Anggaran MBG 2026 Rp 335 T](https://nasional.kompas.com/read/2026/01/19/20333411/anggaran-mbg-tahun-2026-meroket-jadi-rp-335-triliun)
- [Bloomberg Technoz — Rincian pagu Rp 268 T + standby Rp 67 T](https://www.bloombergtechnoz.com/detail-news/96576/anggaran-mbg-2026-tembus-rp335-t-alokasi-beli-makanan-cuma-76)
- [Badan Gizi Nasional (BGN)](https://bgn.go.id/)

---

## Kontribusi

Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan lengkap.

Singkatnya:
1. Fork repo ini
2. Buat branch: `git checkout -b feat/nama-fitur`
3. Commit: `git commit -m "feat: deskripsi singkat"`
4. Push & buat Pull Request

---

## Keamanan

Lihat [SECURITY.md](SECURITY.md) untuk melaporkan vulnerability.

---

## Lisensi

[MIT](LICENSE) — bebas digunakan, dimodifikasi, dan didistribusikan.
