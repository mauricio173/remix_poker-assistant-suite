/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Card {
  value: string; // '2'-'A'
  suit: 's' | 'h' | 'd' | 'c'; // spades, hearts, diamonds, clubs
}

export interface EquityResult {
  player1Win: number;
  player2Win: number;
  tie: number;
  iterations: number;
  simulated: boolean;
}

export interface PokerSession {
  id: string;
  date: string;
  durationMinutes: number;
  buyIn: number;
  cashOut: number;
  profit: number;
  handsPlayed: number;
  stakes: string; // E.g. "NL10", "NL50", "NL200"
  notes?: string;
}

export interface OpponentStats {
  id: string;
  seat: number;
  name: string;
  hands: number;
  vpip: number; // Voluntary Put in Pot %
  pfr: number;  // Preflop Raise %
  threeBet: number; // 3-Bet %
  af: number; // Aggression Factor (Ratio of bet+raise to call)
  notes: string;
  recentActions: string[];
}

export interface SimulatedTable {
  id: number;
  tableName: string;
  heroCards: string[];
  boardCards: string[];
  potSize: number;
  currentBet: number;
  actionRequired: boolean;
  status: 'Aguardando' | 'Ação Hero!' | 'Folded' | 'Won' | 'Time Bank!';
  timeRemaining: number; // in seconds
  hudTargetId: string; // Enemy in hand
  dealCount: number;
  historyLog: string[];
}

export type GTOAction = 'FOLD' | 'CALL' | 'RAISE_MIN' | 'RAISE_3X' | 'CHECK';

export interface GTOSolvingDetails {
  hand: string;
  actionFreqs: {
    fold: number;
    callCheck: number;
    raise: number;
  };
  ev: {
    fold: number;
    callCheck: number;
    raise: number;
  };
}
