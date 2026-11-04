import React, { useState } from 'react';
import { Race, RaceCallAlert } from '../types/election';
import { CheckCircle2, Search, Filter, Flame } from 'lucide-react';

interface Props {
  alerts: RaceCallAlert[];
  allRaces: Race[];
  onSelectRace: (race: Race) => void;
  selectedRaceId?: string;
}

export const LiveCallsStream: React.FC<Props> = ({
  alerts,
  allRaces,
  onSelectRace,
  selectedRaceId,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'flips' | 'battlegrounds' | 'senate' | 'house'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine and sort called races
  const calledRaces = allRaces.filter((r) => r.candidates.some((c) => c.isWinner));

  const filteredRaces = calledRaces.filter((r) => {
    if (filterMode === 'flips' && !r.isFlip) return false;
    if (filterMode === 'battlegrounds' && !r.isKeyBattleground) return false;
    if (filterMode === 'senate' && r.chamber !== 'senate') return false;
    if (filterMode === 'house' && r.chamber !== 'house') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = r.title.toLowerCase().includes(q);
      const matchesState = r.stateName.toLowerCase().includes(q);
      const matchesCand = r.candidates.some((c) => c.name.toLowerCase().includes(q));
      if (!matchesTitle && !matchesState && !matchesCand) return false;
    }

    return true;
  });

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Live Race Call Stream</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {calledRaces.length} Called
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search state or candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Calls
              </button>
              <button
                onClick={() => setFilterMode('flips')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                  filterMode === 'flips'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-400 hover:text-amber-200'
                }`}
              >
                <Flame className="w-3 h-3" />
                Flips Only
              </button>
              <button
                onClick={() => setFilterMode('battlegrounds')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterMode === 'battlegrounds'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Battlegrounds
              </button>
              <button
                onClick={() => setFilterMode('senate')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterMode === 'senate'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Senate
              </button>
              <button
                onClick={() => setFilterMode('house')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  filterMode === 'house'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                House
              </button>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        {filteredRaces.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800">
            No called races match the selected criteria yet. Advance simulation time or click "Next Call" to watch live projections unfold.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {filteredRaces.map((race) => {
              const winner = race.candidates.find((c) => c.isWinner);
              const runnerUp = race.candidates.find((c) => !c.isWinner);
              const isSelected = selectedRaceId === race.id;

              return (
                <div
                  key={race.id}
                  onClick={() => onSelectRace(race)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-yellow-400 shadow-md ring-1 ring-yellow-400'
                      : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-100 truncate">{race.title}</span>
                    {race.isFlip ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950 border border-amber-800 px-1 py-0.2 rounded shrink-0">
                        FLIP
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {race.pollClosingTimeStr}
                      </span>
                    )}
                  </div>

                  {winner && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-slate-200 truncate">
                            {winner.name}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold text-xs ${
                            winner.party === 'DEM' ? 'text-blue-400' : 'text-red-400'
                          }`}
                        >
                          {winner.percentage.toFixed(1)}%
                        </span>
                      </div>

                      {runnerUp && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="truncate">{runnerUp.name}</span>
                          <span className="font-mono tabular-nums">
                            {runnerUp.percentage.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Historical Shift footer */}
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                    <span>Last: {race.lastWinner.winnerParty} +{race.lastWinner.margin}%</span>
                    <span className="text-slate-300">
                      {race.isFlip ? 'Flipped' : 'Held'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
