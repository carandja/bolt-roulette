import React from 'react';
import type { Bet } from '../lib/supabase';
import {
  getNumberColor, DOZENS, COLUMNS, LOW_NUMBERS, HIGH_NUMBERS,
  ODD_NUMBERS, EVEN_NUMBERS, RED_ARRAY, BLACK_ARRAY,
} from '../lib/roulette';
import type { ChipValue } from '../lib/roulette';

interface BettingTableProps {
  bets: Bet[];
  onBet: (bet: Omit<Bet, 'amount'> & { amount: number }) => void;
  selectedChip: ChipValue;
  disabled: boolean;
}

function getBetAmount(bets: Bet[], numbers: number[]): number {
  const key = numbers.slice().sort((a, b) => a - b).join(',');
  return bets
    .filter(b => b.numbers.slice().sort((a, b) => a - b).join(',') === key)
    .reduce((s, b) => s + b.amount, 0);
}

function ChipStack({ amount }: { amount: number }) {
  if (!amount) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="w-7 h-7 rounded-full bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center text-black text-xs font-black shadow-lg">
        {amount >= 1000 ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K` : amount}
      </div>
    </div>
  );
}

export default function BettingTable({ bets, onBet, selectedChip, disabled }: BettingTableProps) {
  function placeBet(type: Bet['type'], numbers: number[], label: string) {
    if (disabled) return;
    onBet({ type, numbers, label, amount: selectedChip });
  }

  const cellBase = `
    relative border border-green-800 cursor-pointer select-none
    transition-all duration-100 flex items-center justify-center font-bold
    hover:brightness-125 active:brightness-150
  `;

  const numberCell = (n: number) => {
    const color = getNumberColor(n);
    return (
      <div
        key={n}
        className={`${cellBase} text-white text-sm`}
        style={{
          background: color === 'red' ? '#b91c1c' : color === 'green' ? '#15803d' : '#1c1917',
          minWidth: '36px',
          height: '52px',
        }}
        onClick={() => placeBet('straight', [n], String(n))}
      >
        {n}
        <ChipStack amount={getBetAmount(bets, [n])} />
      </div>
    );
  };

  const outsideCell = (
    label: string,
    type: Bet['type'],
    numbers: number[],
    extraClass = '',
    style: React.CSSProperties = {}
  ) => {
    const amount = getBetAmount(bets, numbers);
    return (
      <div
        className={`${cellBase} text-white text-xs font-black uppercase tracking-wide ${extraClass}`}
        style={{ background: '#166534', height: '40px', ...style }}
        onClick={() => placeBet(type, numbers, label)}
      >
        {label}
        <ChipStack amount={amount} />
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Main grid */}
        <div className="flex">
          {/* Zero */}
          <div
            className={`${cellBase} text-white font-black`}
            style={{
              background: '#15803d',
              width: '36px',
              height: '156px',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
            }}
            onClick={() => placeBet('straight', [0], '0')}
          >
            0
            <ChipStack amount={getBetAmount(bets, [0])} />
          </div>

          {/* Numbers grid: rows top=3,6,9... bottom=1,4,7... */}
          <div className="flex flex-col">
            <div className="flex">
              {Array.from({ length: 12 }, (_, col) => numberCell(3 + col * 3))}
            </div>
            <div className="flex">
              {Array.from({ length: 12 }, (_, col) => numberCell(2 + col * 3))}
            </div>
            <div className="flex">
              {Array.from({ length: 12 }, (_, col) => numberCell(1 + col * 3))}
            </div>
          </div>

          {/* Column bets */}
          <div className="flex flex-col ml-1 gap-0.5">
            {COLUMNS.map((col, i) => (
              <div
                key={i}
                className={`${cellBase} text-white text-xs font-black`}
                style={{ background: '#166534', width: '44px', height: '52px' }}
                onClick={() => placeBet('column', col, `Col ${i + 1}`)}
              >
                2:1
                <ChipStack amount={getBetAmount(bets, col)} />
              </div>
            ))}
          </div>
        </div>

        {/* Dozen row */}
        <div className="flex mt-0.5" style={{ marginLeft: '37px' }}>
          {DOZENS.map((dozen, i) => (
            <div
              key={i}
              className={`${cellBase} text-white text-xs font-black flex-1`}
              style={{ background: '#166534', height: '36px' }}
              onClick={() => placeBet('dozen', dozen, `${i * 12 + 1}-${(i + 1) * 12}`)}
            >
              {i * 12 + 1}-{(i + 1) * 12}
              <ChipStack amount={getBetAmount(bets, dozen)} />
            </div>
          ))}
        </div>

        {/* Outside bets row */}
        <div className="flex mt-0.5 gap-0.5" style={{ marginLeft: '37px' }}>
          {outsideCell('1-18', 'low', LOW_NUMBERS, 'flex-1')}
          {outsideCell('Even', 'even', EVEN_NUMBERS, 'flex-1')}
          <div
            className={`${cellBase} flex-1`}
            style={{ background: '#b91c1c', height: '40px' }}
            onClick={() => placeBet('red', RED_ARRAY, 'Red')}
          >
            <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white" />
            <span className="text-white text-xs ml-1 font-black">Red</span>
            <ChipStack amount={getBetAmount(bets, RED_ARRAY)} />
          </div>
          <div
            className={`${cellBase} flex-1`}
            style={{ background: '#1c1917', height: '40px' }}
            onClick={() => placeBet('black', BLACK_ARRAY, 'Black')}
          >
            <div className="w-5 h-5 rounded-full bg-stone-900 border-2 border-white" />
            <span className="text-white text-xs ml-1 font-black">Black</span>
            <ChipStack amount={getBetAmount(bets, BLACK_ARRAY)} />
          </div>
          {outsideCell('Odd', 'odd', ODD_NUMBERS, 'flex-1')}
          {outsideCell('19-36', 'high', HIGH_NUMBERS, 'flex-1')}
        </div>
      </div>
    </div>
  );
}
