/*
  # Create Core Tables

  ## Summary
  Sets up the foundational data model for the clinical session management app.

  ## New Tables

  ### clients
  Stores patient/client profiles.
  - id (uuid, PK)
  - name (text, required)
  - email (text, optional)
  - phone (text, optional)
  - date_of_birth (date, optional)
  - gender (text, optional)
  - created_at, updated_at (timestamps)

  ### templates
  Session note templates (both system "zen" templates and user-created ones).
  - id (uuid, PK)
  - name (text, required)
  - description (text)
  - is_zen_template (boolean, default false)
  - user_id (uuid, optional reference to auth.users)
  - created_at, updated_at (timestamps)

  ### sessions
  Clinical sessions linking clients and templates.
  - id (uuid, PK)
  - client_id (uuid, FK → clients)
  - template_id (uuid, FK → templates)
  - session_date (timestamptz, default now)
  - notes (text, free-form notes for manual sessions)
  - session_type (text: 'recorded' | 'manual')
  - created_at, updated_at (timestamps)

  ### session_attachments
  Files attached to a session.
  - id (uuid, PK)
  - session_id (uuid, FK → sessions, cascade delete)
  - file_name (text)
  - file_path (text, storage path)
  - file_type (text, MIME type)
  - file_size (bigint, bytes)
  - created_at (timestamp)

  ## Notes
  - RLS is disabled on all tables because auth is not yet implemented.
    Once auth is added, RLS policies should be enabled with user-scoped access.
  - Default template seeds are inserted only if no zen templates exist yet.
*/

-- ─────────────────────────────────────────────
-- clients
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  gender text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (name);

-- ─────────────────────────────────────────────
-- templates
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  is_zen_template boolean DEFAULT false,
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_templates_is_zen ON templates (is_zen_template);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates (user_id);

-- Seed default zen templates (only if none exist yet)
INSERT INTO templates (name, description, is_zen_template)
SELECT name, description, true
FROM (VALUES
  ('Individual Therapy',  'Standard individual therapy session'),
  ('Couples Therapy',     'Couples counseling session'),
  ('Group Therapy',       'Group therapy session'),
  ('Family Therapy',      'Family counseling session'),
  ('CBT Session',         'Cognitive Behavioral Therapy focused template'),
  ('Initial Assessment',  'First session intake and assessment')
) AS t(name, description)
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE is_zen_template = true);

-- ─────────────────────────────────────────────
-- sessions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients (id) ON DELETE SET NULL,
  template_id uuid REFERENCES templates (id) ON DELETE SET NULL,
  session_date timestamptz DEFAULT now(),
  notes text DEFAULT '',
  session_type text DEFAULT 'recorded',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions (client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON sessions (session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_session_type ON sessions (session_type);

-- ─────────────────────────────────────────────
-- session_attachments
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_attachments DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_session_attachments_session_id ON session_attachments (session_id);
