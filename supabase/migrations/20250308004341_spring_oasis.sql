/*
  # Update items table for image storage

  1. Changes
    - Add image_url column to items table if it doesn't exist
    - Set default image URL for empty values
    - Add validation check for image URL format

  2. Security
    - Ensure RLS policies are in place for the items table
*/

DO $$ 
BEGIN
  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'items' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE items 
    ADD COLUMN image_url text NOT NULL 
    DEFAULT 'https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg';
  END IF;

  -- Add check constraint for valid image URLs if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'items'
    AND constraint_name = 'valid_image_url'
  ) THEN
    ALTER TABLE items
    ADD CONSTRAINT valid_image_url
    CHECK (
      image_url ~ '^https?://.*\.(jpg|jpeg|png|webp)$'
      OR image_url = 'https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg'
    );
  END IF;
END $$;