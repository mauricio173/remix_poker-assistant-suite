/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Card, EquityResult } from "../types";

// Convert card value strings to numbers
export const cardValuesMap: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14
};

export const suitsMap: Record<string, string> = {
  "s": "♠", "h": "♥", "d": "♦", "c": "♣"
};

export interface MathCard {
  val: number; // 2-14
  suit: 's' | 'h' | 'd' | 'c';
}

// Full evaluation score for 5 to 7 cards. Greater number means better hand.
export function evaluateHandScore(cards: MathCard[]): number {
  if (cards.length < 5) return 0;

  // Group by suit to detect Flush
  const suitGroups: Record<string, MathCard[]> = { s: [], h: [], d: [], c: [] };
  for (const c of cards) {
    if (suitGroups[c.suit]) {
      suitGroups[c.suit].push(c);
    }
  }

  let flushCards: MathCard[] | null = null;
  for (const s in suitGroups) {
    if (suitGroups[s].length >= 5) {
      flushCards = suitGroups[s].sort((a,b) => b.val - a.val);
      break;
    }
  }

  // Detect Straight
  // Get unique values sorted descending
  const uniqueVals = Array.from(new Set(cards.map(c => c.val))).sort((a,b) => b - a);
  let straightHigh = 0;
  
  // Check standard straights
  for (let i = 0; i <= uniqueVals.length - 5; i++) {
    if (uniqueVals[i] - uniqueVals[i + 4] === 4) {
      straightHigh = uniqueVals[i];
      break;
    }
  }
  // Check Wheel straight (5, 4, 3, 2, A)
  if (straightHigh === 0 && uniqueVals.includes(14) && uniqueVals.includes(2) && uniqueVals.includes(3) && uniqueVals.includes(4) && uniqueVals.includes(5)) {
    straightHigh = 5;
  }

  // Detect Straight Flush
  if (flushCards) {
    const fVals = Array.from(new Set(flushCards.map(c => c.val))).sort((a,b) => b - a);
    let sfHigh = 0;
    for (let i = 0; i <= fVals.length - 5; i++) {
      if (fVals[i] - fVals[i + 4] === 4) {
        sfHigh = fVals[i];
        break;
      }
    }
    if (sfHigh === 0 && fVals.includes(14) && fVals.includes(2) && fVals.includes(3) && fVals.includes(4) && fVals.includes(5)) {
      sfHigh = 5;
    }

    if (sfHigh > 0) {
      // 8,000,000 base + straight flush high
      return 8000000 + sfHigh;
    }
  }

  // Group by frequency of ranks
  const counts: Record<number, number> = {};
  for (const c of cards) {
    counts[c.val] = (counts[c.val] || 0) + 1;
  }

  const items = Object.entries(counts).map(([val, count]) => ({
    val: parseInt(val),
    count
  })).sort((a, b) => b.count - a.count || b.val - a.val);

  // Four of a kind
  if (items[0].count === 4) {
    const kicker = cards.filter(c => c.val !== items[0].val).sort((a,b) => b.val - a.val)[0]?.val || 0;
    return 7000000 + items[0].val * 15 + kicker;
  }

  // Full House
  if (items[0].count === 3 && items[1] && items[1].count >= 2) {
    return 6000000 + items[0].val * 15 + items[1].val;
  }

  // Flush
  if (flushCards) {
    // Top 5 cards of the flush
    const score = flushCards.slice(0, 5).reduce((acc, c, idx) => {
      return acc + c.val * Math.pow(15, 4 - idx);
    }, 0);
    return 5000000 + score;
  }

  // Straight
  if (straightHigh > 0) {
    return 4000000 + straightHigh;
  }

  // Three of a kind
  if (items[0].count === 3) {
    const kickers = cards.filter(c => c.val !== items[0].val).sort((a,b) => b.val - a.val);
    const k1 = kickers[0]?.val || 0;
    const k2 = kickers[1]?.val || 0;
    return 3000000 + items[0].val * 225 + k1 * 15 + k2;
  }

  // Two Pair
  if (items[0].count === 2 && items[1] && items[1].count === 2) {
    const kicker = cards.filter(c => c.val !== items[0].val && c.val !== items[1].val).sort((a,b) => b.val - a.val)[0]?.val || 0;
    return 2000000 + items[0].val * 225 + items[1].val * 15 + kicker;
  }

  // One Pair
  if (items[0].count === 2) {
    const kickers = cards.filter(c => c.val !== items[0].val).sort((a,b) => b.val - a.val);
    const k1 = kickers[0]?.val || 0;
    const k2 = kickers[1]?.val || 0;
    const k3 = kickers[2]?.val || 0;
    return 1000000 + items[0].val * 3375 + k1 * 225 + k2 * 15 + k3;
  }

  // High Card
  const topCards = uniqueVals.slice(0, 5);
  const score = topCards.reduce((acc, val, idx) => {
    return acc + val * Math.pow(15, 4 - idx);
  }, 0);
  return score;
}

