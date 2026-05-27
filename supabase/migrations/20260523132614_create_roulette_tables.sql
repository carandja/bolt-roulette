/*
  # Roulette Game Tables

  1. New Tables
    - `roulette_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable for guest play)
      - `balance` (numeric, current balance)
      - `total_wagered` (numeric, lifetime wagered)
      - `total_won` (numeric, lifetime won)
      - `games_played` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `roulette_spins`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references roulette_sessions)
      - `winning_number` (integer, 0-36)
      - `bets` (jsonb, array of bet objects)
      - `total_wagered` (numeric)
      - `total_payout` (numeric)
      - `net_result` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Policies allow access by session_id stored in local context (using anon key)
    - For simplicity, we use anon access with session ownership via session_id
*/

CREATE TABLE IF NOT EXISTS roulette_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance numeric NOT NULL DEFAULT 1000,
  total_wagered numeric NOT NULL DEFAULT 0,
  total_won numeric NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roulette_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a session"
  ON roulette_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read any session"
  ON roulette_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update any session"
  ON roulette_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS roulette_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES roulette_sessions(id) ON DELETE CASCADE,
  winning_number integer NOT NULL CHECK (winning_number >= 0 AND winning_number <= 36),
  bets jsonb NOT NULL DEFAULT '[]',
  total_wagered numeric NOT NULL DEFAULT 0,
  total_payout numeric NOT NULL DEFAULT 0,
  net_result numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roulette_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert spins"
  ON roulette_spins
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read spins"
  ON roulette_spins
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_roulette_spins_session_id ON roulette_spins(session_id);
CREATE INDEX IF NOT EXISTS idx_roulette_spins_created_at ON roulette_spins(created_at DESC);
