# Security Policy

## Scope

**mbgcalc** adalah SPA (Single-Page Application) statis tanpa backend aktif.
Tidak ada server, database, atau autentikasi pengguna.

Yang ada:
- Kalkulasi matematis murni di frontend (tidak ada request ke server)
- `localStorage` untuk tema dan riwayat kalkulasi (angka saja, tidak ada PII)
- Supabase Edge Function (`supabase/functions/og-image`) — **ditulis tapi belum di-deploy**

## Melaporkan vulnerability

Jika kamu menemukan vulnerability keamanan, silakan buat
[GitHub Security Advisory](https://github.com/alfindigital/mbgcalc/security/advisories/new)
(private) — jangan buat issue publik.

Sertakan:
- Deskripsi singkat vulnerability
- Langkah reproduksi
- Estimasi dampak

Kami akan merespons dalam **7 hari kerja**.

## Yang **tidak** perlu dilaporkan

- `meta name="google-site-verification"` — bukan secret, tidak memberi akses apa pun
- Analytics placeholder (`G-XXXXXXXXXX`) — tidak aktif sampai diganti
- `VITE_SITE_URL` — URL publik biasa
- `localStorage` yang berisi angka kalkulasi — tidak ada PII
