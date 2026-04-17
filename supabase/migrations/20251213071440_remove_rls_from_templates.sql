/*
  # Remove RLS from Templates System

  1. Changes
    - Disable RLS on `templates` table
    - Disable RLS on `template_sections` table
    - Drop all existing policies on both tables
  
  2. Security
    - Tables will be publicly accessible without authentication
    - Suitable for applications without user authentication
*/

-- Drop all policies from templates table
DROP POLICY IF EXISTS "Users can view all templates" ON templates;
DROP POLICY IF EXISTS "Users can view their own templates" ON templates;
DROP POLICY IF EXISTS "Zen templates are visible to all authenticated users" ON templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON templates;

-- Drop all policies from template_sections table
DROP POLICY IF EXISTS "Users can view sections of their own templates" ON template_sections;
DROP POLICY IF EXISTS "Sections visible for zen templates" ON template_sections;
DROP POLICY IF EXISTS "Users can insert sections for their own templates" ON template_sections;
DROP POLICY IF EXISTS "Users can update sections of their own templates" ON template_sections;
DROP POLICY IF EXISTS "Users can delete sections of their own templates" ON template_sections;

-- Disable RLS
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_sections DISABLE ROW LEVEL SECURITY;