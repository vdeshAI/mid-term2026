import React from 'react';
import { Race, Party } from '../types/election';
import { CheckCircle2, TrendingUp, AlertTriangle, ArrowRight, RotateCcw, Award } from 'lucide-react';

interface Props {
  selectedRace: Race | null;
  selectedStateName: string;
  onManualCall?: (raceId: string, party: Party | null) => void;
  onClose?: () => void;
  allRaces?: Race[];
  onSelectRace?: (race: Race) => void;
  isPreElection?: boolean;
  onStartSimulation?: () => void;
}

export const RaceInspectorSidebar: React.FC<Props> = ({
  selectedRace,
  selectedStateName,
  onManualCall,
  onClose,
  allRaces = [],
  onSelectRace,
  isPreElection = false,
  onStartSimulation,
}) => {
  if (!selectedRace) {
    return (
      <aside className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 p-5 flex flex-col justify-between">
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">Race Inspector</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Hover over or click any state or competitive district on the map to inspect live results, historical margin swings, and candidate vote shares.
          </p>
        </div>

        {/* Quick select list of key battleground races */}
        <div>
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Key 2026 Battlegrounds
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {allRaces
              .filter((r) => r.isKeyBattleground)
              .slice(0, 6)
              .map((r) => {
                const leader = r.candidates[0];
                return (
                  <button
                    key={r.id}
                    onClick={() => onSelectRace && onSelectRace(r)}
                    className="w-full text-left p-2 rounded bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {leader ? `${leader.name} (${leader.party}) ${leader.percentage}%` : 'Counting'}
                      </div>
                    </div>
                    {r.isFlip && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded">
                        FLIP
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </aside>
    );
  }

  const {
    id,
    title,
    chamber,
    status,
    reportingPercent,
    totalVotes,
    candidates,
    lastWinner,
    isKeyBattleground,
    isFlip,
    analysis,
    counties,
    manualCall,
  } = selectedRace;

  // Candidate sorted by vote share descending
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const leader = sortedCandidates[0];
  const runnerUp = sortedCandidates[1];
  const marginDiff = leader && runnerUp ? (leader.percentage - runnerUp.percentage).toFixed(1) : '0.0';

  // Calculate historical swing compared to last election
  // If last time GOP won by 1.8%, and now DEM is leading by 1.6%, net swing to DEM = 3.4%
  let swingText = '';
  let swingDirection: 'DEM' | 'GOP' | 'NEUTRAL' = 'NEUTRAL';
  let swingMagnitude = 0;

  if (leader && lastWinner) {
    const currentDem = candidates.find((c) => c.party === 'DEM')?.percentage || 0;
    const currentGop = candidates.find((c) => c.party === 'GOP')?.percentage || 0;
    const currentMargin = currentDem - currentGop; // positive = Dem lead
    const previousMargin = lastWinner.demPercentage - lastWinner.gopPercentage; // positive = Dem lead
    const demSwing = currentMargin - previousMargin;

    if (Math.abs(demSwing) < 0.2) {
      swingText = 'Virtually unchanged from last election';
      swingDirection = 'NEUTRAL';
    } else if (demSwing > 0) {
      swingDirection = 'DEM';
      swingMagnitude = Math.abs(demSwing);
      swingText = `+${swingMagnitude.toFixed(1)}% shift toward Democrats`;
    } else {
      swingDirection = 'GOP';
      swingMagnitude = Math.abs(demSwing);
      swingText = `+${swingMagnitude.toFixed(1)}% shift toward Republicans`;
    }
  }

  const isCalled = status.includes('called');
  const winner = candidates.find((c) => c.isWinner);

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {chamber.toUpperCase()}
            </span>
            {isKeyBattleground && (
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.5 rounded">
                KEY BATTLEGROUND
              </span>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          )}
        </div>

        <h2 className="text-lg font-bold text-slate-100 leading-snug">{title}</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>{selectedStateName}</span>
          <span aria-hidden="true">·</span>
          <span>{reportingPercent}% expected vote reported</span>
        </div>

        {/* Status Callout Banner */}
        <div className="mt-3">
          {isPreElection ? (
            <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/70 text-xs text-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Existing 119th Congress Seat
                </span>
                <span className="font-mono text-[10px] text-amber-300">
                  Polls close {selectedRace.pollClosingTimeStr}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Incumbent: <strong>{lastWinner.winnerName}</strong> ({lastWinner.winnerParty}) · Outlook: <span className="font-semibold text-amber-300">{selectedRace.raceRating || 'Toss-Up / Battleground'}</span>
              </div>
              {onStartSimulation && (
                <button
                  onClick={onStartSimulation}
                  className="w-full mt-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
                >
                  <span>Start 7:00 PM Live Simulation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : winner ? (
            <div
              className={`p-2.5 rounded border text-xs font-semibold flex items-center justify-between ${
                winner.party === 'DEM'
                  ? 'bg-blue-950/60 border-blue-800/80 text-blue-200'
                  : 'bg-red-950/60 border-red-800/80 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  PROJECTED WINNER: <strong className="underline">{winner.name}</strong> ({winner.party})
                </span>
              </div>
              {isFlip ? (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                  PARTY FLIP
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-1.5 py-0.5 rounded">
                  PARTY HOLD
                </span>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Too Close to Call / Counting
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {reportingPercent}% reported
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* SECTION 1: CANDIDATE PERCENT VOTES & VOTE COUNTS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Candidates & Vote Share</span>
            <span className="font-mono">{totalVotes.toLocaleString()} total votes</span>
          </div>

          <div className="space-y-2">
            {sortedCandidates.map((cand) => {
              const isPartyDem = cand.party === 'DEM';
              const isPartyGop = cand.party === 'GOP';
              const isPartyInd = cand.party === 'IND';

              const barColor = isPartyDem
                ? 'bg-blue-600'
                : isPartyGop
                ? 'bg-red-600'
                : isPartyInd
                ? 'bg-purple-600'
                : 'bg-emerald-600';

              return (
                <div
                  key={cand.id}
                  className={`p-3 rounded-lg border transition-all ${
                    cand.isWinner
                      ? isPartyDem
                        ? 'bg-blue-950/30 border-blue-700/60'
                        : 'bg-red-950/30 border-red-700/60'
                      : 'bg-slate-950/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {cand.isWinner && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-sm font-semibold text-slate-100 mr-1.5">
                          {cand.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPartyDem
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : isPartyGop
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {cand.party}
                        </span>
                        {cand.isIncumbent && (
                          <span className="ml-1 text-[10px] text-slate-400 font-medium">
                            · Incumbent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold font-mono tabular-nums text-slate-100">
                        {cand.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Vote progress bar */}
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div
                      style={{ width: `${Math.min(cand.percentage, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>{cand.votes.toLocaleString()} votes</span>
                    {cand === leader && runnerUp && (
                      <span className="text-slate-300 font-semibold">
                        +{marginDiff}% lead ({Math.abs(leader.votes - runnerUp.votes).toLocaleString()} votes)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: LAST TIME WINNER & HISTORICAL SWING ANALYSIS (EXPLICIT REQUIREMENT) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Historical Comparison
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {lastWinner.year} Election
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Last Time Winner:</span>
              <span className="font-semibold text-slate-200">
                {lastWinner.winnerName}{' '}
                <span
                  className={
                    lastWinner.winnerParty === 'DEM'
                      ? 'text-blue-400 font-bold'
                      : 'text-red-400 font-bold'
                  }
                >
                  ({lastWinner.winnerParty})
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Previous Margin:</span>
              <span className="font-mono text-slate-200">
                {lastWinner.marginLeaderParty} +{lastWinner.margin.toFixed(1)}%{' '}
                <span className="text-[11px] text-slate-400">
                  ({lastWinner.demPercentage}% D - {lastWinner.gopPercentage}% R)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">2026 Net Swing:</span>
              <span
                className={`font-semibold font-mono ${
                  swingDirection === 'DEM'
                    ? 'text-blue-400'
                    : swingDirection === 'GOP'
                    ? 'text-red-400'
                    : 'text-slate-300'
                }`}
              >
                {swingText}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Party Transition:</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  isFlip
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isFlip
                  ? `FLIP: ${lastWinner.winnerParty} ➔ ${winner ? winner.party : leader.party}`
                  : `HOLD: ${lastWinner.winnerParty} Retained`}
              </span>
            </div>

            {lastWinner.notes && (
              <p className="text-[11px] text-slate-400 italic pt-1 leading-relaxed">
                {lastWinner.notes}
              </p>
            )}
          </div>
        </div>

        {/* SECTION 3: KEY COUNTIES / PRECINCT REPORTING */}
        {counties && counties.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Key County Reporting
            </div>
            <div className="space-y-1.5">
              {counties.map((c) => (
                <div
                  key={c.name}
                  className="p-2 rounded bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-200">{c.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {c.reporting}% in · {c.totalVotes.toLocaleString()} votes
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div className="text-blue-400 font-semibold">{c.demPct.toFixed(1)}% D</div>
                    <div className="text-red-400">{c.gopPct.toFixed(1)}% R</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: EDITORIAL RACE ANALYSIS */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-300 leading-relaxed">
          <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
            <span>Race Stakes & Context</span>
          </div>
          <p>{analysis}</p>
        </div>

        {/* SECTION 5: WHAT-IF MANUAL CALL SCENARIO CONTROLS */}
        <div className="border-t border-slate-800 pt-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>What-If Scenario Simulation</span>
            {manualCall && (
              <span className="text-[10px] text-amber-400 font-mono">
                Manual Override Active
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onManualCall && onManualCall(id, 'DEM')}
              className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                manualCall === 'DEM'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-950 text-blue-300 border-slate-800 hover:bg-blue-950/50'
              }`}
            >
              Simulate Dem Call
            </button>
            <button
              onClick={() => onManualCall && onManualCall(id, 'GOP')}
              className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                manualCall === 'GOP'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-950 text-red-300 border-slate-800 hover:bg-red-950/50'
              }`}
            >
              Simulate GOP Call
            </button>
            <button
              onClick={() => onManualCall && onManualCall(id, null)}
              className="px-2 py-1.5 text-xs font-medium rounded bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
