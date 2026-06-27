import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  MBG_COST_PER_PORSI, MBG_RECIPIENTS, MBG_DATA_UPDATED, MBG_SOURCES,
  MBG_ANNUAL_LABEL, MBG_DAILY_LABEL, MBG_BUDGET_YEAR,
} from "@/lib/mbg-constants";
import { formatRupiah } from "@/lib/units";
import { SITE_URL } from "@/lib/site";

const FAQ = [
  {
    q: "Apa itu program Makan Bergizi Gratis (MBG)?",
    a: `Program pemerintah yang memberi makan bergizi gratis untuk siswa, ibu hamil, dan balita. Pada ${MBG_BUDGET_YEAR} ditargetkan menjangkau ${formatRupiah(MBG_RECIPIENTS)} penerima manfaat dengan anggaran ${MBG_ANNUAL_LABEL}.`,
  },
  {
    q: "Bagaimana kalkulator ini menghitung?",
    a: `Nominal yang Anda masukkan dibandingkan dengan biaya program MBG: ${MBG_DAILY_LABEL}/hari (anggaran tahunan ÷ 365) untuk satuan waktu, dan Rp ${formatRupiah(MBG_COST_PER_PORSI)}/porsi untuk jumlah porsi makan.`,
  },
  {
    q: `Dari mana angka ${MBG_ANNUAL_LABEL}?`,
    a: "Dari APBN 2026 (pagu Rp 268 triliun + dana standby Rp 67 triliun). Tautan sumber lengkap ada di bagian “Sumber data” di bawah.",
  },
  {
    q: "Apakah hasilnya angka resmi pemerintah?",
    a: "Bukan. Ini alat edukasi independen untuk membantu membayangkan skala sebuah angka. Tidak berafiliasi dengan BGN/pemerintah — selalu rujuk sumber resmi untuk angka pasti.",
  },
  {
    q: "Apa maksud “porsi makan gratis”?",
    a: `Setiap Rp ${formatRupiah(MBG_COST_PER_PORSI)} setara satu porsi standar BGN, kira-kira jatah makan satu anak untuk satu hari.`,
  },
];

export default function Tentang() {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Tentang Kalkulator MBG — Metodologi, FAQ & Sumber Data</title>
        <meta
          name="description"
          content={`Penjelasan Kalkulator MBG: metodologi konversi Rupiah ke waktu & porsi program Makan Bergizi Gratis. Anggaran ${MBG_BUDGET_YEAR} ${MBG_ANNUAL_LABEL}, ${MBG_DAILY_LABEL}/hari, Rp ${formatRupiah(MBG_COST_PER_PORSI)}/porsi.`}
        />
        <link rel="canonical" href={`${SITE_URL}/tentang`} />
        <meta property="og:url" content={`${SITE_URL}/tentang`} />
        <meta property="og:title" content="Tentang Kalkulator MBG — Metodologi, FAQ & Sumber Data" />
        <meta property="og:description" content="Metodologi, sumber data, dan pertanyaan yang sering diajukan tentang Kalkulator MBG." />
      </Helmet>

      <header className="border-b-2 border-primary/15 py-3 px-4" style={{ background: "hsl(var(--header-bg))" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Kalkulator
          </Link>
          <span className="text-xs text-muted-foreground font-medium">Tentang</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:py-12">
        <article className="max-w-3xl mx-auto w-full space-y-8">
          <header>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tentang Kalkulator MBG</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Alat edukasi independen untuk mengubah nominal Rupiah jadi gambaran konkret: berapa lama uang itu bisa
              membiayai program Makan Bergizi Gratis, dan setara berapa <strong className="text-foreground">porsi makan gratis</strong>.
              Cocok untuk memahami skala anggaran, belanja, atau angka berita.
            </p>
          </header>

          <section className="card-elevated rounded-2xl border-2 border-border p-5 sm:p-6">
            <h2 className="text-lg font-extrabold mb-3">Metodologi singkat</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <li>• Anggaran MBG {MBG_BUDGET_YEAR}: <strong className="text-foreground">{MBG_ANNUAL_LABEL}</strong></li>
              <li>• Biaya harian: {MBG_ANNUAL_LABEL} ÷ 365 = <strong className="text-foreground">{MBG_DAILY_LABEL}/hari</strong></li>
              <li>• Per porsi: <strong className="text-foreground">Rp {formatRupiah(MBG_COST_PER_PORSI)}</strong> (standar BGN)</li>
              <li>• Target penerima: <strong className="text-foreground">{formatRupiah(MBG_RECIPIENTS)}</strong> orang</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-extrabold mb-3">Pertanyaan yang sering diajukan</h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm sm:text-base font-bold">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="card-elevated rounded-2xl border-2 border-border p-5 sm:p-6">
            <h2 className="text-lg font-extrabold mb-3 inline-flex items-center gap-1.5">
              <Info size={16} aria-hidden="true" /> Sumber data
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {MBG_SOURCES.map((s) => (
                <li key={s.url}>
                  •{" "}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
              Diperbarui {MBG_DATA_UPDATED}. Alat edukasi independen — bukan afiliasi resmi BGN/pemerintah.
            </p>
          </section>

          <div className="text-center pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-accent transition-colors"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Kembali ke kalkulator
            </Link>
          </div>
        </article>
      </main>

      <footer className="border-t-2 border-primary/15 py-3 px-4" style={{ background: "hsl(var(--footer-bg))" }}>
        <p className="text-center text-[11px] text-muted-foreground font-medium">
          made by <span className="font-bold text-primary">M. Alfin</span>
        </p>
      </footer>
    </div>
  );
}
