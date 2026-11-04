import React, { useState } from 'react';
import { Race, StateDelegation } from '../types/election';
import { US_STATE_PATHS, SMALL_STATES_BREAKOUT } from '../data/usStatePaths';
import { EXISTING_SENATE_REPRESENTATION } from '../data/electionData';
import { CheckCircle2, TrendingUp, Sparkles, Building2, Clock } from 'lucide-react';

interface Props {
  races: Race[];
  stateDelegations: Record<string, StateDelegation>;
  activeChamber: 'senate' | 'house';
  selectedRace: Race | null;
  onSelectRace: (race: Race) => void;
  recentlyCalledRaceId: string | null;
  selectedStateId: string | null;
  onSelectState: (stateId: string) => void;
  isPreElection: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  stateId: string;
  stateName: string;
  race: Race | null;
  delegation: StateDelegation | null;
}

export const ElectionMap: React.FC<Props> = ({
  races,
  stateDelegations,
  activeChamber,
  selectedRace,
  onSelectRace,
  recentlyCalledRaceId,
  selectedStateId,
  onSelectState,
  isPreElection,
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    stateId: '',
    stateName: '',
    race: null,
    delegation: null,
  });

  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);

  // Helper to find the relevant race for a given state
  const getRaceForState = (stateId: string): Race | null => {
    if (activeChamber === 'senate') {
      return races.find((r) => r.stateId === stateId && r.chamber === 'senate') || null;
    } else {
      // In house mode, return competitive district if available or general
      return (
        races.find((r) => r.stateId === stateId && r.chamber === 'house') ||
        races.find((r) => r.stateId === stateId) ||
        null
      );
    }
  };

  // Determine state fill color
  const getStateFill = (stateId: string): string => {
    // 1. PRE-ELECTION MODE: Show existing map for senate and congress
    if (isPreElection) {
      if (activeChamber === 'senate') {
        const existingRep = EXISTING_SENATE_REPRESENTATION[stateId];
        if (existingRep) {
          if (existingRep.delegationParty === 'DEM') return '#1d4ed8'; // Both Dem
          if (existingRep.delegationParty === 'GOP') return '#dc2626'; // Both GOP
          if (existingRep.delegationParty === 'SPLIT') return '#7c3aed'; // Split (1 Dem / 1 GOP)
        }
        return '#334155';
      } else {
        // Existing House Delegation
        const delegation = stateDelegations[stateId];
        if (delegation) {
          if (delegation.houseDemSeats > delegation.houseGopSeats) return '#1d4ed8';
          if (delegation.houseGopSeats > delegation.houseDemSeats) return '#dc2626';
          return '#7c3aed'; // Tied delegation
        }
        return '#334155';
      }
    }

    // 2. LIVE ELECTION NIGHT MODE (7:00 PM EST and onward)
    const race = getRaceForState(stateId);
    const delegation = stateDelegations[stateId];

    if (activeChamber === 'senate') {
      if (race) {
        // Class II race up for election
        const winner = race.candidates.find((c) => c.isWinner);
        if (winner) {
          return winner.party === 'DEM' ? '#2563eb' : '#dc2626'; // Bright Dem Blue / GOP Red
        }

        // In progress / counting
        const sorted = [...race.candidates].sort((a, b) => b.votes - a.votes);
        const leader = sorted[0];
        if (leader && race.reportingPercent > 0) {
          return leader.party === 'DEM' ? '#1d4ed8' : '#b91c1c';
        }
        return '#334155'; // Polls open / slate-700
      } else {
        // Seat not up for election in 2026: show quiet held color
        if (delegation?.senateHeldBy === 'DEM') {
          return '#172554'; // Deep muted navy
        } else if (delegation?.senateHeldBy === 'GOP') {
          return '#450a0a'; // Deep muted crimson
        } else if (delegation?.senateHeldBy === 'IND') {
          return '#3b0764'; // Deep muted purple
        }
        return '#1e293b'; // Slate-800
      }
    } else {
      // House Chamber View
      if (race && race.chamber === 'house') {
        const winner = race.candidates.find((c) => c.isWinner);
        if (winner) {
          return winner.party === 'DEM' ? '#2563eb' : '#dc2626';
        }
      }

      if (delegation) {
        if (delegation.houseDemSeats > delegation.houseGopSeats) {
          return '#1d4ed8'; // Majority Dem delegation
        } else if (delegation.houseGopSeats > delegation.houseDemSeats) {
          return '#b91c1c'; // Majority GOP delegation
        } else {
          return '#475569'; // Tied delegation
        }
      }
      return '#334155';
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, stateId: string, stateName: string) => {
    setHoveredStateId(stateId);
    const race = getRaceForState(stateId);
    const delegation = stateDelegations[stateId] || null;

    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      stateId,
      stateName,
      race,
      delegation,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip.visible) {
      setTooltip((prev) => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
      }));
    }
  };

  const handleMouseLeave = () => {
    setHoveredStateId(null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const handleClickState = (stateId: string) => {
    onSelectState(stateId);
    const race = getRaceForState(stateId);
    if (race) {
      onSelectRace(race);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-2 sm:p-4 select-none overflow-hidden">
      {/* Map Header Overlay Legend */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 text-xs mb-2 z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            {isPreElection ? (
              <span className="text-amber-400 flex items-center gap-1 font-mono text-[11px] bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded">
                <Building2 className="w-3.5 h-3.5" />
                EXISTING 119TH CONGRESS MAP (PRE-ELECTION BASELINE)
              </span>
            ) : (
              <span>
                {activeChamber === 'senate'
                  ? 'Class II Senate Races (2026 Live Returns)'
                  : 'House of Representatives (2026 Live Returns)'}
              </span>
            )}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 text-[11px]">
            {isPreElection
              ? 'Showing incumbents & party control before polls close at 7:00 PM EST'
              : 'Click state to inspect live votes & swing'}
          </span>
        </div>

        {/* Dynamic Legend */}
        {isPreElection ? (
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-300">
            {activeChamber === 'senate' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                  <span>2 Dem Senators</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
                  <span>2 GOP Senators</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-purple-600 inline-block" />
                  <span>Split (1D / 1R)</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Polls close 7 PM+ EST</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                  <span>Dem Delegation Majority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
                  <span>GOP Delegation Majority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-purple-600 inline-block" />
                  <span>Tied Delegation</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
              <span>Dem Won</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-900 inline-block" />
              <span>Dem Held</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
              <span>GOP Won</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-950 inline-block" />
              <span>GOP Held</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-700 inline-block" />
              <span>Counting</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border-2 border-yellow-400 bg-transparent inline-block" />
              <span className="text-yellow-400">Newly Called</span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Container */}
      <div className="relative w-full max-w-5xl aspect-[960/600] flex items-center justify-center">
        <svg
          viewBox="0 0 960 600"
          className="w-full h-full drop-shadow-2xl"
          onMouseMove={handleMouseMove}
        >
          {/* Defs for gradients & patterns */}
          <defs>
            <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render All 50 States (Sorted so hovered/selected state renders on top) */}
          {Object.entries(US_STATE_PATHS)
            .sort(([idA], [idB]) => {
              if (idA === hoveredStateId) return 1;
              if (idB === hoveredStateId) return -1;
              if (idA === selectedStateId) return 1;
              if (idB === selectedStateId) return -1;
              return 0;
            })
            .map(([id, state]) => {
              const isSelected = selectedStateId === id;
              const isHovered = hoveredStateId === id;
              const race = getRaceForState(id);
              const isRecentlyCalled =
                !isPreElection &&
                recentlyCalledRaceId &&
                race &&
                race.id === recentlyCalledRaceId;

              const fill = getStateFill(id);

              return (
                <g
                  key={id}
                  className="cursor-pointer"
                  style={{
                    transformOrigin: `${state.labelX || 480}px ${state.labelY || 300}px`,
                    transform: isHovered ? 'scale(1.035)' : 'scale(1)',
                    opacity: isHovered ? 0.88 : hoveredStateId ? 0.95 : 1,
                    filter: isHovered
                      ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.75)) brightness(1.2)'
                      : undefined,
                    transition:
                      'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease, filter 200ms ease',
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, id, state.name)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClickState(id)}
                >
                  <path
                    d={state.path}
                    fill={fill}
                    stroke={
                      isSelected
                        ? '#ffffff'
                        : isRecentlyCalled
                        ? '#facc15'
                        : isHovered
                        ? '#ffffff'
                        : '#0f172a'
                    }
                    strokeWidth={
                      isSelected ? 2.5 : isRecentlyCalled ? 3.5 : isHovered ? 2 : 1.2
                    }
                    className={`${isRecentlyCalled ? 'animate-race-call' : ''}`}
                  />

                  {/* State Postal Label */}
                  {state.labelX && state.labelY && (
                    <text
                      x={state.labelX}
                      y={state.labelY}
                      fill="#ffffff"
                      fontSize={isHovered ? '10.5' : '9.5'}
                      fontWeight={isHovered ? '800' : '700'}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="pointer-events-none select-none font-mono opacity-90 transition-all duration-200"
                    >
                      {id}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Small Eastern States Breakout Boxes */}
          <g className="small-states-breakout">
            <rect
              x="875"
              y="90"
              width="80"
              height="305"
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="1"
              rx="4"
              className="opacity-90"
            />
            <text
              x="915"
              y="105"
              fill="#94a3b8"
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
              className="font-mono uppercase tracking-wider"
            >
              East Coast
            </text>

            {SMALL_STATES_BREAKOUT.map((item) => {
              const race = getRaceForState(item.id);
              const isSelected = selectedStateId === item.id;
              const isHovered = hoveredStateId === item.id;
              const isRecentlyCalled =
                !isPreElection &&
                recentlyCalledRaceId &&
                race &&
                race.id === recentlyCalledRaceId;
              const fill = getStateFill(item.id);

              return (
                <g
                  key={item.id}
                  className="cursor-pointer"
                  style={{
                    transformOrigin: `${item.x + 17}px ${item.y + 1}px`,
                    transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                    opacity: isHovered ? 0.88 : hoveredStateId ? 0.95 : 1,
                    filter: isHovered
                      ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.6)) brightness(1.2)'
                      : undefined,
                    transition:
                      'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease, filter 200ms ease',
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, item.id, item.name)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClickState(item.id)}
                >
                  {/* Connecting indicator line to map */}
                  <line
                    x1={item.x - 5}
                    y1={item.y}
                    x2={item.connector[0]}
                    y2={item.connector[1]}
                    stroke="#475569"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />

                  {/* Interactive Button Rect */}
                  <rect
                    x={item.x - 10}
                    y={item.y - 10}
                    width="55"
                    height="22"
                    rx="3"
                    fill={fill}
                    stroke={
                      isSelected
                        ? '#ffffff'
                        : isRecentlyCalled
                        ? '#facc15'
                        : isHovered
                        ? '#ffffff'
                        : '#334155'
                    }
                    strokeWidth={isSelected ? 2 : isRecentlyCalled ? 2.5 : isHovered ? 1.8 : 1}
                    className={`${isRecentlyCalled ? 'animate-race-call' : ''}`}
                  />
                  <text
                    x={item.x + 17}
                    y={item.y + 4}
                    fill="#ffffff"
                    fontSize={isHovered ? '10.5' : '10'}
                    fontWeight="700"
                    textAnchor="middle"
                    className="font-mono pointer-events-none transition-all duration-200"
                  >
                    {item.id}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Competitive House Districts Quick Bar */}
        {activeChamber === 'house' && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 backdrop-blur-md flex items-center justify-between gap-3 overflow-x-auto text-xs z-10">
            <span className="font-semibold text-slate-300 text-[11px] whitespace-nowrap shrink-0">
              {isPreElection ? 'Key Battleground Seats Up Tonight:' : 'Live Key House Districts:'}
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {races
                .filter((r) => r.chamber === 'house' && r.isKeyBattleground)
                .map((hr) => {
                  const winner = hr.candidates.find((c) => c.isWinner);
                  const isSelected = selectedRace?.id === hr.id;
                  return (
                    <button
                      key={hr.id}
                      onClick={() => onSelectRace(hr)}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all whitespace-nowrap shrink-0 border ${
                        isSelected
                          ? 'border-yellow-400 bg-slate-800 text-white shadow'
                          : isPreElection
                          ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          : winner?.party === 'DEM'
                          ? 'bg-blue-950/70 border-blue-800 text-blue-200 hover:bg-blue-900/60'
                          : winner?.party === 'GOP'
                          ? 'bg-red-950/70 border-red-800 text-red-200 hover:bg-red-900/60'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{hr.id}</span>
                      {!isPreElection && hr.isFlip && (
                        <span className="ml-1 text-[9px] text-amber-400 font-bold">FLIP</span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Interactive Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed pointer-events-none z-50 bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl text-xs w-72 backdrop-blur-md transform -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 12}px`,
          }}
        >
          {isPreElection ? (
            /* PRE-ELECTION BASELINE TOOLTIP */
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="font-bold text-slate-100 text-sm">{tooltip.stateName}</div>
                <span className="text-[10px] text-amber-400 font-mono font-semibold">
                  119th Congress
                </span>
              </div>

              {activeChamber === 'senate' ? (
                <div className="space-y-1.5 text-xs text-slate-300">
                  {(() => {
                    const rep = EXISTING_SENATE_REPRESENTATION[tooltip.stateId];
                    if (!rep) return null;
                    return (
                      <>
                        <div className="text-[11px]">
                          <span className="text-slate-400">Existing Senators:</span>
                          <div className="font-medium text-slate-200">
                            {rep.seatUpIncumbent} ({rep.seatUpParty}) · {rep.otherSeatIncumbent} ({rep.otherSeatParty || rep.seatUpParty})
                          </div>
                        </div>

                        <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Seat Up Tonight:</span>
                          <span className="font-semibold text-slate-200">
                            {rep.seatUpIncumbent} ({rep.seatUpParty})
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Pre-Election Rating:</span>
                          <span className="font-mono text-amber-400 font-semibold">
                            {rep.rating2026}
                          </span>
                        </div>
                      </>
                    );
                  })()}

                  <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Polls close: {tooltip.delegation?.pollClosingTimeStr || '7:00 PM EST'}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="text-[11px] text-slate-400">
                    Existing House Delegation ({tooltip.delegation?.houseSeatsTotal} seats):
                  </div>
                  <div className="font-mono text-xs font-semibold flex items-center gap-2">
                    <span className="text-blue-400">{tooltip.delegation?.houseDemSeats} Dem</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-red-400">{tooltip.delegation?.houseGopSeats} GOP</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Polls close at {tooltip.delegation?.pollClosingTimeStr || '7:00 PM EST'}
                  </div>
                </div>
              )}

              <div className="text-[10px] text-blue-400 pt-1">
                Click state to view full pre-election candidate matchup ➔
              </div>
            </div>
          ) : tooltip.race ? (
            /* LIVE RETURNS TOOLTIP */
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="font-bold text-slate-100 text-sm">{tooltip.race.title}</div>
                <span className="font-mono text-[10px] text-slate-400">
                  {tooltip.race.reportingPercent}% in
                </span>
              </div>

              {/* Status banner */}
              {tooltip.race.candidates.some((c) => c.isWinner) ? (
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Called for{' '}
                    {tooltip.race.candidates.find((c) => c.isWinner)?.name} (
                    {tooltip.race.candidates.find((c) => c.isWinner)?.party})
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Counting in progress</span>
                </div>
              )}

              {/* Candidates in tooltip */}
              <div className="space-y-1 pt-1">
                {tooltip.race.candidates.map((c) => (
                  <div key={c.id} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300">
                      {c.name}{' '}
                      <strong
                        className={
                          c.party === 'DEM'
                            ? 'text-blue-400'
                            : c.party === 'GOP'
                            ? 'text-red-400'
                            : 'text-purple-400'
                        }
                      >
                        ({c.party})
                      </strong>
                    </span>
                    <span className="font-mono font-bold text-slate-100 tabular-nums">
                      {c.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Last time winner comparison snippet */}
              {tooltip.race.lastWinner && (
                <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Last Winner ({tooltip.race.lastWinner.year}):</span>
                  <span className="font-semibold text-slate-300">
                    {tooltip.race.lastWinner.winnerName} ({tooltip.race.lastWinner.winnerParty}) +
                    {tooltip.race.lastWinner.margin}%
                  </span>
                </div>
              )}

              <div className="text-[10px] text-blue-400 pt-1 font-sans">
                Click to inspect full analysis & counties ➔
              </div>
            </div>
          ) : tooltip.delegation ? (
            <div className="space-y-1.5">
              <div className="font-bold text-slate-100">{tooltip.stateName}</div>
              <div className="text-[11px] text-slate-400">
                Senate seat: {tooltip.delegation.senateHeldBy ? `Held by ${tooltip.delegation.senateHeldBy}` : 'Not up this cycle'}
              </div>
              <div className="text-[11px] text-slate-300">
                House Delegation: {tooltip.delegation.houseDemSeats} Dem · {tooltip.delegation.houseGopSeats} GOP
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Polls close: {tooltip.delegation.pollClosingTimeStr}
              </div>
            </div>
          ) : (
            <div className="text-slate-300 font-bold">{tooltip.stateName}</div>
          )}
        </div>
      )}
    </div>
  );
};
