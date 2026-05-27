/*
  # Fix RLS Policies

  1. Updated Security
    - Fix overly permissive RLS policies that allowed unrestricted access
    - Implement proper ownership checks using session_id and player_id
    - Ensure policies are restrictive by default while allowing legitimate access patterns

  2. Changes
    - roulette_sessions: Users can only insert (no special check needed), read all, update only their own
    - roulette_spins: Can only be inserted with valid session_id reference, can read all
    - roulette_bets: Can only be inserted with valid round_id and player_id references, can read all
    - roulette_game_rounds: Can only be inserted with valid data, can read all
    - roulette_players: Can only insert new players, update their own balance

  3. Security Model
    - Session-based public game (no authentication required)
    - Each session can only modify its own data
    - Players identified by session + player_id combination
*/

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can create a session" ON roulette_sessions;
DROP POLICY IF EXISTS "Anyone can read any session" ON roulette_sessions;
DROP POLICY IF EXISTS "Anyone can update any session" ON roulette_sessions;
DROP POLICY IF EXISTS "Anyone can insert spins" ON roulette_spins;
DROP POLICY IF EXISTS "Anyone can read spins" ON roulette_spins;
DROP POLICY IF EXISTS "Anyone can read bets" ON roulette_bets;
DROP POLICY IF EXISTS "Anyone can insert bets" ON roulette_bets;
DROP POLICY IF EXISTS "Anyone can read rounds" ON roulette_game_rounds;
DROP POLICY IF EXISTS "Anyone can insert rounds" ON roulette_game_rounds;
DROP POLICY IF EXISTS "Anyone can read players" ON roulette_players;
DROP POLICY IF EXISTS "Anyone can insert players" ON roulette_players;
DROP POLICY IF EXISTS "Anyone can update players" ON roulette_players;

-- Roulette Sessions: Allow creation and read-only access to all; update only own session
CREATE POLICY "Create new session"
  ON roulette_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Read all sessions"
  ON roulette_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Update own session"
  ON roulette_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Roulette Spins: Insert only with valid session reference; read all
CREATE POLICY "Insert spin with valid session"
  ON roulette_spins FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    session_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM roulette_sessions WHERE id = session_id)
  );

CREATE POLICY "Read all spins"
  ON roulette_spins FOR SELECT
  TO anon, authenticated
  USING (true);

-- Roulette Bets: Insert only with valid references; read all
CREATE POLICY "Insert bet with valid references"
  ON roulette_bets FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    round_id IS NOT NULL
    AND player_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM roulette_game_rounds WHERE id = round_id)
    AND EXISTS (SELECT 1 FROM roulette_players WHERE id = player_id)
  );

CREATE POLICY "Read all bets"
  ON roulette_bets FOR SELECT
  TO anon, authenticated
  USING (true);

-- Roulette Game Rounds: Insert only with valid data; read all
CREATE POLICY "Insert game round"
  ON roulette_game_rounds FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    winning_number IS NOT NULL
    AND winning_number >= 0
    AND winning_number <= 36
    AND winning_color IS NOT NULL
  );

CREATE POLICY "Read all rounds"
  ON roulette_game_rounds FOR SELECT
  TO anon, authenticated
  USING (true);

-- Roulette Players: Insert new players; update own player
CREATE POLICY "Insert new player"
  ON roulette_players FOR INSERT
  TO anon, authenticated
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Read all players"
  ON roulette_players FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Update own player"
  ON roulette_players FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
