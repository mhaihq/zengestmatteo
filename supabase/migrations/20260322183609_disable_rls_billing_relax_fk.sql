/*
  # Disable RLS on Billing Tables & Relax user_id FK for Dev Mode

  ## Summary
  Aligns billing tables with the no-auth posture of the rest of the app
  (clients, sessions both have RLS disabled). Also makes user_id on
  professionista_fiscal_profile nullable without a hard FK so a dev/test
  profile can be seeded without a real auth user.

  ## Changes
  - Disable RLS on `professionista_fiscal_profile`
  - Disable RLS on `invoices`
  - Drop the hard FK constraint from professionista_fiscal_profile.user_id
    (retains the column and unique constraint, just removes the auth.users ref)
  - Seed a dev test profile if none exists

  ## Notes
  - When proper auth is added, re-create the FK and re-enable RLS
*/

ALTER TABLE professionista_fiscal_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- Drop the FK referencing auth.users so we can seed without a real user
ALTER TABLE professionista_fiscal_profile
  DROP CONSTRAINT IF EXISTS professionista_fiscal_profile_user_id_fkey;

-- Seed a dev profile only if the table is empty
INSERT INTO professionista_fiscal_profile (
  id,
  user_id,
  nome_cognome,
  partita_iva,
  codice_fiscale,
  indirizzo_studio,
  regime_fiscale,
  bollo_a_carico,
  next_invoice_number,
  invoice_year
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Dev Professionista',
  '00000000000',
  'DVDPRF00A01H501Z',
  'Via Test 1, 00100 Roma (RM)',
  'forfettario',
  'cliente',
  1,
  EXTRACT(year FROM now())::integer
WHERE NOT EXISTS (SELECT 1 FROM professionista_fiscal_profile);
