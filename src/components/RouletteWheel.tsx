import React, { useRef, useEffect, useState } from 'react';
import { WHEEL_ORDER, getNumberColor, getWheelAngle } from '../lib/roulette';

interface RouletteWheelProps {
  spinning: boolean;
  winningNumber: number | null;
  onSpinComplete: () => void;
}

const SLICE_DEG = 360 / WHEEL_ORDER.length;
const R_OUTER = 180;
const R_INNER = 60;
const CX = 200;
const CY = 200;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(startAngle: number, endAngle: number, rOuter: number, rInner: number) {
  const p1 = polarToCartesian(CX, CY, rOuter, startAngle);
  const p2 = polarToCartesian(CX, CY, rOuter, endAngle);
  const p3 = polarToCartesian(CX, CY, rInner, endAngle);
  const p4 = polarToCartesian(CX, CY, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

export default function RouletteWheel({ spinning, winningNumber, onSpinComplete }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startRotRef = useRef(0);
  const targetRotRef = useRef(0);

  useEffect(() => {
    if (!spinning || winningNumber === null) return;

    const targetAngle = getWheelAngle(winningNumber);
    // Spin at least 5 full rotations + land on the target
    // The wheel rotates so the slice lands under the top marker (0 deg)
    // To align the number at top, rotate to (360 - targetAngle) mod 360
    const spins = 5 + Math.floor(Math.random() * 3);
    const targetRot = 360 - targetAngle;
    const finalRot = startRotRef.current + spins * 360 + targetRot;
    targetRotRef.current = finalRot;
    startRotRef.current = rotation;
    startTimeRef.current = null;
    setIsAnimating(true);

    const DURATION = 5000;

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(ts: number) {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = easeOut(t);
      const currentRot = startRotRef.current + (finalRot - startRotRef.current) * eased;
      setRotation(currentRot);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setRotation(finalRot);
        startRotRef.current = finalRot;
        setIsAnimating(false);
        onSpinComplete();
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning, winningNumber]);

  const numberColors: Record<string, string> = {
    green: '#16a34a',
    red: '#dc2626',
    black: '#1c1917',
  };

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Outer ring / table felt border */}
      <div className="rounded-full p-3 bg-gradient-to-br from-yellow-800 via-yellow-700 to-yellow-900 shadow-2xl">
        <div className="rounded-full p-2 bg-gradient-to-br from-yellow-600 to-yellow-800">
          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isAnimating ? 'none' : undefined,
            }}
          >
            {/* Background circle */}
            <circle cx={CX} cy={CY} r={R_OUTER + 5} fill="#111" />

            {/* Wheel slices */}
            {WHEEL_ORDER.map((num, i) => {
              const startAngle = i * SLICE_DEG;
              const endAngle = (i + 1) * SLICE_DEG;
              const color = getNumberColor(num);
              const midAngle = startAngle + SLICE_DEG / 2;
              const textPos = polarToCartesian(CX, CY, (R_OUTER + R_INNER) / 2 + 10, midAngle);

              return (
                <g key={num}>
                  <path
                    d={slicePath(startAngle, endAngle, R_OUTER, R_INNER)}
                    fill={numberColors[color]}
                    stroke="#c9a84c"
                    strokeWidth="0.5"
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="white"
                    transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                  >
                    {num}
                  </text>
                </g>
              );
            })}

            {/* Center hub */}
            <circle cx={CX} cy={CY} r={R_INNER} fill="#1c1917" stroke="#c9a84c" strokeWidth="3" />
            <circle cx={CX} cy={CY} r={45} fill="#292524" />
            <circle cx={CX} cy={CY} r={28} fill="#c9a84c" />
            <circle cx={CX} cy={CY} r={20} fill="#1c1917" />
            <circle cx={CX} cy={CY} r={8} fill="#c9a84c" />

            {/* Dividers between slices */}
            {WHEEL_ORDER.map((_, i) => {
              const angle = i * SLICE_DEG;
              const p1 = polarToCartesian(CX, CY, R_INNER, angle);
              const p2 = polarToCartesian(CX, CY, R_OUTER, angle);
              return (
                <line
                  key={i}
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke="#c9a84c"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Ball marker at top */}
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-yellow-400 z-10 shadow-lg"
        style={{ background: 'white', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }}
      />

      {/* Winning number display */}
      {winningNumber !== null && !isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full w-16 h-16 flex items-center justify-center text-2xl font-black text-white shadow-2xl border-4 border-yellow-400"
            style={{
              background: getNumberColor(winningNumber) === 'green'
                ? '#16a34a'
                : getNumberColor(winningNumber) === 'red'
                ? '#dc2626'
                : '#111',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {winningNumber}
          </div>
        </div>
      )}
    </div>
  );
}
