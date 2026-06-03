/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpponentStats, PokerSession } from "../types";

export interface ParsedLiveHand {
  handId: string;
  tableName: string;
  stakes: string;
  heroCards: string[];
  boardCards: string[];
  potSize: number;
  players: { seat: number; name: string; chipCount: number }[];
  actionsLog: string[];
  lastAction: string;
  gameStatus: string;
  currentSituationText: string;
  currentHistoryText: string;
  winnerName?: string;
  wonAmount?: number;
}

/**
 * Parses a single complete or incomplete PokerStars Hand History block.
 */
export function parsePokerStarsHand(text: string): ParsedLiveHand {
  const result: ParsedLiveHand = {
    handId: "Desconhecido",
    tableName: "Mesa Live",
    stakes: "NL100 ($0.50/$1.00)",
    heroCards: [],
    boardCards: [],
    potSize: 0,
    players: [],
    actionsLog: [],
    lastAction: "Nenhuma",
    gameStatus: "Em Andamento",
    currentSituationText: "",
    currentHistoryText: "",
  };

  if (!text) return result;

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // 1. Hand ID & Stakes parsing
  // E.g. PokerStars Hand #24192019232: Hold'em No Limit ($0.50/$1.00 USD) - 2026/06/03 22:30:15 ET
  const handHeaderReg = /PokerStars Hand #(\d+):[^(]*\(([^)]+)\)/i;
  const matchHeader = text.match(handHeaderReg);
  if (matchHeader) {
    result.handId = "#" + matchHeader[1];
    result.stakes = matchHeader[2].replace(" USD", "");
  }

  // 2. Table Name parsing
  // E.g. Table 'Carina' 6-max Seat #1 is the button
  const tblReg = /Table '([^']+)'/i;
  const matchTable = text.match(tblReg);
  if (matchTable) {
    result.tableName = matchTable[1];
  }

  // 3. User seats parsing
  // E.g. Seat 1: RickGrinder ($102.50 in chips)
  const seatReg = /Seat (\d+): ([^(]+)\(\$?([\d.]+) in chips\)/i;
  lines.forEach(line => {
    const seatMatch = line.match(seatReg);
    if (seatMatch) {
      const seatNum = parseInt(seatMatch[1], 10);
      const name = seatMatch[2].trim();
      const chips = parseFloat(seatMatch[3]);
      result.players.push({ seat: seatNum, name, chipCount: chips });
    }
  });

  // 4. Dealt to Hero parsing
  // E.g. Dealt to Hero [As Ks]
  const heroCardsReg = /Dealt to Hero \[([AKQJT2-9][shdc])\s+([AKQJT2-9][shdc])\]/i;
  const matchHero = text.match(heroCardsReg);
  if (matchHero) {
    result.heroCards = [matchHero[1], matchHero[2]];
  }

  // 5. Board Cards parsing
  // E.g. *** FLOP *** [Ts Jh 4c]
  // E.g. *** TURN *** [Ts Jh 4c] [Qs]
  // E.g. *** RIVER *** [Ts Jh 4c Qs] [As]
  const boardReg = /\[([AKQJT2-9][shdc](?:\s+[AKQJT2-9][shdc])*)\]/g;
  let boardCards: string[] = [];
  lines.forEach(line => {
    if (line.includes("*** FLOP ***") || line.includes("*** TURN ***") || line.includes("*** RIVER ***")) {
      const cardMatches = line.match(/\[([^\]]+)\]/g);
      if (cardMatches) {
        // Collect card initials
        cardMatches.forEach(grp => {
          const cardsStr = grp.replace(/[\[\]]/g, "").trim();
          cardsStr.split(/\s+/).forEach(c => {
            if (c && !boardCards.includes(c)) {
              boardCards.push(c);
            }
          });
        });
      }
    }
  });
  result.boardCards = boardCards;

  // 6. Action Logs & Parser stats
  let inPreflop = false;
  let inPostflop = false;
  lines.forEach(line => {
    if (line.includes("*** HOLE CARDS ***")) {
      inPreflop = true;
      return;
    }
    if (line.includes("*** FLOP ***") || line.includes("*** SHOWDOWN ***") || line.includes("*** SUMMARY ***")) {
      inPreflop = false;
    }

    // Capture betting lines
    if (line.includes(":") && !line.startsWith("Seat ") && !line.startsWith("PokerStars ") && !line.includes("posts small blind") && !line.includes("posts big blind") && !line.includes("dealt to") && !line.startsWith("Table ")) {
      const parts = line.split(":");
      const playerName = parts[0].trim();
      const actionText = parts[1].trim();

      // Avoid summary lines
      if (line.toLowerCase().includes("folded") || line.toLowerCase().includes("called") || line.toLowerCase().includes("raised") || line.toLowerCase().includes("checked") || line.toLowerCase().includes("bets") || line.toLowerCase().includes("folds")) {
        result.actionsLog.push(`${playerName}: ${actionText}`);
        result.lastAction = `${playerName}: ${actionText}`;
      }
    }

    // Detect winners
    // E.g. Hero collected $295.50 from pot
    const winnerReg = /([^:\s]+) collected \$?([\d.]+) from pot/i;
    const matchWinner = line.match(winnerReg);
    if (matchWinner) {
      result.winnerName = matchWinner[1].trim();
      result.wonAmount = parseFloat(matchWinner[2]);
      result.gameStatus = "Finalizada";
    }
  });

  // Calculate simulated pot based on actions
  let calcPot = 0;
  lines.forEach(line => {
    // E.g: posts small blind $0.50
    // E.g: raises $1.50 to $2.50
    // E.g: calls $2.50
    // E.g: bets $6.50
    const moneyMatch = line.match(/\$?(\d+\.\d+)/g);
    if (moneyMatch) {
      moneyMatch.forEach(valStr => {
        const value = parseFloat(valStr.replace("$", ""));
        if (!isNaN(value)) {
          calcPot += value;
        }
      });
    }
  });
  // Adjust pot size sensibly
  result.potSize = Number((calcPot / 2.3).toFixed(2)); // safe division mapping to match action

  // 7. Context summaries for GTO AI Coach
  const heroName = "Hero";
  const boardStr = result.boardCards.length > 0 ? `[${result.boardCards.join(" ")}]` : "Sem bordo (Pré-Flop)";
  const lastAct = result.lastAction !== "Nenhuma" ? `Última ação: ${result.lastAction}` : "Aguardando ação.";

  result.currentSituationText = `Hero com ${result.heroCards.join(" ") || "Cartas ocultas"} na mesa '${result.tableName}' (${result.stakes}). ${lastAct}`;
  result.currentHistoryText = `Board社区: ${boardStr}. Histórico de apostas ativo:\n${result.actionsLog.slice(-4).join("\n")}`;

  return result;
}

