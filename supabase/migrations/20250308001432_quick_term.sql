/*
  # Create items and item_history tables

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `current_value` (numeric)
      - `trend` (text)
      - `change` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `additional_fields` (jsonb)

    - `item_history`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key)
      - `value` (numeric)
      - `date` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for:
      - Public read access to items
      - Admin-only write access to items
      - Public read access to item_history
      - Admin-only write access to item_history
*/

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  current_value numeric NOT NULL,
  trend text NOT NULL,
  change text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  additional_fields jsonb DEFAULT '{}'::jsonb
);

-- Create item_history table
CREATE TABLE IF NOT EXISTS item_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_history ENABLE ROW LEVEL SECURITY;

-- Create policies for items table
CREATE POLICY "Allow public read access to items"
  ON items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access to items"
  ON items
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin');

-- Create policies for item_history table
CREATE POLICY "Allow public read access to item_history"
  ON item_history
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access to item_history"
  ON item_history
  FOR ALL
  TO authenticated
  USING (auth.email() = 'admin');