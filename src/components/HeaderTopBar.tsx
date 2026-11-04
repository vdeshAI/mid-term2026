import React from 'react';
import { Radio, Download, RotateCcw } from 'lucide-react';

interface Props {
  onResetNight: () => void;
  onExportSummary: () => void;
  onFilterFlips: () => void;
  onFilterSenate: () => void;
  onFilterHouse: () => void;
}

export const HeaderTopBar: React.FC<Props> = ({
  onResetNight,
  onExportSummary,
  onFilterFlips,
  onFilterSenate,
  onFilterHouse,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span>US Election Desk 2026</span>
        </a>
        <span className="text-xs text-slate-400 border-l border-slate-800 pl-3 hidden sm:inline font-mono">
          November 3, 2026 Midterm Tracker
        </span>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={onFilterSenate}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Senate Races
        </button>
        <button
          onClick={onFilterHouse}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          House Districts
        </button>
        <button
          onClick={onFilterFlips}
          className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Battleground Flips
        </button>
        <button
          onClick={onResetNight}
          className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Reset Simulation
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportSummary}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Results</span>
        </button>
      </div>
    </header>
  );
};