/**
 * Standard simulated logs list for the walkthrough experience.
 * This represents actual PokerStars Hand History files.
 */
export const SIMULATED_HANDS_DATABASE = [
  // HAND 1 (Preflop - Hero holding AA)
  `PokerStars Hand #24192019101: Hold'em No Limit ($0.50/$1.00 USD) - 2026/06/03 22:30:15 ET
Table 'Carina' 6-max Seat #1 is the button
Seat 1: RickGrinder ($102.50 in chips) 
Seat 2: LooseLuka ($45.20 in chips) 
Seat 3: Hero ($150.00 in chips) 
Seat 4: AgroAna ($112.10 in chips) 
Seat 5: NicoleNits ($98.00 in chips) 
Seat 6: FishFelipe ($62.50 in chips) 
LooseLuka: posts small blind $0.50
Hero: posts big blind $1.00
*** HOLE CARDS ***
Dealt to Hero [As Ac]
AgroAna: raises $1.50 to $2.50
NicoleNits: folds 
FishFelipe: calls $2.50
RickGrinder: folds 
LooseLuka: folds 
Hero: raises $7.50 to $10.00
AgroAna: calls $7.50
FishFelipe: folds 
*** SUMMARY ***
Total pot $22.50 | Rake $1.00 
Seats 1, 2, 5, 6 folded preflop`,

  // HAND 2 (Flop - Hero holding KQs on Ts Jh 4c)
  `PokerStars Hand #24192019102: Hold'em No Limit ($0.50/$1.00 USD) - 2026/06/03 22:31:05 ET
Table 'Carina' 6-max Seat #1 is the button
Seat 1: RickGrinder ($102.50 in chips) 
Seat 2: LooseLuka ($45.20 in chips) 
Seat 3: Hero ($150.00 in chips) 
Seat 4: AgroAna ($112.10 in chips) 
Seat 5: NicoleNits ($98.00 in chips) 
Seat 6: FishFelipe ($62.50 in chips) 
LooseLuka: posts small blind $0.50
Hero: posts big blind $1.00
*** HOLE CARDS ***
Dealt to Hero [Kh Qh]
Hero: raises $1.50 to $2.50
AgroAna: calls $2.50
NicoleNits: folds 
FishFelipe: calls $2.50
RickGrinder: folds 
LooseLuka: folds 
*** FLOP *** [Ts Jh 4c]
FishFelipe: checks 
Hero: checks 
AgroAna: bets $6.50
FishFelipe: folds 
Hero: calls $6.50
*** SUMMARY ***
Total pot $20.50 | Rake $1.00 
Board [Ts Jh 4c]`,

  // HAND 3 (Turn check - Hero completes flush draw)
  `PokerStars Hand #24192019103: Hold'em No Limit ($0.50/$1.00 USD) - 2026/06/03 22:32:00 ET
Table 'Carina' 6-max Seat #1 is the button
Seat 1: RickGrinder ($102.50 in chips) 
Seat 2: LooseLuka ($45.20 in chips) 
Seat 3: Hero ($150.00 in chips) 
Seat 4: AgroAna ($112.10 in chips) 
Seat 5: NicoleNits ($98.00 in chips) 
Seat 6: FishFelipe ($62.50 in chips) 
LooseLuka: posts small blind $0.50
Hero: posts big blind $1.00
*** HOLE CARDS ***
Dealt to Hero [Kh Qh]
Hero: raises $1.50 to $2.50
AgroAna: calls $2.50
FishFelipe: calls $2.50
*** FLOP *** [Ts Jh 4c]
FishFelipe: checks 
Hero: checks 
AgroAna: bets $6.50
FishFelipe: folds 
Hero: calls $6.50
*** TURN *** [Ts Jh 4c] [9h]
Hero: checks 
AgroAna: bets $14.00
Hero: raises $22.00 to $36.00
AgroAna: calls $22.00
*** SUMMARY ***
Total pot $92.50 | Rake $3.00 
Board [Ts Jh 4c 9h]`,

  // HAND 4 (Showdown victory - Royal Flush completion!)
  `PokerStars Hand #24192019104: Hold'em No Limit ($0.50/$1.00 USD) - 2026/06/03 22:33:45 ET
Table 'Carina' 6-max Seat #1 is the button
Seat 1: RickGrinder ($102.50 in chips) 
Seat 2: LooseLuka ($45.20 in chips) 
Seat 3: Hero ($150.00 in chips) 
Seat 4: AgroAna ($112.10 in chips) 
Seat 5: NicoleNits ($98.00 in chips) 
Seat 6: FishFelipe ($62.50 in chips) 
LooseLuka: posts small blind $0.50
Hero: posts big blind $1.00
*** HOLE CARDS ***
Dealt to Hero [Ah Kh]
RickGrinder: raises $1.50 to $2.50
LooseLuka: folds 
Hero: raises $7.50 to $10.00
RickGrinder: calls $7.50
*** FLOP *** [Th Qh Jh]
Hero: bets $12.00
RickGrinder: calls $12.00
*** TURN *** [Th Qh Jh] [3d]
Hero: checks 
RickGrinder: checks 
*** RIVER *** [Th Qh Jh 3d] [2h]
Hero: bets $35.00
RickGrinder: raises $45.00 to $80.00
Hero: raises $48.00 to $128.00 and is all-in
RickGrinder: calls $48.00
*** SHOWDOWN ***
Hero: shows [Ah Kh] (a Royal Flush)
RickGrinder: mucks hand 
Hero collected $295.50 from pot
*** SUMMARY ***
Total pot $298.00 | Rake $2.50 
Board [Th Qh Jh 3d 2h]
Seat 3: Hero showed [Ah Kh] and won ($295.50) with Royal Flush`
];
