export type Party = 'DEM' | 'GOP' | 'IND' | 'LIB' | 'GRN';

export type RaceStatus =
  | 'polls_open'
  | 'counting'
  | 'too_close'
  | 'dem_lead'
  | 'gop_lead'
  | 'dem_called'
  | 'gop_called'
  | 'ind_called';

export interface Candidate {
  id: string;
  name: string;
  party: Party;
  votes: number;
  percentage: number;
  isIncumbent?: boolean;
  isWinner?: boolean;
  photoUrl?: string;
}

export interface HistoricalResult {
  year: number; // 2020 or 2024
  winnerParty: Party;
  winnerName: string;
  demPercentage: number;
  gopPercentage: number;
  margin: number; // positive = margin of winner
  marginLeaderParty: Party;
  notes?: string;
}

export interface CountyReport {
  name: string;
  reporting: number; // percentage (0-100)
  totalVotes: number;
  demVotes: number;
  gopVotes: number;
  demPct: number;
  gopPct: number;
}

export interface Race {
  id: string;
  stateId: string;
  stateName: string;
  chamber: 'senate' | 'house';
  districtNumber?: number;
  title: string;
  pollClosingMinutes: number; // minutes from 7:00 PM EST (0 = 7:00 PM)
  pollClosingTimeStr: string; // e.g. "7:00 PM EST"
  callTimeMinutes: number; // minute from 7:00 PM when called in simulation (-1 if not yet called)
  status: RaceStatus;
  reportingPercent: number;
  totalVotes: number;
  expectedVotes: number;
  candidates: Candidate[];
  lastWinner: HistoricalResult;
  existingIncumbent?: string;
  existingParty?: Party;
  raceRating?: 'Toss-Up' | 'Lean DEM' | 'Lean GOP' | 'Likely DEM' | 'Likely GOP' | 'Solid DEM' | 'Solid GOP';
  isKeyBattleground: boolean;
  isFlipOpportunity: boolean;
  isFlip: boolean; // true if winner differs from lastWinner
  analysis: string;
  counties?: CountyReport[];
  manualCall?: Party | null; // For what-if scenarios
}

export interface StateDelegation {
  id: string;
  name: string;
  senateSeatUp: boolean;
  senateRaceId?: string;
  senateHeldBy?: Party; // for seats not up in 2026
  existingSenateSeats?: { seat1: { name: string; party: Party }; seat2: { name: string; party: Party } };
  existingHouseControl?: 'DEM' | 'GOP' | 'TIED';
  houseSeatsTotal: number;
  houseDemSeats: number;
  houseGopSeats: number;
  pollClosingTimeStr: string;
  pollClosingMinutes: number;
}

export interface BalanceOfPower {
  senate: {
    dem: number;
    gop: number;
    ind: number;
    uncalled: number;
    demNetGain: number;
    gopNetGain: number;
    majorityNeeded: number; // 50
    totalSeats: number; // 100
  };
  house: {
    dem: number;
    gop: number;
    uncalled: number;
    demNetGain: number;
    gopNetGain: number;
    majorityNeeded: number; // 218
    totalSeats: number; // 435
  };
}

export interface RaceCallAlert {
  id: string;
  timestamp: string;
  simulationMinute: number;
  raceId: string;
  stateId: string;
  stateName: string;
  chamber: 'senate' | 'house';
  title: string;
  winnerName: string;
  winnerParty: Party;
  winningPct: number;
  isFlip: boolean;
  flippedFromParty?: Party;
  shiftPct: number; // swing compared to last time
}
