import type { Client, ClientWithFiscal, Session, Template, Invoice, ProfessionistaFiscalProfile, Prestazione } from './supabase';

// ─── Clients ─────────────────────────────────────────────────────────────────

export const MOCK_CLIENTS: ClientWithFiscal[] = [
  { id: 'c1', name: 'Marco Bianchi', email: 'marco.bianchi@email.it', phone: '+39 339 1234567', date_of_birth: '1988-04-12', gender: 'M', codice_fiscale: 'BNCMRC88D12F205X', tariffa_default: 80, metodo_pagamento: 'bonifico', tipo_seduta_default: 'individuale', ts_opposizione: false, is_foreign: false, created_at: '2026-01-10T09:00:00Z', updated_at: '2026-01-10T09:00:00Z' },
  { id: 'c2', name: 'Sofia Ricci', email: 'sofia.ricci@gmail.com', phone: '+39 347 9876543', date_of_birth: '1995-09-23', gender: 'F', codice_fiscale: 'RCCSFO95P63H501Y', tariffa_default: 90, metodo_pagamento: 'carta', tipo_seduta_default: 'individuale', ts_opposizione: false, is_foreign: false, created_at: '2026-01-12T10:00:00Z', updated_at: '2026-01-12T10:00:00Z' },
  { id: 'c3', name: 'Luca Ferrari', email: 'luca.ferrari@libero.it', phone: '+39 328 4561230', date_of_birth: '1979-01-05', gender: 'M', codice_fiscale: 'FRRLCU79A05D612Z', tariffa_default: 100, metodo_pagamento: 'contanti', tipo_seduta_default: 'individuale', ts_opposizione: true, is_foreign: false, created_at: '2026-01-15T11:00:00Z', updated_at: '2026-01-15T11:00:00Z' },
  { id: 'c4', name: 'Giulia Rossi', email: 'giulia.rossi@outlook.it', phone: '+39 333 7890123', date_of_birth: '2001-07-18', gender: 'F', codice_fiscale: 'RSSGLL01L58H501W', tariffa_default: 70, metodo_pagamento: 'bonifico', tipo_seduta_default: 'primo_colloquio', ts_opposizione: false, is_foreign: false, created_at: '2026-01-20T09:30:00Z', updated_at: '2026-01-20T09:30:00Z' },
  { id: 'c5', name: 'Alessandro Conti', email: 'a.conti@gmail.com', phone: '+39 340 3456789', date_of_birth: '1965-11-30', gender: 'M', codice_fiscale: 'CNTLSN65S30F839V', tariffa_default: 100, metodo_pagamento: 'carta', tipo_seduta_default: 'individuale', ts_opposizione: false, is_foreign: false, created_at: '2026-02-01T14:00:00Z', updated_at: '2026-02-01T14:00:00Z' },
  { id: 'c6', name: 'Elena Marini', email: 'elena.marini@yahoo.it', phone: '+39 349 6543210', date_of_birth: '1990-03-08', gender: 'F', codice_fiscale: 'MRNLNE90C48G224U', tariffa_default: 80, metodo_pagamento: 'bonifico', tipo_seduta_default: 'individuale', ts_opposizione: false, is_foreign: false, created_at: '2026-02-05T10:00:00Z', updated_at: '2026-02-05T10:00:00Z' },
  { id: 'c7', name: 'Giovanni e Laura Esposito', email: 'gesposito@email.it', phone: '+39 334 2109876', date_of_birth: '1982-06-15', gender: 'M', codice_fiscale: 'SPSGNN82H15F839T', tariffa_default: 120, metodo_pagamento: 'bonifico', tipo_seduta_default: 'coppia', ts_opposizione: false, is_foreign: false, created_at: '2026-02-10T15:00:00Z', updated_at: '2026-02-10T15:00:00Z' },
  { id: 'c8', name: 'Chiara Fontana', email: 'chiara.fontana@gmail.com', phone: '+39 345 8765432', date_of_birth: '1998-12-02', gender: 'F', codice_fiscale: 'FNTCHR98T42H501S', tariffa_default: 70, metodo_pagamento: 'contanti', tipo_seduta_default: 'breve', ts_opposizione: false, is_foreign: false, created_at: '2026-02-14T09:00:00Z', updated_at: '2026-02-14T09:00:00Z' },
  { id: 'c9', name: 'Roberto Greco', email: 'roberto.greco@pec.it', phone: '+39 347 1357924', date_of_birth: '1973-08-27', gender: 'M', codice_fiscale: 'GRCRBT73M27H501R', tariffa_default: 100, metodo_pagamento: 'carta', tipo_seduta_default: 'individuale', ts_opposizione: true, is_foreign: false, created_at: '2026-02-20T11:00:00Z', updated_at: '2026-02-20T11:00:00Z' },
  { id: 'c10', name: 'Valentina De Luca', email: 'v.deluca@email.com', phone: '+39 320 2468013', date_of_birth: '1985-02-14', gender: 'F', codice_fiscale: 'DLCVNT85B54F205Q', tariffa_default: 90, metodo_pagamento: 'bonifico', tipo_seduta_default: 'individuale', ts_opposizione: false, is_foreign: false, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z' },
  { id: 'c11', name: 'Matteo Bruno', email: 'matteo.bruno@gmail.com', phone: '+39 338 9753108', date_of_birth: '2003-10-09', gender: 'M', codice_fiscale: 'BRNMTT03R09H501P', tariffa_default: 70, metodo_pagamento: 'carta', tipo_seduta_default: 'individuale', ts_opposizione: false, is_foreign: false, created_at: '2026-03-05T09:00:00Z', updated_at: '2026-03-05T09:00:00Z' },
  { id: 'c12', name: 'Francesca Lombardi', email: 'f.lombardi@virgilio.it', phone: '+39 329 1472583', date_of_birth: '1968-05-21', gender: 'F', codice_fiscale: 'LMBFNC68E61G224N', tariffa_default: 100, metodo_pagamento: 'bonifico', tipo_seduta_default: 'individuale', ts_opposizione: false, is_foreign: false, created_at: '2026-03-10T14:00:00Z', updated_at: '2026-03-10T14:00:00Z' },
  { id: 'c13', name: 'Thomas Müller', email: 'thomas.mueller@gmail.de', phone: '+49 176 55443322', date_of_birth: '1991-03-17', gender: 'M', codice_fiscale: null, tariffa_default: 100, metodo_pagamento: 'carta', tipo_seduta_default: 'individuale', ts_opposizione: false, is_foreign: true, created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-15T10:00:00Z' },
  { id: 'c14', name: 'Sara e Pietro Mancini', email: 'mancini.coppia@email.it', phone: '+39 342 3698521', date_of_birth: '1980-09-04', gender: 'F', codice_fiscale: 'MNCSRA80P44H501M', tariffa_default: 130, metodo_pagamento: 'bonifico', tipo_seduta_default: 'coppia', ts_opposizione: false, is_foreign: false, created_at: '2026-03-20T11:00:00Z', updated_at: '2026-03-20T11:00:00Z' },
  { id: 'c15', name: 'Andrea Moretti', email: null, phone: '+39 335 7418529', date_of_birth: '1957-12-11', gender: 'M', codice_fiscale: 'MRTNDR57T11G224L', tariffa_default: 80, metodo_pagamento: 'contanti', tipo_seduta_default: 'individuale', ts_opposizione: true, is_foreign: false, created_at: '2026-03-25T09:00:00Z', updated_at: '2026-03-25T09:00:00Z' },
];

// ─── Templates ───────────────────────────────────────────────────────────────

export const MOCK_TEMPLATES: Template[] = [
  { id: 't1', name: 'Individual Therapy', description: 'Standard individual therapy session', is_zen_template: true, user_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 't2', name: 'Couples Therapy', description: 'Couples counseling session', is_zen_template: true, user_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 't3', name: 'Group Therapy', description: 'Group therapy session', is_zen_template: true, user_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 't4', name: 'Family Therapy', description: 'Family counseling session', is_zen_template: true, user_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 't5', name: 'CBT Session', description: 'Cognitive Behavioral Therapy focused template', is_zen_template: true, user_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 't6', name: 'Initial Assessment', description: 'First session intake and assessment', is_zen_template: true, user_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

// ─── Sessions ────────────────────────────────────────────────────────────────

export const MOCK_SESSIONS: (Session & { client: Pick<Client, 'id' | 'name' | 'email'> | null; template: Pick<Template, 'id' | 'name'> | null })[] = [
  { id: 's1', client_id: 'c1', template_id: 't1', session_date: '2026-04-14T10:00:00Z', notes: 'Il paziente riferisce ansia lavorativa e difficoltà nel sonno. Ha iniziato a praticare la mindfulness con buoni risultati iniziali.', session_type: 'manual', created_at: '2026-04-14T10:00:00Z', updated_at: '2026-04-14T10:00:00Z', client: { id: 'c1', name: 'Marco Bianchi', email: 'marco.bianchi@email.it' }, template: { id: 't1', name: 'Individual Therapy' } },
  { id: 's2', client_id: 'c2', template_id: 't1', session_date: '2026-04-13T14:00:00Z', notes: 'Sofia ha riportato miglioramenti nell\'umore. Discutiamo delle strategie di coping per situazioni stressanti.', session_type: 'manual', created_at: '2026-04-13T14:00:00Z', updated_at: '2026-04-13T14:00:00Z', client: { id: 'c2', name: 'Sofia Ricci', email: 'sofia.ricci@gmail.com' }, template: { id: 't1', name: 'Individual Therapy' } },
  { id: 's3', client_id: 'c7', template_id: 't2', session_date: '2026-04-12T16:00:00Z', notes: 'Sessione di coppia. Lavorato sui pattern di comunicazione. Entrambi i partner mostrano buon impegno nel processo terapeutico.', session_type: 'manual', created_at: '2026-04-12T16:00:00Z', updated_at: '2026-04-12T16:00:00Z', client: { id: 'c7', name: 'Giovanni e Laura Esposito', email: 'gesposito@email.it' }, template: { id: 't2', name: 'Couples Therapy' } },
  { id: 's4', client_id: 'c3', template_id: 't5', session_date: '2026-04-10T09:00:00Z', notes: 'Sessione CBT. Identificati i pensieri automatici negativi legati al lavoro. Assegnati esercizi di ristrutturazione cognitiva.', session_type: 'recorded', created_at: '2026-04-10T09:00:00Z', updated_at: '2026-04-10T09:00:00Z', client: { id: 'c3', name: 'Luca Ferrari', email: 'luca.ferrari@libero.it' }, template: { id: 't5', name: 'CBT Session' } },
  { id: 's5', client_id: 'c4', template_id: 't6', session_date: '2026-04-08T11:00:00Z', notes: 'Primo colloquio di valutazione. Giulia ha espresso difficoltà nelle relazioni sociali e bassa autostima. Concordato piano terapeutico mensile.', session_type: 'manual', created_at: '2026-04-08T11:00:00Z', updated_at: '2026-04-08T11:00:00Z', client: { id: 'c4', name: 'Giulia Rossi', email: 'giulia.rossi@outlook.it' }, template: { id: 't6', name: 'Initial Assessment' } },
  { id: 's6', client_id: 'c1', template_id: 't1', session_date: '2026-04-07T10:00:00Z', notes: 'Revisione delle tecniche di igiene del sonno. Marco riferisce di dormire meglio. Continuare con gli esercizi di mindfulness.', session_type: 'manual', created_at: '2026-04-07T10:00:00Z', updated_at: '2026-04-07T10:00:00Z', client: { id: 'c1', name: 'Marco Bianchi', email: 'marco.bianchi@email.it' }, template: { id: 't1', name: 'Individual Therapy' } },
  { id: 's7', client_id: 'c5', template_id: 't1', session_date: '2026-04-05T15:00:00Z', notes: 'Alessandro lavora sull\'elaborazione del lutto per la perdita del genitore. Sessione emotivamente intensa ma produttiva.', session_type: 'manual', created_at: '2026-04-05T15:00:00Z', updated_at: '2026-04-05T15:00:00Z', client: { id: 'c5', name: 'Alessandro Conti', email: 'a.conti@gmail.com' }, template: { id: 't1', name: 'Individual Therapy' } },
  { id: 's8', client_id: 'c6', template_id: 't1', session_date: '2026-04-03T10:30:00Z', notes: 'Elena discute delle difficoltà nel gestire le aspettative familiari. Introdotte tecniche di assertività.', session_type: 'recorded', created_at: '2026-04-03T10:30:00Z', updated_at: '2026-04-03T10:30:00Z', client: { id: 'c6', name: 'Elena Marini', email: 'elena.marini@yahoo.it' }, template: { id: 't1', name: 'Individual Therapy' } },
  { id: 's9', client_id: 'c14', template_id: 't2', session_date: '2026-03-31T17:00:00Z', notes: 'Sara e Pietro lavorano sulla gestione dei conflitti e sulle aspettative reciproche. Progressi notevoli.', session_type: 'manual', created_at: '2026-03-31T17:00:00Z', updated_at: '2026-03-31T17:00:00Z', client: { id: 'c14', name: 'Sara e Pietro Mancini', email: 'mancini.coppia@email.it' }, template: { id: 't2', name: 'Couples Therapy' } },
  { id: 's10', client_id: 'c2', template_id: 't1', session_date: '2026-03-28T14:00:00Z', notes: 'Sofia affronta il tema dell\'ansia da prestazione. Lavoriamo insieme sulla ristrutturazione cognitiva.', session_type: 'manual', created_at: '2026-03-28T14:00:00Z', updated_at: '2026-03-28T14:00:00Z', client: { id: 'c2', name: 'Sofia Ricci', email: 'sofia.ricci@gmail.com' }, template: { id: 't1', name: 'Individual Therapy' } },
  { id: 's11', client_id: 'c9', template_id: 't1', session_date: '2026-03-25T09:00:00Z', notes: 'Roberto discute di difficoltà nel lavoro e stress cronico. Avviato piano di gestione dello stress.', session_type: 'manual', created_at: '2026-03-25T09:00:00Z', updated_at: '2026-03-25T09:00:00Z', client: { id: 'c9', name: 'Roberto Greco', email: 'roberto.greco@pec.it' }, template: { id: 't1', name: 'Individual Therapy' } },
  { id: 's12', client_id: 'c11', template_id: 't6', session_date: '2026-03-20T11:00:00Z', notes: 'Primo incontro con Matteo. Difficoltà di adattamento al primo anno di università. Concordato percorso di supporto.', session_type: 'manual', created_at: '2026-03-20T11:00:00Z', updated_at: '2026-03-20T11:00:00Z', client: { id: 'c11', name: 'Matteo Bruno', email: 'matteo.bruno@gmail.com' }, template: { id: 't6', name: 'Initial Assessment' } },
];

// ─── Professionista Fiscal Profile ───────────────────────────────────────────

export const MOCK_PROFILE: ProfessionistaFiscalProfile = {
  id: 'prof-1',
  user_id: 'user-1',
  nome_cognome: 'Dott.ssa Maria Rossi',
  partita_iva: '12345678901',
  codice_fiscale: 'RSSMRA80A01H501Z',
  indirizzo_studio: 'Via Roma 42, 20121 Milano (MI)',
  regime_fiscale: 'forfettario',
  bollo_a_carico: 'cliente',
  iban: 'IT60X0542811101000000123456',
  bic_swift: 'BPMIITMMXXX',
  pec: 'maria.rossi@pec.it',
  indirizzo_via: 'Via Roma 42',
  indirizzo_cap: '20121',
  indirizzo_comune: 'Milano',
  indirizzo_provincia: 'MI',
  codice_destinatario: '0000000',
  numero_albo: '03/12345',
  regione_albo: 'Lombardia',
  ts_password: null,
  ts_pincode: null,
  ts_auto_send: false,
  ts_titolare_cf: null,
  ts_identificativo: null,
  ts_struttura_sanitaria: false,
  ts_data_minima_invio: null,
  polizza_nome: null,
  polizza_numero: null,
  polizza_compagnia: null,
  polizza_massimale: null,
  preavviso_unita: 'ore',
  preavviso_numero: 24,
  preavviso_percentuale: 0,
  next_invoice_number: 13,
  invoice_year: 2026,
  onboarding_completed: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ─── Prestazioni (listino) ───────────────────────────────────────────────────

export const MOCK_PRESTAZIONI: Prestazione[] = [
  { id: 'pr1', professionista_id: 'prof-1', nome: 'Seduta individuale', categoria: 'psicoterapia', prezzo: 70, is_sanitaria: true, applica_enpap: true, predefinita: true, durata_minuti: 50, attiva: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'pr2', professionista_id: 'prof-1', nome: 'Terapia di coppia', categoria: 'psicoterapia', prezzo: 120, is_sanitaria: true, applica_enpap: true, predefinita: false, durata_minuti: 75, attiva: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'pr3', professionista_id: 'prof-1', nome: 'Primo colloquio', categoria: 'consulenza_sostegno', prezzo: 50, is_sanitaria: true, applica_enpap: true, predefinita: false, durata_minuti: 60, attiva: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'pr4', professionista_id: 'prof-1', nome: 'Seduta breve', categoria: 'psicoterapia', prezzo: 40, is_sanitaria: true, applica_enpap: true, predefinita: false, durata_minuti: 30, attiva: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

// ─── Invoices ────────────────────────────────────────────────────────────────

export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv1', type: 'fattura', numero: '2026/001', data_emissione: '2026-02-05', professionista_id: 'prof-1', patient_id: 'c1', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica', importo: 80, contributo_enpap: 1.60, marca_bollo: 2.00, totale: 83.60, metodo_pagamento: 'bonifico', data_pagamento: '2026-02-07', pagato: true, ts_eligible: true, ts_status: 'accepted', ts_protocol: 'TS2026001234', ts_sent_at: '2026-02-10T10:00:00Z', ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-02-05T09:00:00Z', updated_at: '2026-02-10T10:00:00Z', patient: { id: 'c1', name: 'Marco Bianchi', email: 'marco.bianchi@email.it', codice_fiscale: 'BNCMRC88D12F205X' } },
  { id: 'inv2', type: 'fattura', numero: '2026/002', data_emissione: '2026-02-12', professionista_id: 'prof-1', patient_id: 'c2', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica', importo: 90, contributo_enpap: 1.80, marca_bollo: 2.00, totale: 93.80, metodo_pagamento: 'carta', data_pagamento: '2026-02-12', pagato: true, ts_eligible: true, ts_status: 'accepted', ts_protocol: 'TS2026001235', ts_sent_at: '2026-02-15T10:00:00Z', ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-02-12T10:00:00Z', updated_at: '2026-02-15T10:00:00Z', patient: { id: 'c2', name: 'Sofia Ricci', email: 'sofia.ricci@gmail.com', codice_fiscale: 'RCCSFO95P63H501Y' } },
  { id: 'inv3', type: 'fattura', numero: '2026/003', data_emissione: '2026-02-20', professionista_id: 'prof-1', patient_id: 'c3', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica', importo: 100, contributo_enpap: 2.00, marca_bollo: 2.00, totale: 104.00, metodo_pagamento: 'contanti', data_pagamento: '2026-02-20', pagato: true, ts_eligible: false, ts_status: 'not_applicable', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-02-20T11:00:00Z', updated_at: '2026-02-20T11:00:00Z', patient: { id: 'c3', name: 'Luca Ferrari', email: 'luca.ferrari@libero.it', codice_fiscale: 'FRRLCU79A05D612Z' } },
  { id: 'inv4', type: 'fattura', numero: '2026/004', data_emissione: '2026-03-05', professionista_id: 'prof-1', patient_id: 'c5', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica', importo: 100, contributo_enpap: 2.00, marca_bollo: 2.00, totale: 104.00, metodo_pagamento: 'carta', data_pagamento: null, pagato: false, ts_eligible: false, ts_status: 'pending', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-03-05T14:00:00Z', updated_at: '2026-03-05T14:00:00Z', patient: { id: 'c5', name: 'Alessandro Conti', email: 'a.conti@gmail.com', codice_fiscale: 'CNTLSN65S30F839V' } },
  { id: 'inv5', type: 'fattura', numero: '2026/005', data_emissione: '2026-03-10', professionista_id: 'prof-1', patient_id: 'c6', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica', importo: 80, contributo_enpap: 1.60, marca_bollo: 2.00, totale: 83.60, metodo_pagamento: 'bonifico', data_pagamento: '2026-03-12', pagato: true, ts_eligible: true, ts_status: 'pending', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-12T10:00:00Z', patient: { id: 'c6', name: 'Elena Marini', email: 'elena.marini@yahoo.it', codice_fiscale: 'MRNLNE90C48G224U' } },
  { id: 'inv6', type: 'fattura', numero: '2026/006', data_emissione: '2026-03-15', professionista_id: 'prof-1', patient_id: 'c7', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica - coppia', importo: 120, contributo_enpap: 2.40, marca_bollo: 2.00, totale: 124.40, metodo_pagamento: 'bonifico', data_pagamento: null, pagato: false, ts_eligible: false, ts_status: 'pending', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-03-15T16:00:00Z', updated_at: '2026-03-15T16:00:00Z', patient: { id: 'c7', name: 'Giovanni e Laura Esposito', email: 'gesposito@email.it', codice_fiscale: 'SPSGNN82H15F839T' } },
  { id: 'inv7', type: 'proforma', numero: null, data_emissione: '2026-03-20', professionista_id: 'prof-1', patient_id: 'c4', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica - primo colloquio', importo: 70, contributo_enpap: 1.40, marca_bollo: 0, totale: 71.40, metodo_pagamento: 'bonifico', data_pagamento: null, pagato: false, ts_eligible: false, ts_status: 'not_applicable', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'draft', created_at: '2026-03-20T09:30:00Z', updated_at: '2026-03-20T09:30:00Z', patient: { id: 'c4', name: 'Giulia Rossi', email: 'giulia.rossi@outlook.it', codice_fiscale: 'RSSGLL01L58H501W' } },
  { id: 'inv8', type: 'fattura', numero: '2026/007', data_emissione: '2026-04-01', professionista_id: 'prof-1', patient_id: 'c10', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica', importo: 90, contributo_enpap: 1.80, marca_bollo: 2.00, totale: 93.80, metodo_pagamento: 'bonifico', data_pagamento: '2026-04-03', pagato: true, ts_eligible: true, ts_status: 'sent', ts_protocol: 'TS2026001500', ts_sent_at: '2026-04-05T10:00:00Z', ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-04-01T10:00:00Z', updated_at: '2026-04-05T10:00:00Z', patient: { id: 'c10', name: 'Valentina De Luca', email: 'v.deluca@email.com', codice_fiscale: 'DLCVNT85B54F205Q' } },
  { id: 'inv9', type: 'fattura', numero: '2026/008', data_emissione: '2026-04-08', professionista_id: 'prof-1', patient_id: 'c1', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica', importo: 80, contributo_enpap: 1.60, marca_bollo: 2.00, totale: 83.60, metodo_pagamento: 'bonifico', data_pagamento: null, pagato: false, ts_eligible: false, ts_status: 'pending', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-04-08T09:00:00Z', updated_at: '2026-04-08T09:00:00Z', patient: { id: 'c1', name: 'Marco Bianchi', email: 'marco.bianchi@email.it', codice_fiscale: 'BNCMRC88D12F205X' } },
  { id: 'inv10', type: 'fattura', numero: '2026/009', data_emissione: '2026-04-10', professionista_id: 'prof-1', patient_id: 'c14', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica - coppia', importo: 130, contributo_enpap: 2.60, marca_bollo: 2.00, totale: 134.60, metodo_pagamento: 'bonifico', data_pagamento: null, pagato: false, ts_eligible: false, ts_status: 'pending', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-04-10T17:00:00Z', updated_at: '2026-04-10T17:00:00Z', patient: { id: 'c14', name: 'Sara e Pietro Mancini', email: 'mancini.coppia@email.it', codice_fiscale: 'MNCSRA80P44H501M' } },
  { id: 'inv11', type: 'fattura', numero: '2026/010', data_emissione: '2026-04-12', professionista_id: 'prof-1', patient_id: 'c9', session_id: null, referenced_invoice_id: null, descrizione: 'Prestazione psicologica', importo: 100, contributo_enpap: 2.00, marca_bollo: 2.00, totale: 104.00, metodo_pagamento: 'carta', data_pagamento: null, pagato: false, ts_eligible: false, ts_status: 'pending', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-04-12T09:00:00Z', updated_at: '2026-04-12T09:00:00Z', patient: { id: 'c9', name: 'Roberto Greco', email: 'roberto.greco@pec.it', codice_fiscale: 'GRCRBT73M27H501R' } },
  { id: 'inv12', type: 'nota_di_credito', numero: 'NC/2026/001', data_emissione: '2026-04-15', professionista_id: 'prof-1', patient_id: 'c2', session_id: null, referenced_invoice_id: 'inv2', descrizione: 'Nota di credito per rimborso parziale', importo: -45, contributo_enpap: -0.90, marca_bollo: 0, totale: -45.90, metodo_pagamento: 'carta', data_pagamento: '2026-04-15', pagato: true, ts_eligible: false, ts_status: 'not_applicable', ts_protocol: null, ts_sent_at: null, ts_error_message: null, pdf_url: null, status: 'confirmed', created_at: '2026-04-15T11:00:00Z', updated_at: '2026-04-15T11:00:00Z', patient: { id: 'c2', name: 'Sofia Ricci', email: 'sofia.ricci@gmail.com', codice_fiscale: 'RCCSFO95P63H501Y' } },
];

// ─── Client Notes ─────────────────────────────────────────────────────────────

export interface MockClientNote {
  id: string;
  client_id: string;
  template_id: string | null;
  notes: string;
  created_at: string;
  template: { id: string; name: string } | null;
  _attachmentCount: number;
}

export const MOCK_CLIENT_NOTES: MockClientNote[] = [
  { id: 'cn1', client_id: 'c1', template_id: 't1', notes: 'Marco ha mostrato significativi progressi nella gestione dell\'ansia. Riferisce di dormire meglio e di aver ripreso attività fisica. Continuare con le tecniche di mindfulness e aggiungere esercizi di respirazione.', created_at: '2026-04-10T09:30:00Z', template: { id: 't1', name: 'Individual Therapy' }, _attachmentCount: 0 },
  { id: 'cn2', client_id: 'c1', template_id: null, notes: 'Nota telefonica: Marco ha chiamato per comunicare che salterà la sessione del 21 aprile per motivi lavorativi. Riprogrammata per il 28 aprile.', created_at: '2026-04-08T15:00:00Z', template: null, _attachmentCount: 0 },
  { id: 'cn3', client_id: 'c2', template_id: 't1', notes: 'Sofia sta elaborando meglio le situazioni di stress. Ha iniziato a tenere un diario delle emozioni come suggerito. Prossima sessione: approfondire le relazioni familiari.', created_at: '2026-04-13T14:30:00Z', template: { id: 't1', name: 'Individual Therapy' }, _attachmentCount: 1 },
  { id: 'cn4', client_id: 'c7', template_id: 't2', notes: 'Coppia Esposito: progressi nella comunicazione. Giovanni è più aperto al dialogo. Laura esprime ancora resistenze. Assegnati esercizi di ascolto attivo da fare a casa.', created_at: '2026-04-12T16:30:00Z', template: { id: 't2', name: 'Couples Therapy' }, _attachmentCount: 0 },
  { id: 'cn5', client_id: 'c5', template_id: 't1', notes: 'Alessandro sta attraversando un periodo di lutto complicato. Necessita di supporto continuativo. Valutare possibile invio a gruppo di supporto per il lutto.', created_at: '2026-04-05T15:30:00Z', template: { id: 't1', name: 'Individual Therapy' }, _attachmentCount: 2 },
];

// ─── In-memory state (simulates database mutations) ───────────────────────────

let _clients = [...MOCK_CLIENTS];
let _sessions = [...MOCK_SESSIONS];
let _invoices = [...MOCK_INVOICES];
let _clientNotes = [...MOCK_CLIENT_NOTES];
let _prestazioni = [...MOCK_PRESTAZIONI];

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Clients API ─────────────────────────────────────────────────────────────

export const db = {
  clients: {
    list: (): ClientWithFiscal[] => [..._clients].sort((a, b) => a.name.localeCompare(b.name)),
    get: (id: string): ClientWithFiscal | null => _clients.find((c) => c.id === id) ?? null,
    create: (data: Partial<ClientWithFiscal>): ClientWithFiscal => {
      const now = new Date().toISOString();
      const client: ClientWithFiscal = {
        id: newId(),
        name: data.name ?? '',
        email: data.email ?? null,
        phone: data.phone ?? null,
        date_of_birth: data.date_of_birth ?? null,
        gender: data.gender ?? null,
        codice_fiscale: data.codice_fiscale ?? null,
        tariffa_default: data.tariffa_default ?? null,
        metodo_pagamento: data.metodo_pagamento ?? null,
        tipo_seduta_default: data.tipo_seduta_default ?? null,
        ts_opposizione: data.ts_opposizione ?? false,
        is_foreign: data.is_foreign ?? false,
        created_at: now,
        updated_at: now,
      };
      _clients = [..._clients, client];
      return client;
    },
    update: (id: string, data: Partial<ClientWithFiscal>): void => {
      _clients = _clients.map((c) =>
        c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
      );
    },
    delete: (id: string): void => {
      _clients = _clients.filter((c) => c.id !== id);
    },
  },

  sessions: {
    list: () => [..._sessions].sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()),
    get: (id: string) => _sessions.find((s) => s.id === id) ?? null,
    create: (data: Partial<typeof _sessions[number]>) => {
      const now = new Date().toISOString();
      const client = _clients.find((c) => c.id === data.client_id) ?? null;
      const template = MOCK_TEMPLATES.find((t) => t.id === data.template_id) ?? null;
      const session = {
        id: newId(),
        client_id: data.client_id ?? '',
        template_id: data.template_id ?? null,
        session_date: data.session_date ?? now,
        notes: data.notes ?? '',
        session_type: (data.session_type ?? 'manual') as 'recorded' | 'manual',
        created_at: now,
        updated_at: now,
        client: client ? { id: client.id, name: client.name, email: client.email } : undefined,
        template: template ? { id: template.id, name: template.name } : undefined,
      };
      _sessions = [session as typeof _sessions[number], ..._sessions];
      return session;
    },
  },

  templates: {
    list: (): Template[] => [...MOCK_TEMPLATES].sort((a, b) => a.name.localeCompare(b.name)),
    get: (id: string): Template | null => MOCK_TEMPLATES.find((t) => t.id === id) ?? null,
    create: (data: Partial<Template>): Template => {
      const now = new Date().toISOString();
      const tpl: Template = {
        id: newId(),
        name: data.name ?? '',
        description: data.description ?? '',
        is_zen_template: false,
        user_id: 'user-1',
        created_at: now,
        updated_at: now,
      };
      MOCK_TEMPLATES.push(tpl);
      return tpl;
    },
    update: (id: string, data: Partial<Template>): void => {
      const idx = MOCK_TEMPLATES.findIndex((t) => t.id === id);
      if (idx !== -1) MOCK_TEMPLATES[idx] = { ...MOCK_TEMPLATES[idx], ...data, updated_at: new Date().toISOString() };
    },
    delete: (id: string): void => {
      const idx = MOCK_TEMPLATES.findIndex((t) => t.id === id);
      if (idx !== -1) MOCK_TEMPLATES.splice(idx, 1);
    },
  },

  invoices: {
    list: (professionistaId?: string, patientId?: string): Invoice[] => {
      let result = [..._invoices];
      if (professionistaId) result = result.filter((i) => i.professionista_id === professionistaId);
      if (patientId) result = result.filter((i) => i.patient_id === patientId);
      return result.sort((a, b) => new Date(b.data_emissione).getTime() - new Date(a.data_emissione).getTime());
    },
    get: (id: string): Invoice | null => _invoices.find((i) => i.id === id) ?? null,
    create: (data: Partial<Invoice>): Invoice => {
      const now = new Date().toISOString();
      const inv: Invoice = {
        id: newId(),
        type: data.type ?? 'fattura',
        numero: data.numero ?? null,
        data_emissione: data.data_emissione ?? now.split('T')[0],
        professionista_id: data.professionista_id ?? 'prof-1',
        patient_id: data.patient_id ?? '',
        session_id: data.session_id ?? null,
        referenced_invoice_id: data.referenced_invoice_id ?? null,
        descrizione: data.descrizione ?? '',
        importo: data.importo ?? 0,
        contributo_enpap: data.contributo_enpap ?? 0,
        marca_bollo: data.marca_bollo ?? 0,
        totale: data.totale ?? 0,
        metodo_pagamento: data.metodo_pagamento ?? null,
        data_pagamento: data.data_pagamento ?? null,
        pagato: data.pagato ?? false,
        ts_eligible: data.ts_eligible ?? false,
        ts_status: data.ts_status ?? 'pending',
        ts_protocol: null,
        ts_sent_at: null,
        ts_error_message: null,
        pdf_url: null,
        status: data.status ?? 'confirmed',
        created_at: now,
        updated_at: now,
        patient: data.patient,
      };
      _invoices = [inv, ..._invoices];
      return inv;
    },
    update: (id: string, data: Partial<Invoice>): void => {
      _invoices = _invoices.map((i) =>
        i.id === id ? { ...i, ...data, updated_at: new Date().toISOString() } : i
      );
    },
  },

  clientNotes: {
    list: (clientId: string): MockClientNote[] =>
      [..._clientNotes]
        .filter((n) => n.client_id === clientId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    get: (id: string): MockClientNote | null => _clientNotes.find((n) => n.id === id) ?? null,
    create: (data: Partial<MockClientNote>): MockClientNote => {
      const template = data.template_id ? MOCK_TEMPLATES.find((t) => t.id === data.template_id) ?? null : null;
      const note: MockClientNote = {
        id: newId(),
        client_id: data.client_id ?? '',
        template_id: data.template_id ?? null,
        notes: data.notes ?? '',
        created_at: new Date().toISOString(),
        template: template ? { id: template.id, name: template.name } : null,
        _attachmentCount: 0,
      };
      _clientNotes = [note, ..._clientNotes];
      return note;
    },
    update: (id: string, data: Partial<MockClientNote>): void => {
      _clientNotes = _clientNotes.map((n) => (n.id === id ? { ...n, ...data } : n));
    },
    delete: (id: string): void => {
      _clientNotes = _clientNotes.filter((n) => n.id !== id);
    },
  },

  profile: {
    get: (): ProfessionistaFiscalProfile => MOCK_PROFILE,
    update: (data: Partial<ProfessionistaFiscalProfile>): void => {
      Object.assign(MOCK_PROFILE, data, { updated_at: new Date().toISOString() });
    },
  },

  prestazioni: {
    list: (onlyActive = false): Prestazione[] => {
      const list = onlyActive ? _prestazioni.filter((p) => p.attiva) : [..._prestazioni];
      return list.sort((a, b) => a.nome.localeCompare(b.nome));
    },
    get: (id: string): Prestazione | null => _prestazioni.find((p) => p.id === id) ?? null,
    create: (data: Partial<Prestazione>): Prestazione => {
      const now = new Date().toISOString();
      const p: Prestazione = {
        id: newId(),
        professionista_id: data.professionista_id ?? 'prof-1',
        nome: data.nome ?? '',
        categoria: data.categoria ?? 'altro',
        prezzo: data.prezzo ?? 0,
        is_sanitaria: data.is_sanitaria ?? true,
        applica_enpap: data.applica_enpap ?? true,
        predefinita: data.predefinita ?? false,
        durata_minuti: data.durata_minuti ?? null,
        attiva: data.attiva ?? true,
        created_at: now,
        updated_at: now,
      };
      _prestazioni = [..._prestazioni, p];
      return p;
    },
    update: (id: string, data: Partial<Prestazione>): void => {
      _prestazioni = _prestazioni.map((p) =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
      );
    },
    delete: (id: string): void => {
      _prestazioni = _prestazioni.filter((p) => p.id !== id);
    },
    replaceAll: (items: Prestazione[]): void => {
      _prestazioni = [...items];
    },
  },
};
