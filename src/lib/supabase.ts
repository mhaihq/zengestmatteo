import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
};

export type TipoCliente = 'privato' | 'azienda' | 'pa';
export type EsigibilitaIva = 'immediata' | 'differita' | 'split_payment' | null;

export type ClientWithFiscal = Client & {
  codice_fiscale: string | null;
  tariffa_default: number | null;
  metodo_pagamento: 'bonifico' | 'carta' | 'contanti' | null;
  tipo_seduta_default: 'individuale' | 'coppia' | 'primo_colloquio' | 'breve' | null;
  ts_opposizione: boolean;
  is_foreign: boolean;
  tipo_cliente?: TipoCliente;
  ragione_sociale?: string | null;
  partita_iva_cliente?: string | null;
  codice_destinatario?: string | null;
  pec_cliente?: string | null;
  codice_univoco_pa?: string | null;
  bonus_psicologo_attivo?: boolean;
  bonus_psicologo_importo?: number | null;
  esigibilita_iva?: EsigibilitaIva;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  is_zen_template: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  client_id: string | null;
  template_id: string | null;
  session_date: string;
  notes: string;
  session_type: 'recorded' | 'manual';
  created_at: string;
  updated_at: string;
  client?: Pick<Client, 'id' | 'name' | 'email'>;
  template?: Pick<Template, 'id' | 'name'>;
};

export type SessionAttachment = {
  id: string;
  session_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type ProfessionistaFiscalProfile = {
  id: string;
  user_id: string;
  nome_cognome: string;
  partita_iva: string;
  codice_fiscale: string;
  indirizzo_studio: string;
  indirizzo_via: string | null;
  indirizzo_cap: string | null;
  indirizzo_comune: string | null;
  indirizzo_provincia: string | null;
  codice_destinatario: string | null;
  numero_albo: string | null;
  regione_albo: string | null;
  regime_fiscale: 'forfettario' | 'ordinario';
  bollo_a_carico: 'cliente' | 'professionista';
  iban: string | null;
  bic_swift: string | null;
  pec: string | null;
  ts_password: string | null;
  ts_pincode: string | null;
  ts_auto_send: boolean;
  ts_titolare_cf: string | null;
  ts_identificativo: string | null;
  ts_struttura_sanitaria: boolean;
  ts_data_minima_invio: string | null;
  polizza_nome: string | null;
  polizza_numero: string | null;
  polizza_compagnia: string | null;
  polizza_massimale: number | null;
  preavviso_unita: 'ore' | 'giorni' | null;
  preavviso_numero: number | null;
  preavviso_percentuale: number | null;
  next_invoice_number: number;
  invoice_year: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type PrestazioneCategoria =
  | 'abilitazione_riabilitazione'
  | 'arbitrato'
  | 'consulenza_sostegno'
  | 'diagnosi_psicologica'
  | 'docenza'
  | 'formazione_supervisione'
  | 'intervento_clinico'
  | 'mediazione_familiare'
  | 'neuropsicologia'
  | 'perizia_ctu_ctp'
  | 'prevenzione_promozione'
  | 'psicologia_lavoro'
  | 'psicoterapia'
  | 'ricerca_scientifica'
  | 'altro';

export type Prestazione = {
  id: string;
  professionista_id: string;
  nome: string;
  categoria: PrestazioneCategoria;
  prezzo: number;
  is_sanitaria: boolean;
  applica_enpap: boolean;
  predefinita: boolean;
  durata_minuti: number | null;
  attiva: boolean;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  type: 'fattura' | 'proforma' | 'nota_di_credito';
  numero: string | null;
  data_emissione: string;
  professionista_id: string;
  patient_id: string;
  session_id: string | null;
  referenced_invoice_id: string | null;
  descrizione: string;
  importo: number;
  contributo_enpap: number;
  marca_bollo: number;
  totale: number;
  metodo_pagamento: 'bonifico' | 'carta' | 'contanti' | null;
  data_pagamento: string | null;
  pagato: boolean;
  ts_eligible: boolean;
  ts_status: 'not_applicable' | 'pending' | 'sent' | 'accepted' | 'rejected' | 'error';
  ts_protocol: string | null;
  ts_sent_at: string | null;
  ts_error_message: string | null;
  pdf_url: string | null;
  status: 'draft' | 'confirmed' | 'cancelled' | 'credited';
  created_at: string;
  updated_at: string;
  patient?: Pick<Client, 'id' | 'name' | 'email'> & { codice_fiscale?: string | null };
};
