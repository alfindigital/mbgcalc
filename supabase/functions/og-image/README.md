# OG image dinamis (deferred)

Edge function untuk menghasilkan gambar preview Open Graph **per nominal**, sehingga
setiap tautan yang dibagikan (mis. `?amount=271000000000000`) menampilkan kartu gambar
dengan angka + hasilnya — bukan gambar generik yang sama untuk semua.

> **Status: belum di-deploy.** Sesuai keputusan "client-only dulu". Kode siap pakai;
> tinggal deploy saat backend (Supabase / Lovable Cloud) sudah aktif.

## Cara deploy (Supabase)

```bash
supabase functions deploy og-image --no-verify-jwt
```

Endpoint: `https://<project-ref>.supabase.co/functions/v1/og-image?amount=...`

## Cara menyambungkan ke meta tag

OG butuh URL gambar yang dibaca crawler saat halaman di-*scrape*. Karena app ini SPA
(meta statis), ada dua opsi:

1. **Reverse-proxy / rewrite** `og:image` ke endpoint function berdasarkan query —
   paling mulus, butuh layer server/edge di depan SPA.
2. **Prerender** halaman untuk bot (mis. Prerender.io / SSG) yang menulis
   `<meta property="og:image" content=".../og-image?amount=...">` secara dinamis.

Sampai salah satu disiapkan, `index.html` tetap memakai `/og-image.png` statis.

## Catatan

- Konstanta biaya (Rp 335 T ÷ 365) **digandakan** di `index.tsx` agar function mandiri.
  Jika `src/lib/mbg-constants.ts` berubah, perbarui juga nilai di sini.
- File ini sengaja di luar `src/` dan di-*ignore* ESLint (`eslint.config.js`) agar tidak
  ikut ter-build oleh Vite.
