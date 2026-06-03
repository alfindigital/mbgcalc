// Konversi angka ke kata bahasa Indonesia (terbilang)
const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];

function below1000(n: number): string {
  if (n < 10) return SATUAN[n];
  if (n < 20) {
    if (n === 10) return "sepuluh";
    if (n === 11) return "sebelas";
    return SATUAN[n - 10] + " belas";
  }
  if (n < 100) {
    const p = Math.floor(n / 10);
    const s = n % 10;
    return SATUAN[p] + " puluh" + (s ? " " + SATUAN[s] : "");
  }
  const r = Math.floor(n / 100);
  const sisa = n % 100;
  const ratusan = r === 1 ? "seratus" : SATUAN[r] + " ratus";
  return sisa ? ratusan + " " + below1000(sisa) : ratusan;
}

export function terbilang(num: number): string {
  if (!isFinite(num)) return "";
  num = Math.floor(Math.abs(num));
  if (num === 0) return "nol";

  const scales = [
    { v: 1_000_000_000_000_000, label: "kuadriliun" },
    { v: 1_000_000_000_000, label: "triliun" },
    { v: 1_000_000_000, label: "miliar" },
    { v: 1_000_000, label: "juta" },
    { v: 1_000, label: "ribu" },
  ];

  let out = "";
  for (const { v, label } of scales) {
    if (num >= v) {
      const q = Math.floor(num / v);
      num = num % v;
      if (v === 1_000 && q === 1) {
        out += "seribu ";
      } else {
        out += below1000(q) + " " + label + " ";
      }
    }
  }
  if (num > 0) out += below1000(num);
  return out.trim();
}
