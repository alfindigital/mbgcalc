# Panduan Kontribusi

Terima kasih sudah tertarik berkontribusi! Dokumen ini menjelaskan cara kerja proyek
dan bagaimana kamu bisa ikut berkontribusi.

---

## Cara berkontribusi

### 1. Fork & clone

```bash
git clone https://github.com/YOUR_USERNAME/mbgcalc.git
cd mbgcalc
npm install
```

### 2. Buat branch

Gunakan prefix yang jelas:

| Prefix | Kapan dipakai |
|---|---|
| `feat/` | Fitur baru |
| `fix/` | Perbaikan bug |
| `data/` | Update data anggaran MBG |
| `docs/` | Perbaikan dokumentasi |
| `refactor/` | Refactoring tanpa perubahan perilaku |

```bash
git checkout -b feat/nama-fitur
```

### 3. Kembangkan

```bash
npm run dev        # server dev
npm test           # unit test — HARUS lulus sebelum PR
npm run lint       # ESLint — zero warning
npm run build      # pastikan build tidak error
```

### 4. Commit

Gunakan format [Conventional Commits](https://conventionalcommits.org):

```
feat: tambah mode perbandingan preset
fix: perbaiki format angka desimal di Safari
data: update anggaran MBG Q3 2026
docs: perjelas metodologi di README
```

### 5. Pull Request

- Deskripsikan **apa** yang berubah dan **mengapa**
- Cantumkan sumber data jika mengubah angka di `mbg-constants.ts` atau `presets.ts`
- Pastikan semua test lulus

---

## Aturan penting

### Update data MBG

Semua angka ada di **satu tempat**: [`src/lib/mbg-constants.ts`](src/lib/mbg-constants.ts).
Ubah di sana — biaya harian dan seluruh turunannya otomatis menyesuaikan.

Setiap preset di [`src/lib/presets.ts`](src/lib/presets.ts) **wajib** punya `source`
yang bisa diverifikasi (URL ke sumber berita/dokumen resmi).

### Jangan commit

- File `.env*` (kecuali `.env.example`)
- API key, token, atau credential apa pun
- Folder `.agents/`, `.gemini/`, `.cursor/` (sudah di-gitignore)

### Code style

- TypeScript strict — tidak ada `any` eksplisit
- Komponen kecil dan focused
- Aksesibilitas: label ARIA, navigasi keyboard, live region untuk screen reader

---

## Struktur test

```bash
npm test              # unit test semua (Vitest)
npm run test:watch    # watch mode
```

Unit test ada di:
- `src/lib/units.test.ts` — konversi inti
- `src/lib/terbilang.test.ts` — angka ke kata

---

## Lisensi

Dengan berkontribusi, kamu setuju bahwa kontribusimu dilisensikan di bawah [MIT License](LICENSE).
