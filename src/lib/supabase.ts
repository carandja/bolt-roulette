import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RouletteSession {
  id: string;
  balance: number;
  total_wagered: number;
  total_won: number;
  games_played: number;
  created_at: string;
  updated_at: string;
}

export interface RouletteSpin {
  id: string;
  session_id: string;
  winning_number: number;
  bets: Bet[];
  total_wagered: number;
  total_payout: number;
  net_result: number;
  created_at: string;
}

export interface Bet {
  type: BetType;
  numbers: number[];
  amount: number;
  label: string;
}

export type BetType =
  | 'straight'
  | 'split'
  | 'street'
  | 'corner'
  | 'line'
  | 'column'
  | 'dozen'
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high';
