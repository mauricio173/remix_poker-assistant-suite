/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import Header from "./components/Header";
import GtoSolver from "./components/GtoSolver";
import EquityCalc from "./components/EquityCalc";
import Multitabler from "./components/Multitabler";
import PokerTracker from "./components/PokerTracker";
import PokerHud from "./components/PokerHud";
import PokerStarsLiveLink from "./components/PokerStarsLiveLink";
import { ParsedLiveHand } from "./utils/pokerStarsParser";
import { OpponentStats, PokerSession } from "./types";
import { Sparkles, Spade, Heart, Diamond, Club, Activity, PowerOff } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("solver");
  const [showQuickTips, setShowQuickTips] = useState<boolean>(true);

  // Consolidated Global states connected to PokerStars Live Stream link
  const [opponents, setOpponents] = useState<OpponentStats[]>([
    { id: "1", seat: 1, name: "RickGrinder", hands: 420, vpip: 18, pfr: 14, threeBet: 6, af: 3.2, notes: "Nitty regular. Respeite raises de UTG.", recentActions: ["Fold", "Raise UTG", "Fold"] },
    { id: "2", seat: 2, name: "LooseLuka", hands: 210, vpip: 42, pfr: 10, threeBet: 2, af: 1.1, notes: "Oponente recreativo pagador. Não blefe, extraia com valor.", recentActions: ["Call BB", "Call Flop", "Check-Call"] },
    { id: "3", seat: 3, name: "Hero (Você)", hands: 1250, vpip: 24, pfr: 19, threeBet: 8, af: 2.8, notes: "GTO equilibrado.", recentActions: [] },
    { id: "4", seat: 4, name: "AgroAna", hands: 380, vpip: 28, pfr: 24, threeBet: 12, af: 4.5, notes: "Reg agressiva 3BET light. Contra-ataque de 4BET flat.", recentActions: ["3-Bet SB", "Bet flop", "Bet Turn"] },
    { id: "5", seat: 5, name: "NicoleNits", hands: 154, vpip: 12, pfr: 8, threeBet: 1, af: 1.5, notes: "Extreme Nit. Só dá raise com monstro.", recentActions: ["Fold", "Fold", "Fold"] },
    { id: "6", seat: 6, name: "FishFelipe", hands: 89, vpip: 58, pfr: 4, threeBet: 0, af: 0.8, notes: "Estação de telefone. Limpa quase todo deck.", recentActions: ["Limp HJ", "Check-Call", "Call Showdown"] }
  ]);

  const [sessions, setSessions] = useState<PokerSession[]>([
    { id: "1", date: "2026-05-28", durationMinutes: 180, buyIn: 100, cashOut: 245, profit: 145, handsPlayed: 1450, stakes: "NL100" },
    { id: "2", date: "2026-05-29", durationMinutes: 120, buyIn: 100, cashOut: 65, profit: -35, handsPlayed: 920, stakes: "NL100" },
    { id: "3", date: "2026-05-30", durationMinutes: 240, buyIn: 100, cashOut: 320, profit: 220, handsPlayed: 2100, stakes: "NL100" },
    { id: "4", date: "2026-06-01", durationMinutes: 154, buyIn: 200, cashOut: 110, profit: -90, handsPlayed: 1150, stakes: "NL200" },
    { id: "5", date: "2026-06-02", durationMinutes: 300, buyIn: 200, cashOut: 480, profit: 280, handsPlayed: 3220, stakes: "NL200" },
  ]);

  const [liveHand, setLiveHand] = useState<ParsedLiveHand | null>(null);
  const [connMode, setConnMode] = useState<"none" | "simulated" | "real">("none");

  const handleLiveHandUpdated = (parsed: ParsedLiveHand) => {
    setLiveHand(parsed);
  };

  const handleLiveOpponentAction = (name: string, actionType: string) => {
    setOpponents((prevOpponents) =>
      prevOpponents.map((opp) => {
        if (opp.name.toLowerCase() !== name.toLowerCase()) return opp;

        let hands = opp.hands + 1;
        let vpipSum = opp.vpip * opp.hands;
        let pfrSum = opp.pfr * opp.hands;
        let threeBetSum = opp.threeBet * opp.hands;
        let af = opp.af;

        let actionLog = "";

        if (actionType === "fold") {
          actionLog = "Fold Preflop";
        } else if (actionType === "call") {
          actionLog = "Call / Check";
          vpipSum += 100;
        } else if (actionType === "raise") {
          actionLog = "Raise Preflop";
          vpipSum += 100;
          pfrSum += 100;
        } else if (actionType === "3bet") {
          actionLog = "3-Bet Re-raise";
          vpipSum += 100;
          pfrSum += 100;
          threeBetSum += 100;
        } else if (actionType === "postflop_bet") {
          actionLog = "Bet Postflop";
          af = Math.min(10, opp.af + 0.1);
          hands = opp.hands;
        }

        const newVpip = Math.round(vpipSum / hands);
        const newPfr = Math.round(pfrSum / hands);
        const new3Bet = Math.round(threeBetSum / hands);

        return {
          ...opp,
          hands,
          vpip: Math.min(100, Math.max(0, newVpip)),
          pfr: Math.min(100, Math.max(0, newPfr)),
          threeBet: Math.min(100, Math.max(0, new3Bet)),
          af: Number(af.toFixed(1)),
          recentActions: [actionLog, ...opp.recentActions.slice(0, 2)]
        };
      })
    );
  };

  const handleLiveSessionComplete = (profit: number, handsCount: number, stakesLabel: string) => {
    setSessions((prev) => {
      // Find today's session with correct stakes or make new one
      const today = new Date().toISOString().split("T")[0];
      const match = prev.find((s) => s.date === today && s.stakes === stakesLabel);

      if (match) {
        return prev.map((s) =>
          s.id === match.id
            ? {
                ...s,
                handsPlayed: s.handsPlayed + handsCount,
                profit: s.profit + profit,
                cashOut: s.cashOut + profit
              }
            : s
        );
      } else {
        const newSession: PokerSession = {
          id: Math.random().toString(),
          date: today,
          durationMinutes: 5,
          buyIn: 100,
          cashOut: 100 + profit,
          profit: profit,
          handsPlayed: handsCount,
          stakes: stakesLabel
        };
        return [newSession, ...prev];
      }
    });
  };

  // Dynamic Tab Router
  const renderTabContent = () => {
    switch (activeTab) {
      case "solver":
        return (
          <GtoSolver
            liveSituation={liveHand?.currentSituationText}
            liveActionHistory={liveHand?.currentHistoryText}
          />
        );
      case "equity":
        return <EquityCalc />;
      case "multitasking":
        return <Multitabler />;
      case "tracker":
        return <PokerTracker sessions={sessions} setSessions={setSessions} />;
      case "hud":
        return <PokerHud opponents={opponents} setOpponents={setOpponents} />;
      default:
        return (
          <GtoSolver
            liveSituation={liveHand?.currentSituationText}
            liveActionHistory={liveHand?.currentHistoryText}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 selection:bg-emerald-500/10 selection:text-emerald-400">
      {/* Visual Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessions={sessions}
        liveStatusText={liveHand ? `${liveHand.tableName} (${liveHand.stakes})` : undefined}
      />
      
      {/* Main Suite Content Arena */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
        
        {/* Quick Tips Welcome Banner */}
        {showQuickTips && (
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/30 to-zinc-900 border border-emerald-900/30 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Background absolute decor icons */}
            <div className="absolute right-10 top-0 bottom-0 flex items-center justify-center gap-2 opacity-[0.03] select-none pointer-events-none text-8xl">
              <Spade />
              <Heart />
              <Diamond />
              <Club />
            </div>

            <div className="flex gap-3 items-start relative z-10">
              <div className="bg-emerald-500/15 p-2 rounded-xl text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-sans font-bold text-zinc-100 flex items-center gap-1.5">
                  Bem-vindo ao Poker Pro Suite!
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-2xl">
                  Grind inteligente com teoria e suporte em tempo real: analise árvores de decisões no <strong>Solucionador GTO</strong>, simule ranges no <strong>Simulador Multitabela</strong> com teclas de atalho de altíssima velocidade, e alimente o <strong>HUD</strong> com registros de jogadas!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 shrink-0">
              <button
                id="btn-hide-welcome"
                onClick={() => setShowQuickTips(false)}
                className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-sans text-xs hover:text-zinc-200 hover:bg-zinc-850 rounded-lg cursor-pointer transition-all"
              >
                Esconder Dicas
              </button>
            </div>
          </div>
        )}

        {/* Real-time PokerStars Live Connection Panel */}
        <PokerStarsLiveLink
          onHandUpdate={handleLiveHandUpdated}
          onOpponentAction={handleLiveOpponentAction}
          onSessionComplete={handleLiveSessionComplete}
          opponents={opponents}
          connMode={connMode}
          setConnMode={setConnMode}
        />

        {/* Active Hand Info Overlay Banner if active stream is playing */}
        {liveHand && (
          <div className="bg-gradient-to-r from-blue-950/20 to-zinc-905 p-4 rounded-xl border border-blue-900/30 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse"></div>
              <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Activity className="h-4.5 w-4.5" /> Mão Ativa: {liveHand.handId}
              </span>
              <span className="text-xs text-zinc-500 font-mono">|</span>
              <span className="text-xs text-zinc-200 font-sans">
                Mesa: <strong className="text-white">{liveHand.tableName}</strong> ({liveHand.stakes})
              </span>
              {liveHand.heroCards.length > 0 && (
                <>
                  <span className="text-xs text-zinc-500 font-mono">|</span>
                  <span className="text-xs text-zinc-300 font-sans flex items-center gap-1">
                    Hero Cards: 
                    <span className="bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded font-mono font-black text-xs text-emerald-400">
                      {liveHand.heroCards.join(" ")}
                    </span>
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-zinc-400 font-mono">Pote Estimado: <strong className="text-emerald-400 font-bold">${liveHand.potSize}</strong></span>
              <button
                id="btn-quick-solver-sync"
                onClick={() => setActiveTab("solver")}
                className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-mono hover:bg-zinc-805 hover:text-white rounded text-blue-400 transition-all cursor-pointer"
              >
                Ver GTO desta Mão ➜
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Mounted Router View */}
        <div className="transition-all duration-300">
          {renderTabContent()}
        </div>

        {/* Global Footer Credits and security indicators */}
        <footer className="border-t border-zinc-900 mt-12 pt-6 pb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-sans font-bold text-zinc-400">POKER_OS v4.2.1-PRO</span>
            <span>CPU: 12%</span>
            <span>RAM: 1.4GB</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              GTO_ENGINE_ONLINE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>SERVER LATENCY: 22ms</span>
            <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden inline-block align-middle">
              <div className="bg-blue-500 h-full w-[80%]"></div>
            </div>
            <span>•</span>
            <span>Estágios de Cálculo Local Desconectados</span>
          </div>
        </footer>
      </main>

      {/* Floating Disconnect Action Button for Simulated or Real Live Feeds */}
      {connMode !== "none" && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 group transition-all duration-300">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-red-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-300 animate-pulse"></div>
          
          <button
            id="floating-btn-disconnect"
            onClick={() => {
              setConnMode("none");
              setLiveHand(null);
            }}
            className="relative px-4 py-3 bg-zinc-900 text-zinc-100 hover:text-white border border-red-500/35 hover:border-red-500 hover:bg-rose-950/80 rounded-full flex items-center gap-2.5 text-xs font-mono font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Desconectar Scanner e Parar Simulador"
          >
            <PowerOff className="h-4 w-4 text-red-400 animate-pulse" />
            <span>DESCONECTAR LIVE</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
