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
import { LiveMbgCounter } from "@/components/LiveMbgCounter";
import { BudgetChart } from "@/components/BudgetChart";

const FAQ = [
  {
    q: "Apa itu program MBG?",
    a: `Program pemerintah yang memberi makan bergizi gratis untuk siswa, ibu hamil, dan balita. Target ${MBG_BUDGET_YEAR}: ${formatRupiah(MBG_RECIPIENTS)} penerima, anggaran ${MBG_ANNUAL_LABEL}.`,
  },
  {
    q: "Bagaimana kalkulator ini menghitung?",
    a: `Nominal Anda dibagi ${MBG_DAILY_LABEL}/hari (anggaran tahunan ÷ 365) untuk satuan waktu, dan Rp ${formatRupiah(MBG_COST_PER_PORSI)}/porsi untuk jumlah porsi.`,
  },
  {
    q: `Dari mana angka ${MBG_ANNUAL_LABEL}?`,
    a: "APBN 2026: pagu Rp 268 T + standby Rp 67 T. Sumber lengkap ada di bawah.",
  },
  {
    q: "Apakah ini angka resmi pemerintah?",
    a: "Bukan. Alat edukasi independen, tidak berafiliasi dengan BGN/pemerintah. Rujuk sumber resmi untuk angka pasti.",
  },
  {
    q: "Apa maksud “porsi makan gratis”?",
    a: `Setiap Rp ${formatRupiah(MBG_COST_PER_PORSI)} setara satu porsi standar BGN — kira-kira jatah makan satu anak per hari.`,
  },
  {
    q: "Bisa disematkan di situs saya?",
    a: "Bisa. Buka halaman utama, klik “Sematkan” di footer, salin iframe. Gratis, tanpa akun.",
  },
];

const TIMELINE = [
  { year: "2024", value: "Rp 0", note: "Masa transisi program" },
  { year: "2025", value: "Rp 71 T", note: "Anggaran perdana" },
  { year: "2026", value: "Rp 335 T", note: "Naik ~4,7× (268 T pagu + 67 T standby)" },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Kalkulator MBG", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Tentang", item: `${SITE_URL}/tentang` },
  ],
};

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
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
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
              Alat edukasi independen yang mengubah nominal Rupiah jadi gambaran konkret: berapa lama
              membiayai program Makan Bergizi Gratis, dan setara berapa <strong className="text-foreground">porsi makan gratis</strong>.
            </p>
          </header>

          <LiveMbgCounter />

          <section className="card-elevated rounded-2xl border-2 border-border p-5 sm:p-6">
            <h2 className="text-lg font-extrabold mb-3">Metodologi</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <li>• Anggaran {MBG_BUDGET_YEAR}: <strong className="text-foreground">{MBG_ANNUAL_LABEL}</strong></li>
              <li>• Biaya harian: <strong className="text-foreground">{MBG_DAILY_LABEL}/hari</strong> (÷ 365)</li>
              <li>• Per porsi: <strong className="text-foreground">Rp {formatRupiah(MBG_COST_PER_PORSI)}</strong> (standar BGN)</li>
              <li>• Penerima: <strong className="text-foreground">{formatRupiah(MBG_RECIPIENTS)}</strong> orang</li>
            </ul>
          </section>

          <section className="card-elevated rounded-2xl border-2 border-border p-5 sm:p-6">
            <h2 className="text-lg font-extrabold mb-4">MBG vs pos APBN 2026</h2>
            <BudgetChart />
          </section>

          <section className="card-elevated rounded-2xl border-2 border-border p-5 sm:p-6">
            <h2 className="text-lg font-extrabold mb-4">Perjalanan anggaran</h2>
            <ol className="relative border-l-2 border-primary/20 ml-2 space-y-4">
              {TIMELINE.map((t) => (
                <li key={t.year} className="pl-4">
                  <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-bold text-primary">{t.year}</span>
                    <span className="text-base font-extrabold">{t.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.note}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-extrabold mb-3">Pertanyaan umum</h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-bold">{item.q}</AccordionTrigger>
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
