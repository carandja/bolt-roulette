import React from 'react';
import type { RouletteSpin } from '../lib/supabase';
import { getNumberColor } from '../lib/roulette';

interface SpinHistoryProps {
  spins: RouletteSpin[];
}

export default function SpinHistory({ spins }: SpinHistoryProps) {
  if (spins.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-2">Recent Results</p>
      <div className="flex gap-1.5 flex-wrap">
        {spins.slice(0, 20).map((spin) => {
          const color = getNumberColor(spin.winning_number);
          return (
            <div
              key={spin.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black border-2 shadow-md"
              style={{
                background: color === 'red' ? '#dc2626' : color === 'green' ? '#16a34a' : '#1c1917',
                borderColor: color === 'red' ? '#b91c1c' : color === 'green' ? '#15803d' : '#111',
              }}
              title={`Net: ${spin.net_result >= 0 ? '+' : ''}${spin.net_result}`}
            >
              {spin.winning_number}
            </div>
          );
        })}
      </div>
    </div>
  );
}
