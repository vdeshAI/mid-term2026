/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Race,
  Party,
  BalanceOfPower,
  RaceCallAlert,
  StateDelegation,
} from './types/election';
import {
  INITIAL_RACES,
  STATE_DELEGATIONS,
  SENATE_HELD_BASELINE,
  HOUSE_BASELINE,
} from './data/electionData';
import { HeaderTopBar } from './components/HeaderTopBar';
import { BalanceOfPowerBar } from './components/BalanceOfPowerBar';
import { ElectionMap } from './components/ElectionMap';
import { RaceInspectorSidebar } from './components/RaceInspectorSidebar';
import { TimelineControls } from './components/TimelineControls';
import { BreakingNewsTicker } from './components/BreakingNewsTicker';
import { LiveCallsStream } from './components/LiveCallsStream';
import { playRaceCallChime } from './utils/audioAlert';

export default function App() {
  // --- Simulation State ---
  // Default to 7:00 PM EST (minute 0) in Pre-Election existing map mode
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [isPreElection, setIsPreElection] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(5);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeChamber, setActiveChamber] = useState<'senate' | 'house'>('senate');

  // Selected state & race for sidebar inspection
  const [selectedStateId, setSelectedStateId] = useState<string | null>('GA');
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>('GA-SEN');

  // Tracking newly called races for automatic highlight & fanfare
  const [recentlyCalledRaceId, setRecentlyCalledRaceId] = useState<string | null>(null);
  const [latestAlert, setLatestAlert] = useState<RaceCallAlert | null>(null);
  const [alerts, setAlerts] = useState<RaceCallAlert[]>([]);

  // Manual what-if overrides
  const [manualOverrides, setManualOverrides] = useState<Record<string, Party | null>>({});

  // Keep track of which races were already alerted to avoid duplicate chimes
  const alertedRaceIdsRef = useRef<Set<string>>(new Set());

  // Compute live state of all races based on simulation clock & manual overrides
  const processedRaces: Race[] = useMemo(() => {
    return INITIAL_RACES.map((baseRace) => {
      const override = manualOverrides[baseRace.id];

      // If manual override is set
      if (override !== undefined && override !== null) {
        const winningCand = baseRace.candidates.find((c) => c.party === override);
        const candidates = baseRace.candidates.map((c) => ({
          ...c,
          isWinner: c.party === override,
        }));
        const isFlip = override !== baseRace.lastWinner.winnerParty;

        return {
          ...baseRace,
          status: override === 'DEM' ? 'dem_called' : 'gop_called',
          reportingPercent: 100,
          candidates,
          isFlip,
          manualCall: override,
        };
      }

      // Simulation clock calculations
      const isPastClosing = currentMinute >= baseRace.pollClosingMinutes;
      const isCalled = baseRace.callTimeMinutes > 0 && currentMinute >= baseRace.callTimeMinutes;

      if (!isPastClosing) {
        // Polls not yet closed
        return {
          ...baseRace,
          status: 'polls_open',
          reportingPercent: 0,
          totalVotes: 0,
          candidates: baseRace.candidates.map((c) => ({
            ...c,
            votes: 0,
            isWinner: false,
          })),
        };
      }

      if (isCalled) {
        // Officially called
        const winner = baseRace.candidates.find((c) => c.isWinner);
        const status =
          winner?.party === 'DEM'
            ? 'dem_called'
            : winner?.party === 'GOP'
            ? 'gop_called'
            : 'too_close';

        return {
          ...baseRace,
          status,
          candidates: baseRace.candidates,
        };
      }

      // Between poll closing and call time: counting in progress
      const progressFraction = Math.min(
        1,
        (currentMinute - baseRace.pollClosingMinutes) /
          Math.max(1, baseRace.callTimeMinutes - baseRace.pollClosingMinutes)
      );

      const dynamicReporting = Math.max(12, Math.round(baseRace.reportingPercent * progressFraction));
      const dynamicTotal = Math.round(baseRace.totalVotes * progressFraction);

      const dynamicCandidates = baseRace.candidates.map((c) => ({
        ...c,
        votes: Math.round(c.votes * progressFraction),
        isWinner: false, // Not yet projected
      }));

      const demCand = dynamicCandidates.find((c) => c.party === 'DEM');
      const gopCand = dynamicCandidates.find((c) => c.party === 'GOP');
      const demLeading = (demCand?.votes || 0) > (gopCand?.votes || 0);

      return {
        ...baseRace,
        status: demLeading ? 'dem_lead' : 'gop_lead',
        reportingPercent: dynamicReporting,
        totalVotes: dynamicTotal,
        candidates: dynamicCandidates,
      };
    });
  }, [currentMinute, manualOverrides]);

  // Compute Balance of Power
  const balanceOfPower: BalanceOfPower = useMemo(() => {
    // SENATE: 100 Seats
    let senateDem = SENATE_HELD_BASELINE.demHeld;
    let senateGop = SENATE_HELD_BASELINE.gopHeld;
    let senateInd = 1; // e.g. Angus King / Bernie Sanders caucusing with Dem
    let senateUncalled = 0;
    let senateDemGain = 0;
    let senateGopGain = 0;

    const senateRaces = processedRaces.filter((r) => r.chamber === 'senate');

    senateRaces.forEach((r) => {
      const winner = r.candidates.find((c) => c.isWinner);
      if (winner) {
        if (winner.party === 'DEM') {
          senateDem += 1;
          if (r.lastWinner.winnerParty === 'GOP') senateDemGain += 1;
        } else if (winner.party === 'GOP') {
          senateGop += 1;
          if (r.lastWinner.winnerParty === 'DEM') senateGopGain += 1;
        } else {
          senateInd += 1;
        }
      } else {
        senateUncalled += 1;
      }
    });

    // HOUSE: 435 Seats
    // Baseline state delegation totals + dynamic battleground seats
    let houseDem = 0;
    let houseGop = 0;
    let houseUncalled = 0;
    let houseDemGain = 0;
    let houseGopGain = 0;

    // Sum baseline house delegation
    Object.values(STATE_DELEGATIONS).forEach((del) => {
      houseDem += del.houseDemSeats;
      houseGop += del.houseGopSeats;
    });

    // Adjust for battleground house races
    const houseRaces = processedRaces.filter((r) => r.chamber === 'house');
    houseRaces.forEach((r) => {
      const winner = r.candidates.find((c) => c.isWinner);
      if (winner) {
        if (r.isFlip) {
          if (winner.party === 'DEM') {
            houseDemGain += 1;
          } else if (winner.party === 'GOP') {
            houseGopGain += 1;
          }
        }
      } else {
        houseUncalled += 1;
      }
    });

    // Normalize so total is 435
    const totalAccounted = houseDem + houseGop + houseUncalled;
    if (totalAccounted !== 435) {
      houseUncalled = Math.max(0, 435 - houseDem - houseGop);
    }

    return {
      senate: {
        dem: senateDem + senateInd,
        gop: senateGop,
        ind: senateInd,
        uncalled: senateUncalled,
        demNetGain: senateDemGain - senateGopGain,
        gopNetGain: senateGopGain - senateDemGain,
        majorityNeeded: 50,
        totalSeats: 100,
      },
      house: {
        dem: houseDem,
        gop: houseGop,
        uncalled: houseUncalled,
        demNetGain: houseDemGain - houseGopGain,
        gopNetGain: houseGopGain - houseDemGain,
        majorityNeeded: 218,
        totalSeats: 435,
      },
    };
  }, [processedRaces]);

  // Selected Race reference
  const selectedRace = useMemo(() => {
    return processedRaces.find((r) => r.id === selectedRaceId) || null;
  }, [processedRaces, selectedRaceId]);

  const selectedStateName = useMemo(() => {
    if (!selectedStateId) return '';
    return STATE_DELEGATIONS[selectedStateId]?.name || selectedStateId;
  }, [selectedStateId]);

  // Simulation Timer Interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentMinute((prev) => {
        if (prev >= 360) {
          setIsPlaying(false);
          return 360;
        }
        return prev + 1;
      });
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  // Monitor race calls as simulation time advances
  // Automatically highlights the region and displays the race call in sidebar tooltip!
  useEffect(() => {
    processedRaces.forEach((race) => {
      const winner = race.candidates.find((c) => c.isWinner);
      if (winner && !alertedRaceIdsRef.current.has(race.id)) {
        alertedRaceIdsRef.current.add(race.id);

        // Format time string
        const startHour = 19;
        const totalMin = startHour * 60 + race.callTimeMinutes;
        let hour = Math.floor(totalMin / 60) % 24;
        const min = totalMin % 60;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        const timeStr = `${hour}:${min < 10 ? '0' : ''}${min} ${ampm} EST`;

        // Calculate shift vs last time
        const currentWinnerPct = winner.percentage;
        const previousWinnerPct =
          race.lastWinner.winnerParty === winner.party
            ? race.lastWinner.marginLeaderParty === winner.party
              ? (race.lastWinner.demPercentage || 50)
              : (race.lastWinner.gopPercentage || 50)
            : 50 - race.lastWinner.margin / 2;
        const shiftPct = currentWinnerPct - previousWinnerPct;

        const newAlert: RaceCallAlert = {
          id: `${race.id}-${Date.now()}`,
          timestamp: timeStr,
          simulationMinute: currentMinute,
          raceId: race.id,
          stateId: race.stateId,
          stateName: race.stateName,
          chamber: race.chamber,
          title: race.title,
          winnerName: winner.name,
          winnerParty: winner.party,
          winningPct: winner.percentage,
          isFlip: race.isFlip,
          flippedFromParty: race.isFlip ? race.lastWinner.winnerParty : undefined,
          shiftPct,
        };

        setLatestAlert(newAlert);
        setAlerts((prev) => [newAlert, ...prev]);

        // AUTOMATIC HIGHLIGHT REQUIREMENT:
        // Automatically highlight corresponding region and open in sidebar
        setRecentlyCalledRaceId(race.id);
        setSelectedStateId(race.stateId);
        setSelectedRaceId(race.id);
        if (race.chamber !== activeChamber) {
          setActiveChamber(race.chamber);
        }

        // Play audio chime
        if (soundEnabled) {
          playRaceCallChime(race.isFlip);
        }
      }
    });
  }, [processedRaces, currentMinute, soundEnabled, activeChamber]);

  // Handle clicking on map state
  const handleSelectState = (stateId: string) => {
    setSelectedStateId(stateId);
    // Find matching race
    const targetRace =
      processedRaces.find((r) => r.stateId === stateId && r.chamber === activeChamber) ||
      processedRaces.find((r) => r.stateId === stateId);
    if (targetRace) {
      setSelectedRaceId(targetRace.id);
    }
  };

  // Handle selecting a race directly
  const handleSelectRace = (race: Race) => {
    setSelectedRaceId(race.id);
    setSelectedStateId(race.stateId);
    if (race.chamber !== activeChamber) {
      setActiveChamber(race.chamber);
    }
  };

  // Handle start of live simulation from pre-election mode
  const handleStartSimulation = () => {
    setIsPreElection(false);
    setIsPlaying(true);
    if (currentMinute === 0) {
      setCurrentMinute(5); // Advance into initial poll closing phase
    }
  };

  // Handle jump to next race call
  const handleJumpNextCall = () => {
    if (isPreElection) {
      setIsPreElection(false);
    }
    const uncalledRaces = INITIAL_RACES.filter(
      (r) => r.callTimeMinutes > currentMinute
    ).sort((a, b) => a.callTimeMinutes - b.callTimeMinutes);

    if (uncalledRaces.length > 0) {
      const nextTime = uncalledRaces[0].callTimeMinutes;
      setCurrentMinute(nextTime);
    } else {
      setCurrentMinute(360); // End of night
    }
  };

  // Handle simulation reset
  const handleReset = () => {
    setCurrentMinute(0);
    setIsPlaying(false);
    setIsPreElection(true);
    alertedRaceIdsRef.current.clear();
    setAlerts([]);
    setLatestAlert(null);
    setRecentlyCalledRaceId(null);
    setManualOverrides({});
  };

  // Handle manual what-if override
  const handleManualCall = (raceId: string, party: Party | null) => {
    if (isPreElection) {
      setIsPreElection(false);
    }
    setManualOverrides((prev) => ({
      ...prev,
      [raceId]: party,
    }));
  };

  // Export Results summary download
  const handleExportSummary = () => {
    const summaryData = {
      election: 'US Midterm Election 2026',
      mode: isPreElection ? 'Existing Congress Baseline (Pre-7 PM)' : 'Live Election Returns',
      simulationTimeMinutes: currentMinute,
      balanceOfPower,
      calledRaces: processedRaces
        .filter((r) => r.candidates.some((c) => c.isWinner))
        .map((r) => {
          const winner = r.candidates.find((c) => c.isWinner);
          return {
            race: r.title,
            chamber: r.chamber,
            state: r.stateName,
            winner: winner?.name,
            party: winner?.party,
            percentage: winner?.percentage,
            lastWinner: `${r.lastWinner.winnerName} (${r.lastWinner.winnerParty})`,
            isFlip: r.isFlip,
          };
        }),
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `us-midterm-election-2026-results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCallsCount = processedRaces.filter((r) =>
    r.candidates.some((c) => c.isWinner)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP NAVIGATION BAR */}
      <HeaderTopBar
        onResetNight={handleReset}
        onExportSummary={handleExportSummary}
        onFilterFlips={() => {
          if (isPreElection) setIsPreElection(false);
          const flip = processedRaces.find((r) => r.isFlip);
          if (flip) handleSelectRace(flip);
        }}
        onFilterSenate={() => setActiveChamber('senate')}
        onFilterHouse={() => setActiveChamber('house')}
      />

      {/* 2. BALANCE OF POWER TRACKER (SENATE & HOUSE BARS) */}
      <BalanceOfPowerBar
        balance={balanceOfPower}
        activeChamber={activeChamber}
        setActiveChamber={setActiveChamber}
        isPreElection={isPreElection}
        onToggleViewMode={(isPre) => {
          setIsPreElection(isPre);
          if (isPre) {
            setIsPlaying(false);
          }
        }}
      />

      {/* 3. BREAKING RACE CALL TICKER */}
      <BreakingNewsTicker
        latestAlert={latestAlert}
        onSelectRaceAlert={(raceId) => {
          const r = processedRaces.find((item) => item.id === raceId);
          if (r) handleSelectRace(r);
        }}
        onDismissAlert={() => setLatestAlert(null)}
        isPreElection={isPreElection}
        onStartSimulation={handleStartSimulation}
      />

      {/* 4. MAIN WORKSPACE VIEWPORT (MAP + INSPECTOR SIDEBAR) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Interactive US Map with State Indicators */}
        <main className="flex-1 flex flex-col min-h-[500px] overflow-hidden bg-slate-950">
          <ElectionMap
            races={processedRaces}
            stateDelegations={STATE_DELEGATIONS}
            activeChamber={activeChamber}
            selectedRace={selectedRace}
            onSelectRace={handleSelectRace}
            recentlyCalledRaceId={recentlyCalledRaceId}
            selectedStateId={selectedStateId}
            onSelectState={handleSelectState}
            isPreElection={isPreElection}
          />
        </main>

        {/* Sidebar Tooltip / Race Inspector Panel */}
        <RaceInspectorSidebar
          selectedRace={selectedRace}
          selectedStateName={selectedStateName}
          onManualCall={handleManualCall}
          allRaces={processedRaces}
          onSelectRace={handleSelectRace}
          isPreElection={isPreElection}
          onStartSimulation={handleStartSimulation}
        />
      </div>

      {/* 5. LIVE CALLS STREAM FEED */}
      {!isPreElection && (
        <LiveCallsStream
          alerts={alerts}
          allRaces={processedRaces}
          onSelectRace={handleSelectRace}
          selectedRaceId={selectedRaceId || undefined}
        />
      )}

      {/* 6. TIMELINE SIMULATION CONTROLS */}
      <TimelineControls
        currentMinute={currentMinute}
        isPlaying={isPlaying}
        speed={speed}
        soundEnabled={soundEnabled}
        onTogglePlay={() => {
          if (!isPlaying && isPreElection) {
            setIsPreElection(false);
            if (currentMinute === 0) setCurrentMinute(5);
          }
          setIsPlaying(!isPlaying);
        }}
        onSetMinute={(minute) => {
          setCurrentMinute(minute);
          if (minute > 0 && isPreElection) {
            setIsPreElection(false);
          } else if (minute === 0 && !isPlaying) {
            setIsPreElection(true);
          }
        }}
        onSetSpeed={setSpeed}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onReset={handleReset}
        onJumpNextCall={handleJumpNextCall}
        totalCallsMade={totalCallsCount}
        totalRacesCount={INITIAL_RACES.length}
        isPreElection={isPreElection}
      />
    </div>
  );
}
