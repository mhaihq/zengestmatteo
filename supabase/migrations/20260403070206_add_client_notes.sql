/*
  # Add client_notes and client_note_attachments tables

  ## Summary
  Creates a patient-level notes system that works independently from sessions.
  A "client note" is authored at the client level (not tied to a session),
  and shares the same creation UX as a manual session (template selector,
  free-text notes area, file attachments, optional voice memo).

  ## New Tables

  ### client_notes
  - `id` (uuid, PK)
  - `client_id` (uuid, FK → clients.id, ON DELETE CASCADE)
  - `template_id` (uuid, nullable FK → templates.id, ON DELETE SET NULL)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### client_note_attachments
  - `id` (uuid, PK)
  - `note_id` (uuid, FK → client_notes.id, ON DELETE CASCADE)
  - `file_name` (text)
  - `file_path` (text)
  - `file_type` (text)
  - `file_size` (bigint)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Access is open to all authenticated users (same pattern as existing tables)
*/

CREATE TABLE IF NOT EXISTS client_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id   uuid REFERENCES templates(id) ON DELETE SET NULL,
  notes         text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select client_notes"
  ON client_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client_notes"
  ON client_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client_notes"
  ON client_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client_notes"
  ON client_notes FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS client_note_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     uuid NOT NULL REFERENCES client_notes(id) ON DELETE CASCADE,
  file_name   text NOT NULL,
  file_path   text NOT NULL,
  file_type   text NOT NULL DEFAULT '',
  file_size   bigint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_note_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select client_note_attachments"
  ON client_note_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client_note_attachments"
  ON client_note_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client_note_attachments"
  ON client_note_attachments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client_note_attachments"
  ON client_note_attachments FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_note_attachments_note_id ON client_note_attachments(note_id);
