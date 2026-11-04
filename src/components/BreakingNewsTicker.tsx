import React from 'react';
import { RaceCallAlert } from '../types/election';
import { AlertCircle, Flame, ArrowRight } from 'lucide-react';

interface Props {
  latestAlert: RaceCallAlert | null;
  onSelectRaceAlert: (raceId: string) => void;
  onDismissAlert?: () => void;
  isPreElection?: boolean;
  onStartSimulation?: () => void;
}

export const BreakingNewsTicker: React.FC<Props> = ({
  latestAlert,
  onSelectRaceAlert,
  onDismissAlert,
  isPreElection = false,
  onStartSimulation,
}) => {
  if (isPreElection) {
    return (
      <div className="w-full py-2 px-4 bg-slate-900 border-b border-slate-800 text-xs font-medium text-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase">
              PRE-ELECTION BASELINE
            </span>
            <span className="text-slate-200 font-semibold">
              Showing existing 119th Congress composition for Senate (51D-49R) and House (220R-215D).
            </span>
            <span className="hidden md:inline text-slate-400 font-mono text-[11px]">
              Live simulation & race calls start at 7:00 PM EST.
            </span>
          </div>

          {onStartSimulation && (
            <button
              onClick={onStartSimulation}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
            >
              <span>Start 7:00 PM Live Simulation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!latestAlert) return null;

  const isDem = latestAlert.winnerParty === 'DEM';
  const isFlip = latestAlert.isFlip;

  return (
    <div
      className={`w-full py-2 px-4 transition-all duration-300 border-b flex items-center justify-between text-xs font-semibold ${
        isFlip
          ? 'bg-amber-950/90 border-amber-600/80 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
          : isDem
          ? 'bg-blue-950/90 border-blue-600/80 text-blue-100 shadow-[0_0_15px_rgba(37,99,235,0.25)]'
          : 'bg-red-950/90 border-red-600/80 text-red-100 shadow-[0_0_15px_rgba(220,38,38,0.25)]'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase">
            {isFlip ? <Flame className="w-3 h-3 fill-slate-950" /> : <AlertCircle className="w-3 h-3" />}
            {isFlip ? 'KEY RACE FLIP' : 'PROJECTION ALERT'}
          </span>

          <span className="font-mono text-slate-300 text-[11px]">
            {latestAlert.timestamp}
          </span>

          <span className="font-bold">
            {latestAlert.title}: Projected winner is{' '}
            <span className="underline decoration-2">{latestAlert.winnerName}</span> (
            {latestAlert.winnerParty})
          </span>

          {isFlip ? (
            <span className="text-amber-300 font-mono text-[11px] bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-700">
              Flipped from {latestAlert.flippedFromParty} ({latestAlert.shiftPct > 0 ? `+${latestAlert.shiftPct.toFixed(1)}%` : `${latestAlert.shiftPct.toFixed(1)}%`} swing)
            </span>
          ) : (
            <span className="text-slate-300 font-mono text-[11px] bg-slate-900/60 px-1.5 py-0.5 rounded">
              {latestAlert.winnerParty} HOLD
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectRaceAlert(latestAlert.raceId)}
            className="flex items-center gap-1 text-slate-200 hover:text-white underline text-xs font-medium cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onDismissAlert && (
            <button
              onClick={onDismissAlert}
              className="text-slate-400 hover:text-slate-200 text-xs ml-2 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
