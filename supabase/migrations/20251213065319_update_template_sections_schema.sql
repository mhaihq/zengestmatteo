/*
  # Update Template Sections Schema

  1. Modifications to template_sections table
    - Add `style` column (text) - Either 'bullet' or 'paragraph'
    - Add `content` column (text) - Instructions for the section content
    - Add `verbosity` column (text) - Either 'detailed', 'standard', or 'concise'

  2. Notes
    - These fields support the new template builder functionality
    - style determines how the section content is formatted
    - content provides AI/user instructions for what to write
    - verbosity determines the length of generated content
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'template_sections' AND column_name = 'style'
  ) THEN
    ALTER TABLE template_sections ADD COLUMN style text DEFAULT 'bullet';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'template_sections' AND column_name = 'content'
  ) THEN
    ALTER TABLE template_sections ADD COLUMN content text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'template_sections' AND column_name = 'verbosity'
  ) THEN
    ALTER TABLE template_sections ADD COLUMN verbosity text DEFAULT 'standard';
  END IF;
END $$;

-- Add check constraints for valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'template_sections_style_check'
  ) THEN
    ALTER TABLE template_sections ADD CONSTRAINT template_sections_style_check 
      CHECK (style IN ('bullet', 'paragraph'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'template_sections_verbosity_check'
  ) THEN
    ALTER TABLE template_sections ADD CONSTRAINT template_sections_verbosity_check 
      CHECK (verbosity IN ('detailed', 'standard', 'concise'));
  END IF;
END $$;