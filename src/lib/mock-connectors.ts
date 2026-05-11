// Mock third-party connectors for trade workflows.
// Simulates realistic API responses with random latency so the UI can demo
// sanctions screening, FX rates, KYC, vessel tracking, BIC lookup and credit
// bureau checks without a real network call.

export type ConnectorResult<T> = {
  provider: string;
  endpoint: string;
  requestedAt: string;
  latencyMs: number;
  status: "ok" | "hit" | "warning" | "error";
  data: T;
};

const wait = (min = 250, max = 900) =>
  new Promise<number>((r) => {
    const ms = Math.floor(min + Math.random() * (max - min));
    setTimeout(() => r(ms), ms);
  });

const seed = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const rand = (s: string, mod: number) => seed(s) % mod;

const SANCTIONED_TOKENS = ["pyongyang", "tehran", "havana", "crimea", "donetsk", "luhansk", "myanmar military"];
const HIGH_RISK_COUNTRIES = ["IR", "KP", "SY", "CU", "RU", "BY", "MM"];

// ───── Sanctions: Refinitiv World-Check ─────
export async function refinitivWorldCheck(party: { name: string; country?: string }): Promise<
  ConnectorResult<{ matches: Array<{ listName: string; entity: string; score: number; type: string }>; recommendation: string }>
> {
  const ms = await wait();
  const lower = `${party.name} ${party.country ?? ""}`.toLowerCase();
  const hit = SANCTIONED_TOKENS.some((t) => lower.includes(t)) || rand(party.name, 100) < 5;
  const matches = hit
    ? [
        { listName: "OFAC SDN", entity: party.name, score: 92 + rand(party.name, 8), type: "Individual/Entity" },
        { listName: "EU Consolidated", entity: party.name, score: 85 + rand(party.name + "eu", 10), type: "Sanctions" },
      ]
    : [];
  return {
    provider: "Refinitiv World-Check",
    endpoint: "POST /v2/cases/screening",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: hit ? "hit" : "ok",
    data: { matches, recommendation: hit ? "Block / escalate to Compliance" : "Clear — no adverse match" },
  };
}

// ───── Sanctions: Dow Jones Risk & Compliance ─────
export async function dowJonesScreen(party: { name: string; country?: string }): Promise<
  ConnectorResult<{ pep: boolean; adverseMedia: number; sanctions: boolean; riskScore: number }>
> {
  const ms = await wait();
  const r = rand(party.name + "dj", 100);
  return {
    provider: "Dow Jones R&C",
    endpoint: "GET /api/v1/screening/profile",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: r > 90 ? "warning" : "ok",
    data: {
      pep: r > 95,
      adverseMedia: r > 80 ? Math.min(12, r - 80) : 0,
      sanctions: r > 97,
      riskScore: Math.min(100, r),
    },
  };
}

// ───── Sanctions: OFAC SDN direct lookup ─────
export async function ofacSdnLookup(party: { name: string }): Promise<
  ConnectorResult<{ found: boolean; sdnId?: string; program?: string }>
> {
  const ms = await wait(150, 500);
  const hit = SANCTIONED_TOKENS.some((t) => party.name.toLowerCase().includes(t));
  return {
    provider: "U.S. Treasury OFAC",
    endpoint: "GET /sdn_advanced",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: hit ? "hit" : "ok",
    data: hit
      ? { found: true, sdnId: `SDN-${rand(party.name, 99999)}`, program: "SDGT" }
      : { found: false },
  };
}

// ───── FX rates: Bloomberg ─────
const BASE_RATES: Record<string, number> = {
  USD: 1, EUR: 1.085, GBP: 1.272, JPY: 0.0067, CNY: 0.139, BDT: 0.0091,
  INR: 0.0119, AED: 0.272, SGD: 0.741, CHF: 1.118, AUD: 0.658,
};

export async function bloombergFx(pair: { from: string; to: string; amount?: number }): Promise<
  ConnectorResult<{ pair: string; bid: number; ask: number; mid: number; converted?: number; tier: string }>
> {
  const ms = await wait(80, 280);
  const f = BASE_RATES[pair.from] ?? 1;
  const t = BASE_RATES[pair.to] ?? 1;
  const mid = +(f / t).toFixed(6);
  const spread = mid * 0.0008;
  const bid = +(mid - spread).toFixed(6);
  const ask = +(mid + spread).toFixed(6);
  return {
    provider: "Bloomberg BFIX",
    endpoint: "GET /reference/fx/spot",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: "ok",
    data: {
      pair: `${pair.from}/${pair.to}`,
      bid, ask, mid,
      converted: pair.amount ? +(pair.amount * mid).toFixed(2) : undefined,
      tier: "INSTITUTIONAL",
    },
  };
}

// ───── FX rates: Reuters Eikon ─────
export async function reutersFx(pair: { from: string; to: string }): Promise<
  ConnectorResult<{ pair: string; rate: number; change24h: number; volatility: string }>
> {
  const ms = await wait(80, 280);
  const f = BASE_RATES[pair.from] ?? 1;
  const t = BASE_RATES[pair.to] ?? 1;
  const rate = +(f / t).toFixed(6);
  const drift = ((rand(pair.from + pair.to, 200) - 100) / 10000);
  return {
    provider: "Refinitiv Eikon",
    endpoint: "GET /data/quotes",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: "ok",
    data: {
      pair: `${pair.from}${pair.to}=R`,
      rate: +(rate * (1 + drift)).toFixed(6),
      change24h: +(drift * 100).toFixed(3),
      volatility: Math.abs(drift) > 0.005 ? "ELEVATED" : "NORMAL",
    },
  };
}

