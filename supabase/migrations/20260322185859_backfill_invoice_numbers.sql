/*
  # Backfill missing invoice numbers

  ## Summary
  Two existing fattura-type invoices were created before the invoice numbering
  fix was in place and have numero = NULL. This migration assigns them sequential
  numbers (1/2026, 2/2026) ordered by creation date, then advances the profile
  counter to 3 so the next new fattura receives 3/2026.

  ## Changes
  - invoices: sets numero = '1/2026' for the oldest unnumbered fattura
  - invoices: sets numero = '2/2026' for the second unnumbered fattura
  - professionista_fiscal_profile: advances next_invoice_number to 3
*/

DO $$
DECLARE
  v_ids uuid[];
  i     int;
BEGIN
  SELECT ARRAY(
    SELECT id FROM invoices
    WHERE type = 'fattura' AND numero IS NULL
    ORDER BY created_at ASC
  ) INTO v_ids;

  FOR i IN 1 .. array_length(v_ids, 1) LOOP
    UPDATE invoices
    SET numero = i || '/2026'
    WHERE id = v_ids[i];
  END LOOP;

  UPDATE professionista_fiscal_profile
  SET next_invoice_number = array_length(v_ids, 1) + 1,
      invoice_year        = 2026,
      updated_at          = now()
  WHERE id = '00000000-0000-0000-0000-000000000001';
END $$;
