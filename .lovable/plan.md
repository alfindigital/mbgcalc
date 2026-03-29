

# Plan: Riwayat Konversi + Mode Perbandingan

## 1. Riwayat Konversi (Conversion History)

**Lokasi:** Section baru di bawah Reverse Mode, sebelum Footer.

### Data & Storage
- Simpan array max 10 entry di `localStorage` key `"mbg-history"`
- Tiap entry: `{ rupiah: number, timestamp: number }`
- Otomatis tersimpan saat user selesai input (debounced value > 0 dan berubah dari sebelumnya)
- Duplikat nilai rupiah yang sama tidak disimpan ulang, tapi timestamp diperbarui

### UI
- Header: "Riwayat" dengan tombol "Hapus Semua" (ikon Trash2, muncul hanya jika ada riwayat)
- List entry: tiap item menampilkan "Rp X" di kiri dan hasil utama (e.g. "1 Detik MBG") di kanan
- Tap pada item → mengisi input field dengan nilai tersebut (sama seperti quick button)
- Animasi fade-in saat item baru ditambahkan
- Jika kosong, tidak tampilkan section sama sekali

### Logic
- Custom hook `useHistory()` atau inline di Index — load dari localStorage on mount, save on change
- Fungsi: `addToHistory(rupiah)`, `clearHistory()`, `loadFromHistory(rupiah)`

## 2. Mode Perbandingan (Side-by-Side Comparison)

**Lokasi:** Toggle button di atas area input untuk switch antara "Normal" dan "Bandingkan".

### UI — Mode Toggle
- Pill toggle kecil di bawah header: "Normal" | "Bandingkan"
- Saat "Bandingkan" aktif, tampilkan 2 input field berdampingan (50/50 width)
- Masing-masing punya prefix "Rp", clear button, dan quick buttons sendiri
- Slider disembunyikan di mode perbandingan (ruang terbatas)

### UI — Hasil Perbandingan
- 2 ResultCard ditampilkan side-by-side di bawah input
- Masing-masing card lebih compact (font lebih kecil, hanya primary result + breakdown)
- Di antara 2 card, tampilkan selisih: "Selisih: Rp X = Y Detik MBG"
- Save image dan copy tetap bekerja — capture kedua hasil sekaligus

### State Management
- State baru: `compareMode: boolean`, `rawInput2: string`
- Derive `rupiah2`, `debouncedRupiah2`, `totalMs2` dengan pattern yang sama
- Quick buttons untuk input 2 independen dari input 1

### Responsive
- Di mobile (< 420px): 2 input tetap side-by-side tapi lebih kecil (font 14px)
- Result cards stack vertical di mobile jika terlalu sempit, side-by-side di desktop

## Files to Modify
1. **`src/pages/Index.tsx`** — Semua logic dan UI baru (history section, compare mode toggle, dual inputs, dual results)
2. **`src/index.css`** — Styling tambahan jika perlu (grid layout untuk compare mode)

## Implementation Order
1. Riwayat konversi (simpler, self-contained)
2. Mode perbandingan (more complex, touches input/result flow)

