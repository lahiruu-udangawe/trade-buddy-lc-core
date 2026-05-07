import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Download, FileSpreadsheet, FileText, TrendingUp, Globe2, ShieldCheck, AlertTriangle } from "lucide-react";
import { importLCs, exportLCs } from "@/lib/mock-lc-data";
import { importWoLCs } from "@/lib/mock-import-wo-lc";
import { exportWoLCs } from "@/lib/mock-export-wo-lc";
import { guarantees } from "@/lib/mock-guarantees";

export const Route = createFileRoute("/reporting/")({
  head: () => ({
    meta: [
      { title: "Reporting & Regulatory — TradeFlow AI" },
      { name: "description", content: "Trade portfolio analytics, regulatory returns and downloadable MIS reports." },
    ],
  }),
  component: Reporting,
});

function fmt(n: number, ccy = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}

function Reporting() {
  const totalImport = importLCs.reduce((s, l) => s + l.amount, 0) + importWoLCs.reduce((s, l) => s + l.invoiceAmount, 0);
  const totalExport = exportLCs.reduce((s, l) => s + l.amount, 0) + exportWoLCs.reduce((s, l) => s + l.invoiceAmount, 0);
  const guaranteeExposure = guarantees.reduce((s, g) => s + g.amount, 0);

  // Country exposure
  const byCountry = new Map<string, number>();
  importLCs.forEach((l) => byCountry.set(l.beneficiary.country, (byCountry.get(l.beneficiary.country) ?? 0) + l.amount));
  importWoLCs.forEach((l) => byCountry.set(l.supplier.country, (byCountry.get(l.supplier.country) ?? 0) + l.invoiceAmount));
  exportLCs.forEach((l) => byCountry.set(l.applicant.country, (byCountry.get(l.applicant.country) ?? 0) + l.amount));
  exportWoLCs.forEach((l) => byCountry.set(l.buyer.country, (byCountry.get(l.buyer.country) ?? 0) + l.invoiceAmount));
  const countryRows = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const countryMax = Math.max(...countryRows.map((r) => r[1]), 1);

  // Product mix
  const products = [
    { label: "Import LC", value: importLCs.reduce((s, l) => s + l.amount, 0) },
    { label: "Export LC", value: exportLCs.reduce((s, l) => s + l.amount, 0) },
    { label: "Import w/o LC", value: importWoLCs.reduce((s, l) => s + l.invoiceAmount, 0) },
    { label: "Export w/o LC", value: exportWoLCs.reduce((s, l) => s + l.invoiceAmount, 0) },
    { label: "Guarantees", value: guaranteeExposure },
  ];
  const productTotal = products.reduce((s, p) => s + p.value, 0) || 1;

  const reports = [
    { code: "BB-IMP", title: "Bangladesh Bank — Online Import Monitoring (IMP)", desc: "IMP filing returns for the month with status reconciliation.", icon: FileText },
    { code: "BB-EXP", title: "Bangladesh Bank — EXP Form Returns", desc: "EXP issuance, realization and overdue export receivables.", icon: FileText },
    { code: "FE-RET", title: "Foreign Exchange Returns (FET)", desc: "Daily/monthly FX position by currency and counterparty.", icon: Globe2 },
    { code: "RIT", title: "RIT (Returns of Inward & Outward Remittance)", desc: "Inward/outward TT and bill remittances classification report.", icon: TrendingUp },
    { code: "OFAC", title: "Sanctions Screening Log", desc: "OFAC / UN / EU / local list screening events with results.", icon: ShieldCheck },
    { code: "OVRD", title: "Overdue Bills Report", desc: "DA, Open Account and Export overdue receivables ageing." },
    { code: "BG-EXP", title: "Guarantee Exposure & Expiry Report", desc: "Outstanding guarantees by type with margin coverage and expiry calendar.", icon: AlertTriangle },
    { code: "MIS", title: "Trade MIS Pack (Excel)", desc: "Consolidated MIS for senior management — volumes, fee income, NPLs.", icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Reporting & Regulatory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Portfolio analytics, regulatory returns, and downloadable MIS for management & central bank.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Import portfolio" value={fmt(totalImport)} />
        <KPI label="Export portfolio" value={fmt(totalExport)} />
        <KPI label="Guarantee exposure" value={fmt(guaranteeExposure)} />
        <KPI label="Active counterparties" value={String(byCountry.size + 24)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2"><Globe2 className="h-4 w-4 text-primary" /> Country Exposure</h2>
            <p className="text-xs text-muted-foreground">Top counterparty countries by trade exposure.</p>
          </div>
          <div className="p-5 space-y-3">
            {countryRows.map(([c, v]) => (
              <div key={c}>
                <div className="flex justify-between text-sm"><span>{c}</span><span className="font-medium">{fmt(v)}</span></div>
                <div className="h-2 mt-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(v / countryMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Product Mix</h2>
            <p className="text-xs text-muted-foreground">Share of trade exposure across products.</p>
          </div>
          <div className="p-5 space-y-3">
            {products.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-sm"><span>{p.label}</span><span className="font-medium">{Math.round((p.value / productTotal) * 100)}%</span></div>
                <div className="h-2 mt-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full" style={{ width: `${(p.value / productTotal) * 100}%`, background: "var(--gradient-accent)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Standard & Regulatory Reports</h2>
          <p className="text-xs text-muted-foreground">Generate, schedule, and download MIS / regulatory returns.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
          {reports.map((r) => {
            const Icon = (r as any).icon ?? FileText;
            return (
              <div key={r.code} className="border rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-muted-foreground">{r.code}</div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border hover:bg-muted"><Download className="h-3.5 w-3.5" /> CSV</button>
                  <button className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border hover:bg-muted"><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</button>
                  <button className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"><FileText className="h-3.5 w-3.5" /> Generate</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-lg border px-4 py-3" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </div>
  );
}