// ───── KYC / CDD: LSEG Qual-ID ─────
export async function lsegKyc(party: { name: string; country?: string }): Promise<
  ConnectorResult<{ verified: boolean; level: string; documentsValid: number; lastReview: string }>
> {
  const ms = await wait(300, 1100);
  const r = rand(party.name + "kyc", 100);
  return {
    provider: "LSEG Qual-ID",
    endpoint: "POST /kyc/verify",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: r > 92 ? "warning" : "ok",
    data: {
      verified: r <= 92,
      level: r > 60 ? "ENHANCED" : "STANDARD",
      documentsValid: r > 92 ? 2 : 4,
      lastReview: new Date(Date.now() - rand(party.name, 180) * 86400000).toISOString().slice(0, 10),
    },
  };
}

// ───── Vessel tracking: MarineTraffic ─────
export async function marineTraffic(vessel: { imo?: string; name?: string }): Promise<
  ConnectorResult<{ name: string; imo: string; status: string; position: { lat: number; lon: number }; eta: string; port: string }>
> {
  const ms = await wait(200, 700);
  const k = vessel.imo || vessel.name || "MV-UNKNOWN";
  const ports = ["Singapore", "Rotterdam", "Shanghai", "Chittagong", "Jebel Ali", "Hamburg", "Mumbai"];
  return {
    provider: "MarineTraffic",
    endpoint: "GET /api/exportvessel/v:8",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: "ok",
    data: {
      name: vessel.name ?? `MV ${k.slice(-4)}`,
      imo: vessel.imo ?? `IMO${9000000 + rand(k, 999999)}`,
      status: ["Underway", "At anchor", "Moored"][rand(k, 3)],
      position: { lat: +(((rand(k, 18000) - 9000) / 100)).toFixed(4), lon: +(((rand(k + "lon", 36000) - 18000) / 100)).toFixed(4) },
      eta: new Date(Date.now() + (rand(k, 30) + 1) * 86400000).toISOString().slice(0, 10),
      port: ports[rand(k, ports.length)],
    },
  };
}

// ───── SWIFT BIC directory ─────
export async function swiftBicLookup(bic: string): Promise<
  ConnectorResult<{ bic: string; bank: string; branch: string; country: string; active: boolean }>
> {
  const ms = await wait(80, 250);
  const known: Record<string, { bank: string; branch: string; country: string }> = {
    BKCHCNBJ: { bank: "Bank of China", branch: "Beijing HO", country: "CN" },
    DEUTDEFF: { bank: "Deutsche Bank AG", branch: "Frankfurt", country: "DE" },
    HSBCHKHH: { bank: "HSBC", branch: "Hong Kong", country: "HK" },
    SCBLBDDH: { bank: "Standard Chartered", branch: "Dhaka", country: "BD" },
    CITIUS33: { bank: "Citibank N.A.", branch: "New York", country: "US" },
  };
  const k = bic.toUpperCase();
  const m = known[k];
  return {
    provider: "SWIFT BIC Directory",
    endpoint: "GET /bsl/v1/bic",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: m ? "ok" : "warning",
    data: m
      ? { bic: k, ...m, active: true }
      : { bic: k, bank: "Unknown institution", branch: "—", country: "??", active: false },
  };
}

// ───── Credit bureau: D&B ─────
export async function dunBradstreetCredit(party: { name: string; country?: string }): Promise<
  ConnectorResult<{ duns: string; rating: string; paydex: number; failureScore: number; recommendedLimit: number }>
> {
  const ms = await wait(300, 900);
  const r = rand(party.name + "dnb", 100);
  const ratings = ["5A1", "4A2", "3A2", "2A3", "1A4", "BB", "CB"];
  return {
    provider: "Dun & Bradstreet",
    endpoint: "GET /v1/data/duns",
    requestedAt: new Date().toISOString(),
    latencyMs: ms,
    status: r > 85 ? "warning" : "ok",
    data: {
      duns: `${10000000 + rand(party.name, 89999999)}`,
      rating: ratings[Math.floor(r / 16)] ?? "BB",
      paydex: 100 - r,
      failureScore: r,
      recommendedLimit: Math.max(50000, 2000000 - r * 18000),
    },
  };
}

export const HIGH_RISK = HIGH_RISK_COUNTRIES;

export type ConnectorId =
  | "refinitiv" | "dowjones" | "ofac" | "bloomberg" | "reuters"
  | "lseg" | "marinetraffic" | "swiftbic" | "dnb";

export const CONNECTORS: Array<{ id: ConnectorId; name: string; category: string; description: string }> = [
  { id: "refinitiv", name: "Refinitiv World-Check", category: "Sanctions", description: "Global sanctions, PEP and adverse-media screening." },
  { id: "dowjones", name: "Dow Jones R&C", category: "Sanctions", description: "Risk & Compliance feeds with PEP and adverse-media scoring." },
  { id: "ofac", name: "U.S. Treasury OFAC", category: "Sanctions", description: "OFAC SDN list direct lookup." },
  { id: "bloomberg", name: "Bloomberg BFIX", category: "FX", description: "Spot FX bid/ask and conversion." },
  { id: "reuters", name: "Refinitiv Eikon", category: "FX", description: "Live FX rate with 24h change and volatility." },
  { id: "lseg", name: "LSEG Qual-ID", category: "KYC", description: "Identity verification and CDD level." },
  { id: "marinetraffic", name: "MarineTraffic", category: "Logistics", description: "Vessel position, ETA and port tracking." },
  { id: "swiftbic", name: "SWIFT BIC Directory", category: "Banking", description: "Resolve BIC to bank and branch." },
  { id: "dnb", name: "Dun & Bradstreet", category: "Credit", description: "Counterparty credit rating and recommended limit." },
];
