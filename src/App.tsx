import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, TrendingUp, DollarSign, Award } from 'lucide-react';
import RouletteWheel from './components/RouletteWheel';
import BettingTable from './components/BettingTable';
import ChipSelector from './components/ChipSelector';
import SpinHistory from './components/SpinHistory';
import ResultModal from './components/ResultModal';
import { supabase, type RouletteSession, type RouletteSpin, type Bet } from './lib/supabase';
import { spinWheel, calculateAllPayouts, type ChipValue } from './lib/roulette';

const SESSION_KEY = 'roulette_session_id';

type GamePhase = 'betting' | 'spinning' | 'result';

export default function App() {
  const [session, setSession] = useState<RouletteSession | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [selectedChip, setSelectedChip] = useState<ChipValue>(25);
  const [phase, setPhase] = useState<GamePhase>('betting');
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [lastPayout, setLastPayout] = useState(0);
  const [spinsHistory, setSpinsHistory] = useState<RouletteSpin[]>([]);
  const [lastWagered, setLastWagered] = useState(0);
  const [lastBets, setLastBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  // Load or create session
  useEffect(() => {
    async function init() {
      const storedId = localStorage.getItem(SESSION_KEY);

      if (storedId) {
        const { data } = await supabase
          .from('roulette_sessions')
          .select('*')
          .eq('id', storedId)
          .maybeSingle();

        if (data) {
          setSession(data as RouletteSession);
          // Load spin history
          const { data: spins } = await supabase
            .from('roulette_spins')
            .select('*')
            .eq('session_id', storedId)
            .order('created_at', { ascending: false })
            .limit(20);
          if (spins) setSpinsHistory(spins as RouletteSpin[]);
          setLoading(false);
          return;
        }
      }

      // Create new session
      const { data: newSession } = await supabase
        .from('roulette_sessions')
        .insert({ balance: 1000 })
        .select()
        .single();

      if (newSession) {
        localStorage.setItem(SESSION_KEY, newSession.id);
        setSession(newSession as RouletteSession);
      }
      setLoading(false);
    }
    init();
  }, []);

  const totalBetAmount = bets.reduce((s, b) => s + b.amount, 0);

  const handleBet = useCallback((bet: Bet) => {
    if (!session || phase !== 'betting') return;
    if (totalBetAmount + bet.amount > session.balance) return;

    setBets(prev => {
      // Check if same bet type+numbers already exists, accumulate
      const key = bet.numbers.slice().sort((a, b) => a - b).join(',');
      const existingIdx = prev.findIndex(
        b => b.numbers.slice().sort((a, b) => a - b).join(',') === key
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], amount: updated[existingIdx].amount + bet.amount };
        return updated;
      }
      return [...prev, bet];
    });
  }, [session, phase, totalBetAmount]);

  const handleSpin = useCallback(async () => {
    if (!session || bets.length === 0 || phase !== 'betting') return;

    const num = spinWheel();
    setWinningNumber(num);
    setLastBets([...bets]);
    setLastWagered(totalBetAmount);
    setPhase('spinning');
  }, [session, bets, phase, totalBetAmount]);

  const handleSpinComplete = useCallback(async () => {
    if (!session || winningNumber === null) return;

    const payout = calculateAllPayouts(lastBets, winningNumber);
    const newBalance = session.balance - lastWagered + payout;

    setLastPayout(payout);

    // Save spin to DB
    const spinData = {
      session_id: session.id,
      winning_number: winningNumber,
      bets: lastBets,
      total_wagered: lastWagered,
      total_payout: payout,
      net_result: payout - lastWagered,
    };

    const { data: newSpin } = await supabase
      .from('roulette_spins')
      .insert(spinData)
      .select()
      .single();

    // Update session
    const { data: updatedSession } = await supabase
      .from('roulette_sessions')
      .update({
        balance: newBalance,
        total_wagered: session.total_wagered + lastWagered,
        total_won: session.total_won + payout,
        games_played: session.games_played + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updatedSession) setSession(updatedSession as RouletteSession);
    if (newSpin) setSpinsHistory(prev => [newSpin as RouletteSpin, ...prev].slice(0, 20));

    setPhase('result');
  }, [session, winningNumber, lastBets, lastWagered]);

  const handleCloseResult = () => {
    setBets([]);
    setWinningNumber(null);
    setPhase('betting');
    // If broke, reset balance
    if (session && session.balance < 1) {
      handleResetBalance();
    }
  };

  const handleResetBalance = async () => {
    if (!session) return;
    const { data } = await supabase
      .from('roulette_sessions')
      .update({ balance: 1000, updated_at: new Date().toISOString() })
      .eq('id', session.id)
      .select()
      .single();
    if (data) setSession(data as RouletteSession);
  };

  const handleClearBets = () => {
    if (phase !== 'betting') return;
    setBets([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-yellow-400 text-xl font-bold animate-pulse">Loading Table...</div>
      </div>
    );
  }

  const balance = session?.balance ?? 0;
  const netSession = session ? session.total_won - session.total_wagered : 0;

  return (
    <div className="min-h-screen bg-stone-950 text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <span className="text-black font-black text-sm">R</span>
            </div>
            <span className="text-xl font-black tracking-tight text-yellow-400">James's Roulette</span>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <Award size={14} className="text-yellow-400" />
              <span className="text-stone-400">Played:</span>
              <span className="font-bold">{session?.games_played ?? 0}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <TrendingUp size={14} className={netSession >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              <span className="text-stone-400">Net:</span>
              <span className={`font-bold ${netSession >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netSession >= 0 ? '+' : ''}${netSession.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-stone-800 rounded-lg px-3 py-1.5">
              <DollarSign size={14} className="text-yellow-400" />
              <span className="font-black text-yellow-400">{balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* Left: Wheel */}
          <div className="flex flex-col items-center gap-4 w-full xl:w-auto xl:sticky xl:top-24">
            <RouletteWheel
              spinning={phase === 'spinning'}
              winningNumber={phase === 'spinning' || phase === 'result' ? winningNumber : null}
              onSpinComplete={handleSpinComplete}
            />
            <SpinHistory spins={spinsHistory} />
          </div>

          {/* Right: Betting area */}
          <div className="flex-1 w-full min-w-0">
            {/* Chip selector */}
            <div className="bg-stone-900 border border-stone-700 rounded-2xl p-4 mb-4">
              <ChipSelector selectedChip={selectedChip} onSelect={setSelectedChip} balance={balance} />
            </div>

            {/* Betting table */}
            <div className="bg-green-900 border border-green-700 rounded-2xl p-4 shadow-inner mb-4 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #14532d 100%)' }}
            >
              <p className="text-xs text-green-300/60 uppercase tracking-wider font-semibold mb-3">Place Your Bets</p>
              <BettingTable
                bets={bets}
                onBet={handleBet}
                selectedChip={selectedChip}
                disabled={phase !== 'betting'}
              />
            </div>

            {/* Bet summary + actions */}
            <div className="bg-stone-900 border border-stone-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider">Total Bet</p>
                  <p className="text-2xl font-black text-yellow-400">
                    ${totalBetAmount.toLocaleString()}
                  </p>
                </div>
                {bets.length > 0 && phase === 'betting' && (
                  <div className="text-right text-sm text-stone-400">
                    <p>{bets.length} position{bets.length !== 1 ? 's' : ''}</p>
                    <button
                      onClick={handleClearBets}
                      className="flex items-center gap-1 text-stone-500 hover:text-red-400 transition-colors mt-1 text-xs ml-auto"
                    >
                      <RotateCcw size={12} />
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Active bets list */}
              {bets.length > 0 && (
                <div className="mb-4 max-h-28 overflow-y-auto space-y-1">
                  {bets.map((b, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-stone-800">
                      <span className="text-stone-300">{b.label}</span>
                      <span className="text-yellow-400 font-semibold">${b.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSpin}
                disabled={bets.length === 0 || phase !== 'betting'}
                className={`
                  w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider
                  transition-all duration-200
                  ${bets.length > 0 && phase === 'betting'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black hover:from-yellow-400 hover:to-yellow-300 shadow-lg hover:shadow-yellow-500/25 active:scale-98'
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                  }
                `}
              >
                {phase === 'spinning' ? 'Spinning...' : 'Spin'}
              </button>

              {balance < 1 && phase === 'betting' && (
                <button
                  onClick={handleResetBalance}
                  className="w-full mt-3 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-colors"
                >
                  Reset Balance ($1,000)
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Result modal */}
      {phase === 'result' && winningNumber !== null && (
        <ResultModal
          winningNumber={winningNumber}
          payout={lastPayout}
          totalWagered={lastWagered}
          bets={lastBets}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
}
