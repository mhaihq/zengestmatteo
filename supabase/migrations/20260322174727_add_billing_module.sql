/*
  # Add Billing Module (Modulo Fatturazione)

  ## Summary
  Adds complete billing infrastructure for Italian psychologists, including fiscal profiles,
  invoice management, and Sistema Tessera Sanitaria (TS) tracking.

  ## Changes

  ### Extended Tables
  - `clients` — adds fiscal/billing columns: codice_fiscale, tariffa_default,
    metodo_pagamento, tipo_seduta_default, ts_opposizione, is_foreign

  ### New Tables

  #### professionista_fiscal_profile
  One-to-one with auth.users. Stores the psychologist's tax/billing identity:
  partita_iva, codice_fiscale, regime_fiscale (forfettario/ordinario), ENPAP settings,
  TS credentials (passwords stored as text — should be encrypted at app layer), IBAN, PEC,
  next invoice number with year-based reset.

  #### invoices
  Core invoice table supporting fattura, proforma, and nota_di_credito types.
  Tracks ENPAP 2% contribution, marca da bollo, payment status, and full TS lifecycle
  (pending → sent → accepted/rejected/error).

  ## Security
  - RLS enabled on professionista_fiscal_profile (user can only access own profile)
  - RLS enabled on invoices (user can only access invoices linked to their profile)
  - Clients table RLS remains disabled (no auth yet, as per existing migration)

  ## Functions
  - get_next_invoice_number(p_user_id uuid) — thread-safe invoice numbering with
    row-level locking, auto-resets when calendar year changes.
*/

-- ─────────────────────────────────────────────
-- Extend clients with fiscal/billing columns
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'codice_fiscale') THEN
    ALTER TABLE clients ADD COLUMN codice_fiscale text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tariffa_default') THEN
    ALTER TABLE clients ADD COLUMN tariffa_default numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'metodo_pagamento') THEN
    ALTER TABLE clients ADD COLUMN metodo_pagamento text CHECK (metodo_pagamento IN ('bonifico', 'carta', 'contanti'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tipo_seduta_default') THEN
    ALTER TABLE clients ADD COLUMN tipo_seduta_default text CHECK (tipo_seduta_default IN ('individuale', 'coppia', 'primo_colloquio', 'breve'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'ts_opposizione') THEN
    ALTER TABLE clients ADD COLUMN ts_opposizione boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'is_foreign') THEN
    ALTER TABLE clients ADD COLUMN is_foreign boolean DEFAULT false;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- professionista_fiscal_profile
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS professionista_fiscal_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nome_cognome text NOT NULL DEFAULT '',
  partita_iva text NOT NULL DEFAULT '',
  codice_fiscale text NOT NULL DEFAULT '',
  indirizzo_studio text NOT NULL DEFAULT '',
  regime_fiscale text NOT NULL DEFAULT 'forfettario' CHECK (regime_fiscale IN ('forfettario', 'ordinario')),
  bollo_a_carico text NOT NULL DEFAULT 'cliente' CHECK (bollo_a_carico IN ('cliente', 'professionista')),
  iban text,
  pec text,
  ts_password text,
  ts_pincode text,
  ts_auto_send boolean DEFAULT false,
  next_invoice_number integer DEFAULT 1,
  invoice_year integer DEFAULT EXTRACT(year FROM now())::integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE professionista_fiscal_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own fiscal profile"
  ON professionista_fiscal_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fiscal profile"
  ON professionista_fiscal_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fiscal profile"
  ON professionista_fiscal_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_professionista_user_id ON professionista_fiscal_profile (user_id);

-- ─────────────────────────────────────────────
-- invoices
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('fattura', 'proforma', 'nota_di_credito')),
  numero text,
  data_emissione date NOT NULL DEFAULT CURRENT_DATE,
  professionista_id uuid NOT NULL REFERENCES professionista_fiscal_profile(id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  referenced_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  descrizione text NOT NULL DEFAULT '',
  importo numeric NOT NULL DEFAULT 0,
  contributo_enpap numeric NOT NULL DEFAULT 0,
  marca_bollo numeric NOT NULL DEFAULT 0,
  totale numeric NOT NULL DEFAULT 0,
  metodo_pagamento text CHECK (metodo_pagamento IN ('bonifico', 'carta', 'contanti')),
  data_pagamento date,
  pagato boolean DEFAULT false,
  ts_eligible boolean DEFAULT false,
  ts_status text DEFAULT 'pending' CHECK (ts_status IN ('not_applicable', 'pending', 'sent', 'accepted', 'rejected', 'error')),
  ts_protocol text,
  ts_sent_at timestamptz,
  ts_error_message text,
  pdf_url text,
  status text DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'cancelled', 'credited')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    professionista_id IN (
      SELECT id FROM professionista_fiscal_profile WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    professionista_id IN (
      SELECT id FROM professionista_fiscal_profile WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    professionista_id IN (
      SELECT id FROM professionista_fiscal_profile WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    professionista_id IN (
      SELECT id FROM professionista_fiscal_profile WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_invoices_professionista_id ON invoices (professionista_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices (patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_data_emissione ON invoices (data_emissione DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_ts_status ON invoices (ts_status);
CREATE INDEX IF NOT EXISTS idx_invoices_pagato ON invoices (pagato);

-- ─────────────────────────────────────────────
-- Invoice numbering function (row-level locked)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_user_id uuid)
RETURNS TABLE(next_number integer, invoice_year integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_year integer := EXTRACT(year FROM now())::integer;
  v_profile professionista_fiscal_profile%ROWTYPE;
  v_next_number integer;
  v_year integer;
BEGIN
  SELECT * INTO v_profile
  FROM professionista_fiscal_profile
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fiscal profile not found for user %', p_user_id;
  END IF;

  IF v_profile.invoice_year <> v_current_year THEN
    v_next_number := 1;
    v_year := v_current_year;
  ELSE
    v_next_number := v_profile.next_invoice_number;
    v_year := v_profile.invoice_year;
  END IF;

  UPDATE professionista_fiscal_profile
  SET
    next_invoice_number = v_next_number + 1,
    invoice_year = v_year,
    updated_at = now()
  WHERE user_id = p_user_id;

  next_number := v_next_number;
  invoice_year := v_year;
  RETURN NEXT;
END;
$$;
