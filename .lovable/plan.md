
# Kalkulator MBG — Konversi Rupiah ke Waktu MBG

A single-page calculator that converts Indonesian Rupiah into "MBG Time" based on the BGN daily projection of Rp 1.2 Trillion/day.

## Pages & Layout
Single page, mobile-first (max-width 420px centered), with dark/light mode toggle.

## Features

### Header & Theme
- "Kalkulator MBG" title with subtitle showing the daily projection
- Sun/moon dark mode toggle (system preference default, persisted to localStorage)
- Brand colors: navy blue primary (#003366), orange results (#FF6600)

### Rupiah Input
- Large input with inline "Rp" prefix, auto-formatted with dot separators (e.g., 13.900.000)
- Clear button (X), numeric-only with paste sanitization, auto-focus on load
- 3 quick amount buttons: 1 Juta, 10 Juta, 100 Juta (active = filled navy, inactive = outlined)

### Result Card (appears when input > 0)
- Primary result: largest meaningful unit in bold orange (e.g., "1 Detik MBG")
- Full breakdown: Hari, Jam, Menit, Detik, Milidetik
- Copy button (top-right) → copies formatted text, shows "Tersalin!" toast
- Fade-in + slide-up animation on appear

### Save as Image
- "Simpan Gambar" button below results
- Lazy-loads html2canvas, renders branded 1080×1080 card (navy gradient bg, white card with result, footer credits) off-screen, downloads as PNG

### Reverse Mode (expanded by default)
- "Mode Terbalik" section: number input + unit dropdown (Hari/Jam/Menit/Detik/Milidetik)
- Shows "= Rp X" result in real-time

### Footer
- "made by M. Alfin" + data source note

## Performance
- Debounced input (150ms), React.memo on result components
- System font stack, no web fonts
- html2canvas lazy-loaded on demand
- All inline, zero network requests after load

## Edge Cases
- Handles very large numbers (scientific notation if days > 9999), very small numbers (milliseconds), paste sanitization, max safe integer warning
