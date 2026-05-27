import React, { useEffect, useState } from 'react';
import { getNumberColor } from '../lib/roulette';
import type { Bet } from '../lib/supabase';

interface ResultModalProps {
  winningNumber: number;
  payout: number;
  totalWagered: number;
  bets: Bet[];
  onClose: () => void;
}

export default function ResultModal({ winningNumber, payout, totalWagered, bets, onClose }: ResultModalProps) {
  const [visible, setVisible] = useState(false);
  const net = payout - totalWagered;
  const color = getNumberColor(winningNumber);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const winningBets = bets.filter(b => b.numbers.includes(winningNumber));

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-all duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={`
          bg-stone-900 border border-stone-700 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl
          transition-all duration-300
          ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'}
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Number */}
        <div className="flex justify-center mb-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black text-white border-4 border-yellow-400 shadow-xl"
            style={{
              background: color === 'red' ? '#dc2626' : color === 'green' ? '#16a34a' : '#111',
            }}
          >
            {winningNumber}
          </div>
        </div>

        <p className="text-center text-stone-400 text-sm uppercase tracking-widest mb-1">
          {color === 'green' ? 'Green' : color === 'red' ? 'Red' : 'Black'}
          {winningNumber > 0 && ` • ${winningNumber % 2 === 0 ? 'Even' : 'Odd'}`}
          {winningNumber > 0 && ` • ${winningNumber <= 18 ? '1-18' : '19-36'}`}
        </p>

        <h2 className={`text-3xl font-black text-center mb-6 ${net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : 'text-stone-400'}`}>
          {net > 0 ? `+$${net.toLocaleString()}` : net < 0 ? `-$${Math.abs(net).toLocaleString()}` : 'Push'}
        </h2>

        {winningBets.length > 0 && (
          <div className="mb-4 space-y-1">
            {winningBets.map((b, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-stone-400">{b.label}</span>
                <span className="text-emerald-400 font-semibold">+${(b.amount * (getPayoutMultiplier(b.type))).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-stone-700 pt-4 space-y-1 text-sm mb-6">
          <div className="flex justify-between text-stone-400">
            <span>Wagered</span>
            <span>${totalWagered.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>Payout</span>
            <span>${payout.toLocaleString()}</span>
          </div>
          <div className={`flex justify-between font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <span>Net</span>
            <span>{net >= 0 ? '+' : ''}${net.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition-colors text-sm uppercase tracking-wider"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function getPayoutMultiplier(type: Bet['type']): number {
  const map: Record<string, number> = {
    straight: 35, split: 17, street: 11, corner: 8, line: 5,
    column: 2, dozen: 2, red: 1, black: 1, even: 1, odd: 1, low: 1, high: 1,
  };
  return map[type] ?? 1;
}
