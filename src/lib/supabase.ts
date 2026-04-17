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

export type ClientWithFiscal = Client & {
  codice_fiscale: string | null;
  tariffa_default: number | null;
  metodo_pagamento: 'bonifico' | 'carta' | 'contanti' | null;
  tipo_seduta_default: 'individuale' | 'coppia' | 'primo_colloquio' | 'breve' | null;
  ts_opposizione: boolean;
  is_foreign: boolean;
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
  regime_fiscale: 'forfettario' | 'ordinario';
  bollo_a_carico: 'cliente' | 'professionista';
  iban: string | null;
  pec: string | null;
  ts_password: string | null;
  ts_pincode: string | null;
  ts_auto_send: boolean;
  next_invoice_number: number;
  invoice_year: number;
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
