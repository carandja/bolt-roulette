import React from 'react';
import { CHIP_VALUES, type ChipValue } from '../lib/roulette';

interface ChipSelectorProps {
  selectedChip: ChipValue;
  onSelect: (v: ChipValue) => void;
  balance: number;
}

const CHIP_STYLES: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800' },
  5: { bg: 'bg-red-600', border: 'border-red-800', text: 'text-white' },
  25: { bg: 'bg-green-600', border: 'border-green-800', text: 'text-white' },
  100: { bg: 'bg-blue-600', border: 'border-blue-800', text: 'text-white' },
  500: { bg: 'bg-yellow-500', border: 'border-yellow-700', text: 'text-black' },
};

export default function ChipSelector({ selectedChip, onSelect, balance }: ChipSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Chip</span>
      <div className="flex gap-2">
        {CHIP_VALUES.map((val) => {
          const style = CHIP_STYLES[val];
          const disabled = val > balance;
          const isSelected = selectedChip === val;
          return (
            <button
              key={val}
              onClick={() => !disabled && onSelect(val as ChipValue)}
              disabled={disabled}
              className={`
                relative w-12 h-12 rounded-full border-4 font-black text-sm
                transition-all duration-150 shadow-md
                ${style.bg} ${style.border} ${style.text}
                ${isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-stone-900' : ''}
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 cursor-pointer active:scale-95'}
              `}
            >
              {val >= 1000 ? `${val / 1000}K` : val}
              {/* Inner ring decoration */}
              <span className="absolute inset-1.5 rounded-full border-2 border-white/30 pointer-events-none" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
