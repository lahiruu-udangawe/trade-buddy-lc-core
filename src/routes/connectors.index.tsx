import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plug, PlayCircle, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import {
  CONNECTORS,
  refinitivWorldCheck, dowJonesScreen, ofacSdnLookup,
  bloombergFx, reutersFx, lsegKyc, marineTraffic, swiftBicLookup, dunBradstreetCredit,
  type ConnectorId, type ConnectorResult,
} from "@/lib/mock-connectors";

export const Route = createFileRoute("/connectors/")({
  head: () => ({
    meta: [
      { title: "Connectors — TradeFlow AI" },
      { name: "description", content: "Mock third-party connectors for sanctions, FX, KYC, vessel and credit data feeds." },
    ],
  }),
  component: ConnectorsPage,
});

const PARTY = { name: "Shanghai Machinery Co.", country: "CN" };

async function run(id: ConnectorId): Promise<ConnectorResult<unknown>> {
  switch (id) {
    case "refinitiv": return refinitivWorldCheck(PARTY);
    case "dowjones": return dowJonesScreen(PARTY);
    case "ofac": return ofacSdnLookup(PARTY);
    case "bloomberg": return bloombergFx({ from: "USD", to: "BDT", amount: 485000 });
    case "reuters": return reutersFx({ from: "EUR", to: "USD" });
    case "lseg": return lsegKyc(PARTY);
    case "marinetraffic": return marineTraffic({ imo: "IMO9321483", name: "MV Pacific Star" });
    case "swiftbic": return swiftBicLookup("BKCHCNBJ");
    case "dnb": return dunBradstreetCredit(PARTY);
  }
}

function ConnectorsPage() {
  const [results, setResults] = useState<Record<string, ConnectorResult<unknown> | "loading" | undefined>>({});

  async function trigger(id: ConnectorId) {
    setResults((r) => ({ ...r, [id]: "loading" }));
    const res = await run(id);
    setResults((r) => ({ ...r, [id]: res }));
  }

  async function runAll() {
    await Promise.all(CONNECTORS.map((c) => trigger(c.id)));
  }

  const grouped = CONNECTORS.reduce<Record<string, typeof CONNECTORS>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Plug className="h-5 w-5" /> Connectors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Mock third-party data feeds powering compliance, FX and logistics workflows.</p>
        </div>
        <button onClick={runAll} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">
          <PlayCircle className="h-4 w-4" /> Run all
        </button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{cat}</div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((c) => {
              const r = results[c.id];
              const loading = r === "loading";
              const data = typeof r === "object" ? r : undefined;
              return (
                <div key={c.id} className="bg-card rounded-lg border p-4 flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
                    </div>
                    <StatusIcon r={data} loading={loading} />
                  </div>
                  <button
                    onClick={() => trigger(c.id)}
                    disabled={loading}
                    className="mt-3 self-start text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border hover:bg-muted disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    {loading ? "Calling…" : data ? "Re-run" : "Test call"}
                  </button>
                  {data && (
                    <div className="mt-3 text-[11px] space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{data.endpoint}</span>
                        <span>{data.latencyMs}ms</span>
                      </div>
                      <pre className="bg-muted/50 rounded p-2 overflow-x-auto text-[11px] leading-relaxed">{JSON.stringify(data.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ r, loading }: { r: ConnectorResult<unknown> | undefined; loading: boolean }) {
  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!r) return <span className="text-[10px] text-muted-foreground">idle</span>;
  if (r.status === "ok") return <CheckCircle2 className="h-4 w-4 text-status-approved" />;
  if (r.status === "warning") return <AlertTriangle className="h-4 w-4 text-status-warning" />;
  if (r.status === "hit" || r.status === "error") return <XCircle className="h-4 w-4 text-status-rejected" />;
  return null;
}
