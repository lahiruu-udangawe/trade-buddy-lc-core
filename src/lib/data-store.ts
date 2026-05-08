import { supabase } from "@/integrations/supabase/client";
import { importLCs, exportLCs } from "@/lib/mock-lc-data";
import { importWoLCs } from "@/lib/mock-import-wo-lc";
import { exportWoLCs } from "@/lib/mock-export-wo-lc";
import { guarantees } from "@/lib/mock-guarantees";
import type { ImportLC, ExportLC } from "@/lib/lc-types";
import type { ImportWoLC } from "@/lib/import-wo-lc-types";
import type { ExportWoLC } from "@/lib/export-wo-lc-types";
import type { Guarantee } from "@/lib/guarantee-types";

type TableName = "import_lcs" | "export_lcs" | "import_wo_lcs" | "export_wo_lcs" | "guarantees";

const tableFor = (kind: TableName) => kind;

function rowToRecord(row: { id: string; reference: string; status: string; data: unknown }) {
  const data = (row.data ?? {}) as Record<string, unknown>;
  return { ...data, id: row.id, reference: row.reference, status: row.status };
}

async function loadInto<T extends { id: string; reference: string; status: string }>(
  table: TableName,
  arr: T[],
) {
  const { data, error } = await supabase.from(table).select("id,reference,status,data").order("created_at", { ascending: false });
  if (error) {
    console.error(`[data-store] load ${table}`, error);
    return;
  }
  arr.length = 0;
  for (const row of data ?? []) arr.push(rowToRecord(row) as T);
}

let hydrated = false;
let hydrating: Promise<void> | null = null;

export async function hydrateAll() {
  if (hydrated) return;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    await Promise.all([
      loadInto("import_lcs", importLCs as ImportLC[]),
      loadInto("export_lcs", exportLCs as ExportLC[]),
      loadInto("import_wo_lcs", importWoLCs as ImportWoLC[]),
      loadInto("export_wo_lcs", exportWoLCs as ExportWoLC[]),
      loadInto("guarantees", guarantees as Guarantee[]),
    ]);
    hydrated = true;
  })();
  return hydrating;
}

export function isHydrated() {
  return hydrated;
}

function summary(record: Record<string, unknown>) {
  const amount = (record.amount ?? record.invoiceAmount) as number | undefined;
  const currency = record.currency as string | undefined;
  const cp =
    ((record.beneficiary as { name?: string } | undefined)?.name) ||
    ((record.supplier as { name?: string } | undefined)?.name) ||
    ((record.buyer as { name?: string } | undefined)?.name) ||
    ((record.applicant as { name?: string } | undefined)?.name);
  const country =
    ((record.beneficiary as { country?: string } | undefined)?.country) ||
    ((record.supplier as { country?: string } | undefined)?.country) ||
    ((record.buyer as { country?: string } | undefined)?.country) ||
    (record.countryOfOrigin as string | undefined) ||
    (record.countryOfDestination as string | undefined);
  return { amount, currency, counterparty: cp, country };
}

export async function createRecord<T extends { reference: string; status: string }>(
  table: TableName,
  record: T,
  arr: T[],
) {
  const { data: u } = await supabase.auth.getUser();
  const meta = summary(record as unknown as Record<string, unknown>);
  const { data, error } = await supabase
    .from(table)
    .insert({
      reference: record.reference,
      status: record.status,
      currency: meta.currency,
      amount: meta.amount,
      counterparty: meta.counterparty,
      country: meta.country,
      data: record as unknown as Record<string, unknown>,
      created_by: u.user?.id ?? null,
    })
    .select("id,reference,status,data")
    .single();
  if (error) throw error;
  const full = rowToRecord(data) as T;
  arr.unshift(full);
  return full;
}

export async function updateRecord<T extends { id: string; reference: string; status: string }>(
  table: TableName,
  record: T,
) {
  const meta = summary(record as unknown as Record<string, unknown>);
  const { error } = await supabase
    .from(table)
    .update({
      reference: record.reference,
      status: record.status,
      currency: meta.currency,
      amount: meta.amount,
      counterparty: meta.counterparty,
      country: meta.country,
      data: record as unknown as Record<string, unknown>,
    })
    .eq("id", record.id);
  if (error) throw error;
}

export { tableFor };