/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Target, User, Send, Edit3, HelpCircle, Swords, AlertOctagon } from "lucide-react";
import { OpponentStats } from "../types";

interface PokerHudProps {
  opponents?: OpponentStats[];
  setOpponents?: React.Dispatch<React.SetStateAction<OpponentStats[]>>;
}

export default function PokerHud({ opponents: propsOpponents, setOpponents: propsSetOpponents }: PokerHudProps) {
  const [localOpponents, setLocalOpponents] = useState<OpponentStats[]>([
    { id: "1", seat: 1, name: "RickGrinder", hands: 420, vpip: 18, pfr: 14, threeBet: 6, af: 3.2, notes: "Nitty regular. Respeite raises de UTG.", recentActions: ["Fold", "Raise UTG", "Fold"] },
    { id: "2", seat: 2, name: "LooseLuka", hands: 210, vpip: 42, pfr: 10, threeBet: 2, af: 1.1, notes: "Oponente recreativo pagador. Não blefe, extraia com valor.", recentActions: ["Call BB", "Call Flop", "Check-Call"] },
    { id: "3", seat: 3, name: "Hero (Você)", hands: 1250, vpip: 24, pfr: 19, threeBet: 8, af: 2.8, notes: "GTO equilibrado.", recentActions: [] },
    { id: "4", seat: 4, name: "AgroAna", hands: 380, vpip: 28, pfr: 24, threeBet: 12, af: 4.5, notes: "Reg agressiva 3BET light. Contra-ataque de 4BET flat.", recentActions: ["3-Bet SB", "Bet flop", "Bet Turn"] },
    { id: "5", seat: 5, name: "NicoleNits", hands: 154, vpip: 12, pfr: 8, threeBet: 1, af: 1.5, notes: "Extreme Nit. Só dá raise com monstro.", recentActions: ["Fold", "Fold", "Fold"] },
    { id: "6", seat: 6, name: "FishFelipe", hands: 89, vpip: 58, pfr: 4, threeBet: 0, af: 0.8, notes: "Estação de telefone. Limpa quase todo deck.", recentActions: ["Limp HJ", "Check-Call", "Call Showdown"] }
  ]);

  const opponents = propsOpponents || localOpponents;
  const setOpponents = propsSetOpponents || setLocalOpponents;

  const [selectedOpponentId, setSelectedOpponentId] = useState<string>("2");
  
  // Custom Notes
  const [editingNotes, setEditingNotes] = useState("");
  
  // Hand History parser input box
  const [handHistoryText, setHandHistoryText] = useState(
    "AgroAna raises to $2.00\nFishFelipe calls $2.00\nHero folds\nRickGrinder folds\nLooseLuka calls $2.00"
  );
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  const selectedOpponent = opponents.find(o => o.id === selectedOpponentId);

  // Trigger simulated hands update manually to show HUD dynamic metric calculators
  const simulateOpponentAction = (oppId: string, actionType: "fold" | "limp" | "raise" | "3bet" | "postflop_bet") => {
    setOpponents((prevOpponents) =>
      prevOpponents.map((opp) => {
        if (opp.id !== oppId) return opp;

        let hands = opp.hands + 1;
        let vpipSum = opp.vpip * opp.hands;
        let pfrSum = opp.pfr * opp.hands;
        let threeBetSum = opp.threeBet * opp.hands;
        let af = opp.af;

        let actionLog = "";

        if (actionType === "fold") {
          actionLog = "Fold Preflop";
          // VPIP & PFR down slightly since this was a fold
          vpipSum = vpipSum; 
          pfrSum = pfrSum;
        } else if (actionType === "limp") {
          actionLog = "Limp/Call Preflop";
          vpipSum += 100; // Entered pot
        } else if (actionType === "raise") {
          actionLog = "Raise Preflop";
          vpipSum += 100;
          pfrSum += 100; // Raised preflop
        } else if (actionType === "3bet") {
          actionLog = "3-Bet Re-raise";
          vpipSum += 100;
          pfrSum += 100;
          threeBetSum += 100; // 3-Betted
        } else if (actionType === "postflop_bet") {
          actionLog = "Bet Postflop (+Af)";
          // Increases Aggression factor ratio
          af = Math.min(10, opp.af + 0.3);
          hands = opp.hands; // Assume same hand, just a postflop action
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

  const handleSaveNotes = () => {
    if (!selectedOpponent) return;
    setOpponents((prev) =>
      prev.map((o) => (o.id === selectedOpponent.id ? { ...o, notes: editingNotes } : o))
    );
    setParseStatus("Anotações salvas com sucesso!");
    setTimeout(() => setParseStatus(null), 2000);
  };

  // Selects person to edit notes pre-populating current state
  const handleSelectOpponent = (id: string) => {
    setSelectedOpponentId(id);
    const opp = opponents.find(o => o.id === id);
    if (opp) {
      setEditingNotes(opp.notes);
    }
  };

  // Parses hand history text and converts actions into HUD statistics increments!
  const handleParseHandHistory = () => {
    if (!handHistoryText.trim()) return;

    setParseStatus("Processando histórico de mãos...");
    
    setTimeout(() => {
      let lines = handHistoryText.split("\n");
      let matchedCount = 0;

      const oppMap = [...opponents];

      lines.forEach((line) => {
        // Simple case insensitive string matching for actions
        const lineLower = line.toLowerCase();
        
        oppMap.forEach((opp) => {
          if (lineLower.includes(opp.name.toLowerCase())) {
            matchedCount++;
            
            let isFold = lineLower.includes("fold");
            let isRaise = lineLower.includes("raise");
            let is3bet = lineLower.includes("3bet") || lineLower.includes("3-bet") || lineLower.includes("threebet");
            let isCall = lineLower.includes("call") || lineLower.includes("limp");

            let h = opp.hands + 1;
            let vpip = opp.vpip;
            let pfr = opp.pfr;
            let threeBet = opp.threeBet;

            if (isFold) {
              // Standard fold
            } else if (is3bet) {
              opp.vpip = Math.round((opp.vpip * opp.hands + 100) / h);
              opp.pfr = Math.round((opp.pfr * opp.hands + 100) / h);
              opp.threeBet = Math.round((opp.threeBet * opp.hands + 100) / h);
            } else if (isRaise) {
              opp.vpip = Math.round((opp.vpip * opp.hands + 100) / h);
              opp.pfr = Math.round((opp.pfr * opp.hands + 100) / h);
            } else if (isCall) {
              opp.vpip = Math.round((opp.vpip * opp.hands + 100) / h);
            }

            opp.hands = h;
          }
        });
      });

      setOpponents(oppMap);
      setParseStatus(`Sucesso! Histórico analisado, ${matchedCount} ações identificadas e HUD atualizado.`);
      setTimeout(() => setParseStatus(null), 4000);
    }, 450);
  };

  // Color coordinate HUD stats to detect player patterns high to low
  const getVpipColor = (v: number) => {
    if (v >= 40) return "text-red-400"; // Extremely loose / recreational
    if (v >= 23) return "text-emerald-400"; // Solid Loose-aggressive / regular
    if (v >= 15) return "text-amber-500"; // Tight regular
    return "text-zinc-500"; // Nit
  };

  return (
    <div id="poker-hud-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 6-Max Felt table HUD representation - Span 7 */}
      <section className="lg:col-span-7 bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-col items-center justify-center gap-6 relative overflow-hidden min-h-[460px]">
        <div className="absolute top-4 left-6 flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-400 animate-pulse" />
          <h3 className="text-zinc-100 font-sans font-semibold text-sm">Visualizador do HUD Ativo (6-Max)</h3>
        </div>

        {/* The Felt Table Oval Shape */}
        <div className="relative w-full max-w-[480px] aspect-[1.8/1] bg-gradient-to-b from-zinc-900 to-zinc-950 border-[5px] border-zinc-800 rounded-[80px] p-6 shadow-2xl flex items-center justify-center my-6">
          
          {/* Inner Felt Border accent line */}
          <div className="absolute inset-2 border border-zinc-700/20 rounded-[70px] pointer-events-none"></div>
          
          {/* Deck community representation in the center felt */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-600 uppercase">Feltro Online</span>
            <span className="text-[9px] font-mono text-zinc-500">Mão #42502</span>
          </div>

          {/* Opponents placing as seats */}
          {opponents.map((opp) => {
            const isSelected = selectedOpponentId === opp.id;
            const isHero = opp.seat === 3;
            
            // Positioning coordinates based on 6 seats (Clockwise around table)
            let seatCoords = "top-0 left-12";
            if (opp.seat === 1) seatCoords = "-top-8 left-1/2 -translate-x-1/2"; // SB / BTN top
            if (opp.seat === 2) seatCoords = "top-6 -right-10"; // Right top
            if (opp.seat === 6) seatCoords = "bottom-6 -right-10"; // Right bottom
            if (opp.seat === 3) seatCoords = "-bottom-8 left-1/2 -translate-x-1/2"; // Hero bottom
            if (opp.seat === 5) seatCoords = "bottom-6 -left-10"; // Left bottom
            if (opp.seat === 4) seatCoords = "top-6 -left-10"; // Left top

            return (
              <button
                key={opp.id}
                id={`seat-avatar-${opp.seat}`}
                onClick={() => handleSelectOpponent(opp.id)}
                className={`absolute ${seatCoords} p-2 bg-zinc-900 border hover:scale-105 active:scale-95 transition-all text-left rounded-xl z-20 cursor-pointer shadow-lg w-32 ${
                  isSelected 
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-zinc-900" 
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-1 border-b border-zinc-850 pb-1 mb-1 justify-between">
                  <span className="text-[10px] font-sans font-bold text-zinc-100 truncate max-w-[80px]">
                    {opp.name}
                  </span>
                  <span className="text-[8px] font-mono font-black text-zinc-500">S{opp.seat}</span>
                </div>

                {/* Floating HUD stats line values overlay */}
                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase text-[7px]">VPIP</span>
                    <span className={`font-bold ${getVpipColor(opp.vpip)}`}>{opp.vpip}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase text-[7px]">PFR</span>
                    <span className="font-bold text-zinc-300">{opp.pfr}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase text-[7px]">3B</span>
                    <span className="font-bold text-amber-500">{opp.threeBet}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-500 uppercase text-[7px]">AF</span>
                    <span className="font-bold text-violet-400">{opp.af}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[7.5px] font-mono text-zinc-600 mt-1">
                  <span>H: {opp.hands}</span>
                  {opp.recentActions.length > 0 && (
                    <span className="text-emerald-500/80 max-w-[60px] truncate">{opp.recentActions[0]}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic status advisory color rules */}
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs w-full flex items-center gap-3.5 mt-2 text-zinc-400 leading-relaxed font-sans">
          <p className="flex items-center gap-1.5 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Loose/calling</p>
          <p className="flex items-center gap-1.5 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Solid Tight-Agro</p>
          <p className="flex items-center gap-1.5 shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Tight Regular</p>
          <p className="text-[10px] text-zinc-500 font-mono italic">Clique nos assentos para configurar notas ou simular mais mãos</p>
        </div>
      </section>

      {/* Opponent Settings Editor & Text Hand History Parser - Span 5 */}
      <section className="lg:col-span-5 flex flex-col gap-5">
        {/* Opponent Selector / Notes Manager Box */}
        {selectedOpponent ? (
          <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <User className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-zinc-100 font-sans font-semibold text-sm">Editar Perfil: {selectedOpponent.name}</span>
            </div>

            {/* Simulated Live update buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest px-0.5">Alimentar Estatísticas do HUD</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  id="btn-act-sim-fold"
                  onClick={() => simulateOpponentAction(selectedOpponent.id, "fold")}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300"
                >
                  + Fold Pre
                </button>
                <button
                  id="btn-act-sim-limp"
                  onClick={() => simulateOpponentAction(selectedOpponent.id, "limp")}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300"
                >
                  + Limp / Call
                </button>
                <button
                  id="btn-act-sim-raise"
                  onClick={() => simulateOpponentAction(selectedOpponent.id, "raise")}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300"
                >
                  + Raise Pre
                </button>
                <button
                  id="btn-act-sim-3bet"
                  onClick={() => simulateOpponentAction(selectedOpponent.id, "3bet")}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300"
                >
                  + 3-Bet
                </button>
                <button
                  id="btn-act-sim-postflop"
                  onClick={() => simulateOpponentAction(selectedOpponent.id, "postflop_bet")}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300"
                >
                  + Postflop Bet
                </button>
              </div>
            </div>

            {/* Note edit section */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="block text-[10px] font-mono text-zinc-400">ANOTAÇÕES DO OPONENTE (EXPLOIT NOTE)</label>
              <textarea
                id="opp-notes-textarea"
                rows={2}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                className="w-full text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 focus:outline-none resize-none"
                placeholder="Ex %Maneco de fold para raises no River..."
              />
              <button
                id="btn-save-opp-notes"
                onClick={handleSaveNotes}
                className="self-end px-4 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-emerald-400 font-mono font-bold text-[10px] rounded border border-zinc-800 cursor-pointer"
              >
                Salvar Nota
              </button>
            </div>

            {/* Advisory feedback text according to user VPIP stats */}
            <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl flex items-start gap-2 text-[11px] text-indigo-300 leading-normal">
              <Swords className="h-4.5 w-4.5 shrink-0 mt-0.5 text-indigo-400" />
              <div>
                <p className="font-bold uppercase font-mono tracking-widest text-[9px] text-indigo-400">Contra-estratégia sugerida</p>
                <p className="mt-1 font-sans">
                  {selectedOpponent.vpip > 40 
                    ? "Oponente com VPIP alto representa range extremamente elástico e fraco. Evite blefar e faça pot-sized bets por valor com pares altos e draws fortes."
                    : selectedOpponent.vpip < 15
                    ? "Regular nitty extremo. Só joga com ranges fechados de cartas premium (top 8%). Desista de potes médios se sofrer agressão pós-flop."
                    : "Regular equilibrada de perfil TAG. Faça re-steals de 3-bet se estiver no SB/BB contra aberturas no botão."
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500 py-10">
            Selecione uma cadeira na mesa virtual para detalhar o oponente.
          </div>
        )}

        {/* Hand History Parser Box */}
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
            <Edit3 className="h-4.5 w-4.5 text-emerald-400" />
            <h4 className="text-zinc-100 font-sans font-semibold text-sm font-sans">Importar Histórico de Mãos</h4>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Gostaria de carregar ações de forma automatizada? Cole o registro textual das apostas abaixo e clica para alimentar a base de dados do HUD dinamicamente.
          </p>

          <div className="flex flex-col gap-3">
            <textarea
              id="hand-history-textarea"
              rows={3}
              value={handHistoryText}
              onChange={(e) => setHandHistoryText(e.target.value)}
              className="w-full text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none resize-none"
              placeholder="Cole o log da mesa aqui..."
            />

            {parseStatus && (
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-[11px] text-emerald-400 font-mono">
                {parseStatus}
              </div>
            )}

            <button
              id="btn-parse-hand-history"
              onClick={handleParseHandHistory}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-sans font-bold text-xs text-zinc-100 rounded-xl transition-all cursor-pointer text-center"
            >
              Alimentar HUD com Log Pasted
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
