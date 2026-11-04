import React from 'react';
import { BalanceOfPower } from '../types/election';

interface Props {
  balance: BalanceOfPower;
  activeChamber: 'senate' | 'house';
  setActiveChamber: (chamber: 'senate' | 'house') => void;
  isPreElection: boolean;
  onToggleViewMode?: (isPre: boolean) => void;
}

export const BalanceOfPowerBar: React.FC<Props> = ({
  balance,
  activeChamber,
  setActiveChamber,
  isPreElection,
  onToggleViewMode,
}) => {
  const { senate, house } = balance;

  // If in pre-election mode, show existing 119th congress composition
  const existingSenate = {
    dem: 51, // 47 Dem + 4 Ind caucusing
    gop: 49,
    uncalled: 0,
    majorityNeeded: 50,
    totalSeats: 100,
    majorityParty: 'DEM',
    demNetGain: 0,
    gopNetGain: 0,
  };

  const existingHouse = {
    dem: 215,
    gop: 220,
    uncalled: 0,
    majorityNeeded: 218,
    totalSeats: 435,
    majorityParty: 'GOP',
    demNetGain: 0,
    gopNetGain: 0,
  };

  const currentData = isPreElection
    ? activeChamber === 'senate'
      ? existingSenate
      : existingHouse
    : activeChamber === 'senate'
    ? senate
    : house;
  const majorityThreshold = currentData.majorityNeeded;
  const total = currentData.totalSeats;

  const demPct = (currentData.dem / total) * 100;
  const gopPct = (currentData.gop / total) * 100;
  const uncalledPct = (currentData.uncalled / total) * 100;
  const majorityPct = (majorityThreshold / total) * 100;

  const demHasMajority = currentData.dem >= majorityThreshold;
  const gopHasMajority = currentData.gop >= majorityThreshold;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        {/* Chamber switcher & summary row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          {/* Chamber tabs */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setActiveChamber('senate')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeChamber === 'senate'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Senate (100)
              </button>
              <button
                onClick={() => setActiveChamber('house')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeChamber === 'house'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                House of Reps (435)
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            {onToggleViewMode && (
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 ml-2">
                <button
                  onClick={() => onToggleViewMode(true)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    isPreElection
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Existing 119th Congress (Pre-7 PM)
                </button>
                <button
                  onClick={() => onToggleViewMode(false)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    !isPreElection
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live Election Returns (7 PM+)
                </button>
              </div>
            )}
          </div>

          {/* Status banner */}
          <div className="flex items-center gap-4 text-xs">
            {isPreElection ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                EXISTING CONGRESS BASELINE · Polls open, counting begins at 7:00 PM EST
              </span>
            ) : demHasMajority ? (
              <span className="text-blue-400 font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                DEMOCRATIC MAJORITY PROJECTED
              </span>
            ) : gopHasMajority ? (
              <span className="text-red-400 font-semibold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                REPUBLICAN MAJORITY PROJECTED
              </span>
            ) : (
              <span className="text-slate-400 font-medium">
                {currentData.uncalled} races left to call · Balance of power undecided
              </span>
            )}

            {!isPreElection && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-blue-400">
                  Dem Net: {currentData.demNetGain >= 0 ? `+${currentData.demNetGain}` : currentData.demNetGain}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-red-400">
                  GOP Net: {currentData.gopNetGain >= 0 ? `+${currentData.gopNetGain}` : currentData.gopNetGain}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live balance numbers and graphic bar */}
        <div className="space-y-1.5">
          {/* Numbers strip */}
          <div className="flex justify-between items-baseline font-mono text-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold text-blue-400 tabular-nums">
                {currentData.dem}
              </span>
              <span className="text-slate-400 text-xs">Democrats</span>
              {currentData.dem >= majorityThreshold && (
                <span className="text-[10px] text-blue-300 bg-blue-950/80 border border-blue-800 px-1.5 py-0.2 rounded font-sans font-semibold">
                  MAJORITY
                </span>
              )}
            </div>

            <div className="text-center text-slate-400 text-[11px]">
              <span className="font-semibold text-slate-300 tabular-nums">{majorityThreshold}</span> needed
            </div>

            <div className="flex items-baseline gap-2 text-right">
              {currentData.gop >= majorityThreshold && (
                <span className="text-[10px] text-red-300 bg-red-950/80 border border-red-800 px-1.5 py-0.2 rounded font-sans font-semibold">
                  MAJORITY
                </span>
              )}
              <span className="text-slate-400 text-xs">Republicans</span>
              <span className="text-sm sm:text-base font-bold text-red-400 tabular-nums">
                {currentData.gop}
              </span>
            </div>
          </div>

          {/* Progress bar container */}
          <div className="relative h-4 sm:h-5 bg-slate-950 rounded overflow-hidden border border-slate-800 flex">
            {/* Democratic portion */}
            <div
              style={{ width: `${demPct}%` }}
              className="h-full bg-blue-600 transition-all duration-500 flex items-center justify-start pl-2"
            >
              {demPct > 8 && (
                <span className="text-[10px] font-bold text-white font-mono tabular-nums">
                  {currentData.dem}
                </span>
              )}
            </div>

            {/* Uncalled center portion */}
            <div
              style={{ width: `${uncalledPct}%` }}
              className="h-full bg-slate-800/80 transition-all duration-500 flex items-center justify-center border-x border-slate-700/60"
            >
              {uncalledPct > 12 && (
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {currentData.uncalled} uncalled
                </span>
              )}
            </div>

            {/* Republican portion */}
            <div
              style={{ width: `${gopPct}%` }}
              className="h-full bg-red-600 transition-all duration-500 flex items-center justify-end pr-2"
            >
              {gopPct > 8 && (
                <span className="text-[10px] font-bold text-white font-mono tabular-nums">
                  {currentData.gop}
                </span>
              )}
            </div>

            {/* Majority marker needle */}
            <div
              style={{ left: `${majorityPct}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
              title={`${majorityThreshold} seats needed for majority`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