// Parses string representation like "As" (Ace of Spades), "Kh" (King of Hearts) to MathCard
export function parseCardString(cardStr: string): MathCard | null {
  if (!cardStr || cardStr.length < 2) return null;
  const valChar = cardStr[0].toUpperCase();
  const suitChar = cardStr[1].toLowerCase() as 's' | 'h' | 'd' | 'c';
  
  const val = cardValuesMap[valChar];
  if (!val || !['s', 'h', 'd', 'c'].includes(suitChar)) return null;

  return { val, suit: suitChar };
}

// Helper to create full deck of 52 cards
export function createDeck(): MathCard[] {
  const suits: ('s' | 'h' | 'd' | 'c')[] = ['s', 'h', 'd', 'c'];
  const deck: MathCard[] = [];
  for (const s of suits) {
    for (let v = 2; v <= 14; v++) {
      deck.push({ val: v, suit: s });
    }
  }
  return deck;
}

// Runs Texas Hold'em Equity Calculator with Monte Carlo simulation
export function calculateEquity(
  p1HandStr: string[],
  p2HandStr: string[],
  boardStr: string[],
  iterations: number = 3000
): EquityResult {
  const p1Parsed = p1HandStr.map(parseCardString).filter(c => c !== null) as MathCard[];
  const p2Parsed = p2HandStr.map(parseCardString).filter(c => c !== null) as MathCard[];
  const boardParsed = boardStr.map(parseCardString).filter(c => c !== null) as MathCard[];

  // If players are missing cards, return empty
  if (p1Parsed.length < 2 || p2Parsed.length < 2) {
    return { player1Win: 0, player2Win: 0, tie: 0, iterations: 0, simulated: false };
  }

  // Lock used cards to prevent duplicates in the remaining deck
  const usedCardsSet = new Set<string>();
  const addUsed = (c: MathCard) => usedCardsSet.add(`${c.val}-${c.suit}`);
  
  p1Parsed.forEach(addUsed);
  p2Parsed.forEach(addUsed);
  boardParsed.forEach(addUsed);

  const fullDeck = createDeck();
  const availableDeck = fullDeck.filter(c => !usedCardsSet.has(`${c.val}-${c.suit}`));

  let p1Wins = 0;
  let p2Wins = 0;
  let ties = 0;

  // Let's run simulation loop
  for (let i = 0; i < iterations; i++) {
    // Shuffle deck copies efficiently (Fisher-Yates only for needed positions)
    const deckCopy = [...availableDeck];
    const neededBoardCardsNum = 5 - boardParsed.length;
    
    // Choose cards randomly
    const runBoard = [...boardParsed];
    for (let c = 0; c < neededBoardCardsNum; c++) {
      const randIdx = Math.floor(Math.random() * deckCopy.length);
      const picked = deckCopy.splice(randIdx, 1)[0];
      runBoard.push(picked);
    }

    const p1Score = evaluateHandScore([...p1Parsed, ...runBoard]);
    const p2Score = evaluateHandScore([...p2Parsed, ...runBoard]);

    if (p1Score > p2Score) {
      p1Wins++;
    } else if (p2Score > p1Score) {
      p2Wins++;
    } else {
      ties++;
    }
  }

  return {
    player1Win: (p1Wins / iterations) * 100,
    player2Win: (p2Wins / iterations) * 100,
    tie: (ties / iterations) * 100,
    iterations,
    simulated: true
  };
}

// Generate static preflop ranges frequency with mock value for GTO visualizer helper
export function getGTOPreflopAction(handCode: string, actionType: string): { fold: number; checkCall: number; raise: number } {
  // handCode E.g. "AA", "AKs", "72o"
  const isPair = handCode.length === 2;
  const rank1 = cardValuesMap[handCode[0]];
  const rank2 = cardValuesMap[handCode[1]];
  const isSuited = handCode.endsWith("s");

  // Premium Hands
  if (handCode === "AA" || handCode === "KK" || handCode === "QQ" || handCode === "AKs") {
    return { fold: 0, checkCall: 10, raise: 90 };
  }
  if (handCode === "JJ" || handCode === "TT" || handCode === "AQs" || handCode === "AKo") {
    return { fold: 0, checkCall: 30, raise: 70 };
  }
  if (handCode === "99" || handCode === "88" || handCode === "AJs" || handCode === "AQo" || handCode === "KQs") {
    return { fold: 5, checkCall: 45, raise: 55 };
  }

  // Medium playable Hands
  if (rank1 >= 10 && rank2 >= 10) {
    return { fold: 15, checkCall: 50, raise: 35 };
  }
  if (isSuited && Math.abs(rank1 - rank2) <= 2 && rank1 >= 6) {
    return { fold: 30, checkCall: 50, raise: 20 };
  }

  // Low Trash / Marginals
  if (rank1 < 7 && rank2 < 7 && !isPair) {
    return { fold: 95, checkCall: 5, raise: 0 };
  }

  return { fold: 70, checkCall: 25, raise: 5 };
}
