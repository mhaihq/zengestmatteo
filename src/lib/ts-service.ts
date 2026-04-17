import { supabase, type Invoice, type ClientWithFiscal } from './supabase';
import { buildTSPayload, type TSPayload } from './invoice-rules';
import { updateInvoice } from './invoice-service';

export type { TSPayload };

export async function getEligibleInvoices(professionistaId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, patient:clients(id, name, email, codice_fiscale, ts_opposizione, is_foreign)')
    .eq('professionista_id', professionistaId)
    .eq('ts_eligible', true)
    .eq('ts_status', 'pending')
    .order('data_emissione', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateTSStatus(
  invoiceId: string,
  status: Invoice['ts_status'],
  protocol?: string,
  errorMessage?: string
): Promise<void> {
  await updateInvoice(invoiceId, {
    ts_status: status,
    ts_protocol: protocol ?? null,
    ts_sent_at: status === 'sent' || status === 'accepted' ? new Date().toISOString() : undefined,
    ts_error_message: errorMessage ?? null,
  });
}

export function generateTSExportXML(
  invoices: Invoice[],
  patients: Record<string, Pick<ClientWithFiscal, 'id' | 'codice_fiscale' | 'ts_opposizione' | 'is_foreign'>>
): string {
  const payloads: TSPayload[] = invoices
    .filter((inv) => inv.numero && inv.type === 'fattura')
    .map((inv) => {
      const patient = patients[inv.patient_id] ?? { codice_fiscale: null, ts_opposizione: false, is_foreign: false };
      return buildTSPayload(inv, patient);
    });

  const year = new Date().getFullYear();
  const rows = payloads
    .map(
      (p) =>
        `  <Spesa>
    <CFCittadino>${p.cfCittadino}</CFCittadino>
    <DataDocumento>${p.dataDoc}</DataDocumento>
    <NumDocumento>${p.numDoc}</NumDocumento>
    <TipoDocumento>${p.tipoDoc}</TipoDocumento>
    <TipoSpesa>${p.tipoSpesa}</TipoSpesa>
    <Importo>${p.importo.toFixed(2)}</Importo>
    <FlagPagamento>${p.flagPagamento}</FlagPagamento>
    <FlagOpposizione>${p.flagOpposizione}</FlagOpposizione>
  </Spesa>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<SpeseSanitarie anno="${year}">
${rows}
</SpeseSanitarie>`;
}

export async function sendInvoiceToTS(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-to-ts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
    const json = await response.json();
    if (!response.ok) {
      return { success: false, error: json.error ?? 'Errore sconosciuto' };
    }
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore di rete' };
  }
}
