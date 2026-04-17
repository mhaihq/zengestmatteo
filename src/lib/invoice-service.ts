import { supabase, type Invoice, type ProfessionistaFiscalProfile } from './supabase';
import { calculateInvoice, isEligibleForTS, formatInvoiceNumber } from './invoice-rules';

export async function fetchProfessionistaProfile(userId: string): Promise<ProfessionistaFiscalProfile | null> {
  const { data, error } = await supabase
    .from('professionista_fiscal_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAnyProfessionistaProfile(): Promise<ProfessionistaFiscalProfile | null> {
  const { data, error } = await supabase
    .from('professionista_fiscal_profile')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfessionistaProfile(
  userId: string,
  profile: Partial<Omit<ProfessionistaFiscalProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ProfessionistaFiscalProfile> {
  const { data, error } = await supabase
    .from('professionista_fiscal_profile')
    .upsert({ ...profile, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchInvoices(
  professionistaId: string,
  filters?: {
    patientId?: string;
    pagato?: boolean;
    tsStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<Invoice[]> {
  let query = supabase
    .from('invoices')
    .select('*, patient:clients(id, name, email, codice_fiscale)')
    .eq('professionista_id', professionistaId)
    .order('data_emissione', { ascending: false });

  if (filters?.patientId) query = query.eq('patient_id', filters.patientId);
  if (filters?.pagato !== undefined) query = query.eq('pagato', filters.pagato);
  if (filters?.tsStatus) query = query.eq('ts_status', filters.tsStatus);
  if (filters?.dateFrom) query = query.gte('data_emissione', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('data_emissione', filters.dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, patient:clients(id, name, email, codice_fiscale)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

interface CreateInvoiceInput {
  type: Invoice['type'];
  professionistaId: string;
  patientId: string;
  sessionId?: string;
  referencedInvoiceId?: string;
  descrizione: string;
  importo: number;
  metodo_pagamento?: Invoice['metodo_pagamento'];
  data_pagamento?: string;
  pagato?: boolean;
  data_emissione?: string;
  professionista: Pick<ProfessionistaFiscalProfile, 'bollo_a_carico'>;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const calc = calculateInvoice(input.professionista, input.importo);
  let userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    const { data: profRow } = await supabase
      .from('professionista_fiscal_profile')
      .select('user_id')
      .eq('id', input.professionistaId)
      .maybeSingle();
    if (profRow) userId = profRow.user_id;
  }

  let numero: string | null = null;

  if (input.type === 'fattura') {
    if (userId) {
      const { data: numData, error: numError } = await supabase.rpc('get_next_invoice_number', {
        p_user_id: userId,
      });
      if (!numError && numData && numData.length > 0) {
        numero = formatInvoiceNumber(numData[0].next_number, numData[0].invoice_year);
      }
    }
  }

  const pagato = input.pagato ?? false;
  const ts_eligible = isEligibleForTS(
    { type: input.type, pagato, data_pagamento: input.data_pagamento ?? null }
  );

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      type: input.type,
      numero,
      data_emissione: input.data_emissione ?? new Date().toISOString().split('T')[0],
      professionista_id: input.professionistaId,
      patient_id: input.patientId,
      session_id: input.sessionId ?? null,
      referenced_invoice_id: input.referencedInvoiceId ?? null,
      descrizione: input.descrizione,
      importo: calc.importo,
      contributo_enpap: calc.contributo_enpap,
      marca_bollo: calc.marca_bollo,
      totale: calc.totale,
      metodo_pagamento: input.metodo_pagamento ?? null,
      data_pagamento: input.data_pagamento ?? null,
      pagato,
      ts_eligible,
      ts_status: input.type === 'fattura' ? 'pending' : 'not_applicable',
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInvoice(
  id: string,
  updates: Partial<Pick<Invoice, 'pagato' | 'data_pagamento' | 'metodo_pagamento' | 'ts_status' | 'ts_protocol' | 'ts_sent_at' | 'ts_error_message' | 'status' | 'pdf_url' | 'ts_eligible'>>
): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function createAutoInvoice(
  sessionId: string,
  patientId: string,
  professionistaId: string,
  sessionTariffa?: number
): Promise<Invoice | null> {
  const { data: patient, error: pErr } = await supabase
    .from('clients')
    .select('id, name, email, codice_fiscale, tariffa_default, metodo_pagamento, ts_opposizione')
    .eq('id', patientId)
    .maybeSingle();
  if (pErr || !patient) return null;

  const { data: professionista, error: profErr } = await supabase
    .from('professionista_fiscal_profile')
    .select('*')
    .eq('id', professionistaId)
    .maybeSingle();
  if (profErr || !professionista) return null;

  const amount = sessionTariffa ?? patient.tariffa_default;
  if (!amount) return null;

  if (!patient.codice_fiscale) {
    const calc = calculateInvoice(professionista, amount);
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        type: 'fattura',
        numero: null,
        data_emissione: new Date().toISOString().split('T')[0],
        professionista_id: professionistaId,
        patient_id: patientId,
        session_id: sessionId,
        descrizione: 'Prestazione psicologica',
        importo: calc.importo,
        contributo_enpap: calc.contributo_enpap,
        marca_bollo: calc.marca_bollo,
        totale: calc.totale,
        metodo_pagamento: patient.metodo_pagamento ?? null,
        pagato: false,
        ts_eligible: false,
        ts_status: 'pending',
        status: 'draft',
      })
      .select()
      .single();
    if (error) return null;
    return data;
  }

  return createInvoice({
    type: 'fattura',
    professionistaId,
    patientId,
    sessionId,
    descrizione: 'Prestazione psicologica',
    importo: amount,
    metodo_pagamento: patient.metodo_pagamento ?? undefined,
    professionista,
  });
}

export async function generateInvoicePDF(
  invoiceId: string
): Promise<{ success: boolean; pdf_url?: string; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-invoice-pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
    const json = await response.json();
    if (!response.ok) {
      return { success: false, error: json.error ?? 'PDF generation failed' };
    }
    return { success: true, pdf_url: json.pdf_url };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}
