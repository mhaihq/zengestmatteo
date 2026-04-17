/*
  # Update Templates System

  1. Modifications to existing tables
    - Add `is_zen_template` column to templates table
    - Add `user_id` column to templates table
    - Add `updated_at` column if missing
      
  2. New Tables
    - `template_sections` - for template sections
    - `user_template_library` - for tracking user's library

  3. Security
    - Update RLS policies for new structure
    - Enable RLS on new tables
*/

-- Add new columns to templates table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'templates' AND column_name = 'is_zen_template'
  ) THEN
    ALTER TABLE templates ADD COLUMN is_zen_template boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'templates' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE templates ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'templates' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE templates ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Template sections table
CREATE TABLE IF NOT EXISTS template_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User template library (tracks which zen templates users have added)
CREATE TABLE IF NOT EXISTS user_template_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- Enable RLS on new tables
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_template_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on templates table to recreate them
DROP POLICY IF EXISTS "Anyone can view templates" ON templates;
DROP POLICY IF EXISTS "Users can create templates" ON templates;
DROP POLICY IF EXISTS "Users can update templates" ON templates;
DROP POLICY IF EXISTS "Users can delete templates" ON templates;

-- New policies for templates
CREATE POLICY "Zen templates are visible to all authenticated users"
  ON templates FOR SELECT
  TO authenticated
  USING (is_zen_template = true);

CREATE POLICY "Users can view their own templates"
  ON templates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_zen_template = false);

CREATE POLICY "Users can create their own templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_zen_template = false);

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND is_zen_template = false)
  WITH CHECK (user_id = auth.uid() AND is_zen_template = false);

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND is_zen_template = false);

-- Policies for template_sections
CREATE POLICY "Sections visible for zen templates"
  ON template_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_sections.template_id 
      AND templates.is_zen_template = true
    )
  );

CREATE POLICY "Users can view sections of their own templates"
  ON template_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_sections.template_id 
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sections for their own templates"
  ON template_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_sections.template_id 
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sections of their own templates"
  ON template_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_sections.template_id 
      AND templates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_sections.template_id 
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sections of their own templates"
  ON template_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_sections.template_id 
      AND templates.user_id = auth.uid()
    )
  );

-- Policies for user_template_library
CREATE POLICY "Users can view their own library"
  ON user_template_library FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to their library"
  ON user_template_library FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from their library"
  ON user_template_library FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_is_zen ON templates(is_zen_template);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_template_id ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_order ON template_sections(template_id, "order");
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_template_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_template_id ON user_template_library(template_id);