import type { Bet, BetType } from './supabase';

export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function getNumberColor(n: number): 'red' | 'black' | 'green' {
  if (n === 0) return 'green';
  return RED_NUMBERS.has(n) ? 'red' : 'black';
}

export const PAYOUTS: Record<BetType, number> = {
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  line: 5,
  column: 2,
  dozen: 2,
  red: 1,
  black: 1,
  even: 1,
  odd: 1,
  low: 1,
  high: 1,
};

export function calculatePayout(bet: Bet, winningNumber: number): number {
  const hits = bet.numbers.includes(winningNumber);
  if (!hits) return 0;
  return bet.amount * (PAYOUTS[bet.type] + 1);
}

export function calculateAllPayouts(bets: Bet[], winningNumber: number): number {
  return bets.reduce((total, bet) => total + calculatePayout(bet, winningNumber), 0);
}

export function spinWheel(): number {
  return Math.floor(Math.random() * 37);
}

// European roulette wheel order (physical positions)
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export function getWheelAngle(number: number): number {
  const idx = WHEEL_ORDER.indexOf(number);
  const sliceDeg = 360 / WHEEL_ORDER.length;
  return idx * sliceDeg;
}

// Outside bets number lists
export const DOZENS: number[][] = [
  Array.from({ length: 12 }, (_, i) => i + 1),
  Array.from({ length: 12 }, (_, i) => i + 13),
  Array.from({ length: 12 }, (_, i) => i + 25),
];

export const COLUMNS: number[][] = [
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
];

export const LOW_NUMBERS = Array.from({ length: 18 }, (_, i) => i + 1);
export const HIGH_NUMBERS = Array.from({ length: 18 }, (_, i) => i + 19);
export const ODD_NUMBERS = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 !== 0);
export const EVEN_NUMBERS = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => n % 2 === 0);
export const RED_ARRAY = [...RED_NUMBERS];
export const BLACK_ARRAY = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => !RED_NUMBERS.has(n));

export const CHIP_VALUES = [1, 5, 25, 100, 500];

export type ChipValue = 1 | 5 | 25 | 100 | 500;
