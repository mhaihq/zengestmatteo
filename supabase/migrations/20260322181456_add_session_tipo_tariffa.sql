/*
  # Add tipo_seduta and tariffa to sessions

  ## Changes
  - `sessions` table:
    - `tipo_seduta` (text, nullable) — session type, copied from patient default at creation time
    - `tariffa` (numeric, nullable) — session price, copied from patient default at creation time

  ## Notes
  - Both columns are nullable so existing sessions and sessions without patient defaults are unaffected
  - A check constraint enforces valid tipo_seduta values (matches the client default enum)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'tipo_seduta'
  ) THEN
    ALTER TABLE sessions ADD COLUMN tipo_seduta text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'tariffa'
  ) THEN
    ALTER TABLE sessions ADD COLUMN tariffa numeric;
  END IF;
END $$;

ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_tipo_seduta_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_tipo_seduta_check
  CHECK (tipo_seduta IS NULL OR tipo_seduta IN ('individuale', 'coppia', 'primo_colloquio', 'breve'));
