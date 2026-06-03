/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Calculator, RefreshCw, Layers, Sparkles, CheckCircle2 } from "lucide-react";
import { calculateEquity, cardValuesMap, parseCardString } from "../utils/pokerMath";
import { Card, EquityResult } from "../types";

export default function EquityCalc() {
  const [p1Cards, setP1Cards] = useState<string[]>(["As", "Ah"]); // Pocket Aces
  const [p2Cards, setP2Cards] = useState<string[]>(["Ks", "Kd"]); // Pocket Kings
  const [boardCards, setBoardCards] = useState<string[]>(["", "", "", "", ""]);
  const [iterations, setIterations] = useState<number>(5000);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [result, setResult] = useState<EquityResult | null>(null);

  // Card Picker UI state
  const [activeSlot, setActiveSlot] = useState<{ type: 'p1' | 'p2' | 'board'; index: number } | null>(null);

  const cardValues = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const cardSuits = [
    { code: "s", symbol: "♠", label: "Espadas", color: "text-zinc-300 bg-zinc-900 border-zinc-700" },
    { code: "h", symbol: "♥", label: "Copas", color: "text-red-400 bg-red-950/20 border-red-900/50" },
    { code: "d", symbol: "♦", label: "Ouros", color: "text-blue-400 bg-blue-950/20 border-blue-900/50" },
    { code: "c", symbol: "♣", label: "Paus", color: "text-emerald-400 bg-emerald-950/20 border-emerald-900/50" }
  ];

  // Run calculation immediately on card updates to provide instant feel
  const executeCalculation = () => {
    // Basic validation: both players must have exactly 2 valid cards
    const p1Valid = p1Cards.filter(c => c !== "");
    const p2Valid = p2Cards.filter(c => c !== "");
    if (p1Valid.length < 2 || p2Valid.length < 2) return;

    setCalculating(true);
    setTimeout(() => {
      // Extract non-empty board cards
      const activeBoard = boardCards.filter(c => c !== "");
      const eq = calculateEquity(p1Cards, p2Cards, activeBoard, iterations);
      setResult(eq);
      setCalculating(false);
    }, 120);
  };

  useEffect(() => {
    executeCalculation();
  }, [p1Cards, p2Cards, boardCards, iterations]);

  // Load standard scenario presets
  const loadScenario = (type: "coinflip" | "cooler" | "flushdraw") => {
    if (type === "coinflip") {
      setP1Cards(["As", "Kd"]); // AKo
      setP2Cards(["Qs", "Qh"]); // QQ
      setBoardCards(["", "", "", "", ""]);
    } else if (type === "cooler") {
      setP1Cards(["As", "Ah"]); // AA
      setP2Cards(["Ks", "Kh"]); // KK
      setBoardCards(["", "", "", "", ""]);
    } else if (type === "flushdraw") {
      setP1Cards(["Js", "Ts"]); // JTs Flush Draw + Straight Draw
      setP2Cards(["Ad", "Kc"]); // AKo top-pair
      setBoardCards(["As", "Kc", "3s", "", ""]); // Flop with 2 spades
    }
    setActiveSlot(null);
  };

  const selectCard = (val: string, suit: string) => {
    if (!activeSlot) return;
    const cardStr = `${val}${suit}`;

    // Ensure card isn't already selected somewhere to prevent duplicate cards
    const exists = 
      p1Cards.includes(cardStr) || 
      p2Cards.includes(cardStr) || 
      boardCards.includes(cardStr);

    if (exists) {
      // Alert or simply skip duplicate selection
      return;
    }

    if (activeSlot.type === "p1") {
      const copy = [...p1Cards];
      copy[activeSlot.index] = cardStr;
      setP1Cards(copy);
    } else if (activeSlot.type === "p2") {
      const copy = [...p2Cards];
      copy[activeSlot.index] = cardStr;
      setP2Cards(copy);
    } else if (activeSlot.type === "board") {
      const copy = [...boardCards];
      copy[activeSlot.index] = cardStr;
      setBoardCards(copy);
    }

    // Auto progress/close
    setActiveSlot(null);
  };

  const clearSlot = (type: 'p1' | 'p2' | 'board', index: number) => {
    if (type === "p1") {
      const copy = [...p1Cards];
      copy[index] = "";
      setP1Cards(copy);
    } else if (type === "p2") {
      const copy = [...p2Cards];
      copy[index] = "";
      setP2Cards(copy);
    } else {
      const copy = [...boardCards];
      copy[index] = "";
      setBoardCards(copy);
    }
    setResult(null);
  };

  // Render card visual element
  const renderCardVisual = (cardStr: string, onClick: () => void, isSelectedSlot: boolean) => {
    if (!cardStr) {
      return (
        <button
          onClick={onClick}
          className={`w-14 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            isSelectedSlot 
              ? "border-emerald-500 bg-emerald-950/20 text-emerald-400 animate-pulse" 
              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 text-zinc-500"
          }`}
        >
          <span className="text-[10px] font-mono font-bold">SELEC.</span>
          <span className="text-[9px] font-sans text-zinc-600">+</span>
        </button>
      );
    }

    const val = cardStr[0];
    const suit = cardStr[1];
    let suitSymbol = "♠";
    let colorClass = "text-zinc-300";

    if (suit === "h") { suitSymbol = "♥"; colorClass = "text-rose-500"; }
    else if (suit === "d") { suitSymbol = "♦"; colorClass = "text-blue-400"; }
    else if (suit === "c") { suitSymbol = "♣"; colorClass = "text-emerald-400"; }

    return (
      <button
        onClick={onClick}
        className={`w-14 h-20 bg-zinc-900 rounded-lg border flex flex-col justify-between p-2 cursor-pointer shadow-lg hover:brightness-110 active:scale-95 transition-all text-left ${
          isSelectedSlot ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-700"
        }`}
      >
        <div className="flex justify-between items-center leading-none">
          <span className="font-mono font-bold text-sm text-zinc-100">{val}</span>
          <span className={`text-sm ${colorClass}`}>{suitSymbol}</span>
        </div>
        <div className={`text-xl self-center leading-none my-1 ${colorClass}`}>
          {suitSymbol}
        </div>
        <div className="flex justify-between items-end leading-none">
          <span></span>
          <span className="text-[9px] font-mono text-zinc-500">{suit.toUpperCase()}</span>
        </div>
      </button>
    );
  };

  return (
    <div id="equity-calc-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation Configuration & Arena - Span 7 */}
      <section className="lg:col-span-7 bg-zinc-900 p-6 rounded-xl border border-zinc-800/80 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <h3 className="text-zinc-100 font-sans font-semibold text-sm">Calculadora de Equidade Online</h3>
          </div>
          
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              id="preset-coinflip"
              onClick={() => loadScenario("coinflip")}
              className="px-2.5 py-1 text-[10px] font-sans font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all"
            >
              AK vs QQ (Coinflip)
            </button>
            <button
              id="preset-cooler"
              onClick={() => loadScenario("cooler")}
              className="px-2.5 py-1 text-[10px] font-sans font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all"
            >
              AA vs KK
            </button>
            <button
              id="preset-flushdraw"
              onClick={() => loadScenario("flushdraw")}
              className="px-2.5 py-1 text-[10px] font-sans font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all"
            >
              Draw vs Top Pair
            </button>
          </div>
        </div>

        {/* Players Slot Arena Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player 1 Card Block */}
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/65 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-300">PLAYER 1 (HERO)</span>
              {p1Cards.some(c => c !== "") && (
                <button 
                  onClick={() => { setP1Cards(["", ""]); setResult(null); }}
                  className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {renderCardVisual(p1Cards[0], () => setActiveSlot({ type: 'p1', index: 0 }), activeSlot?.type === 'p1' && activeSlot.index === 0)}
              {renderCardVisual(p1Cards[1], () => setActiveSlot({ type: 'p1', index: 1 }), activeSlot?.type === 'p1' && activeSlot.index === 1)}
              
              {/* Pocket Title */}
              <div className="flex flex-col gap-0.5 ml-1">
                <span className="text-xs text-zinc-400 font-sans">Força do Range</span>
                <span className="text-sm font-semibold text-emerald-400 font-sans">
                  {p1Cards[0] && p1Cards[1] ? "Duas Cartas" : "Incompleto"}
                </span>
              </div>
            </div>
          </div>

          {/* Player 2 Card Block */}
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/65 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-300">PLAYER 2 (OPONENTE / VILÃO)</span>
              {p2Cards.some(c => c !== "") && (
                <button 
                  onClick={() => { setP2Cards(["", ""]); setResult(null); }}
                  className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {renderCardVisual(p2Cards[0], () => setActiveSlot({ type: 'p2', index: 0 }), activeSlot?.type === 'p2' && activeSlot.index === 0)}
              {renderCardVisual(p2Cards[1], () => setActiveSlot({ type: 'p2', index: 1 }), activeSlot?.type === 'p2' && activeSlot.index === 1)}
              
              <div className="flex flex-col gap-0.5 ml-1">
                <span className="text-xs text-zinc-400 font-sans">Força do Range</span>
                <span className="text-sm font-semibold text-rose-400 font-sans">
                  {p2Cards[0] && p2Cards[1] ? "Duas Cartas" : "Incompleto"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Community Board Slots block */}
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-mono font-bold text-zinc-300">CARTAS COMUNITÁRIAS (BOARD)</span>
            </div>
            <button 
              onClick={() => { setBoardCards(["", "", "", "", ""]); setResult(null); }}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
            >
              Limpar Todos
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Flop */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800/50">
              <span className="text-[10px] font-mono text-zinc-500 mr-1 font-bold">FLOP:</span>
              {renderCardVisual(boardCards[0], () => setActiveSlot({ type: 'board', index: 0 }), activeSlot?.type === 'board' && activeSlot.index === 0)}
              {renderCardVisual(boardCards[1], () => setActiveSlot({ type: 'board', index: 1 }), activeSlot?.type === 'board' && activeSlot.index === 1)}
              {renderCardVisual(boardCards[2], () => setActiveSlot({ type: 'board', index: 2 }), activeSlot?.type === 'board' && activeSlot.index === 2)}
            </div>

            {/* Turn */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800/50">
              <span className="text-[10px] font-mono text-zinc-500 mr-1 font-bold">TURN:</span>
              {renderCardVisual(boardCards[3], () => setActiveSlot({ type: 'board', index: 3 }), activeSlot?.type === 'board' && activeSlot.index === 3)}
            </div>

            {/* River */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-950 rounded-lg border border-zinc-800/50">
              <span className="text-[10px] font-mono text-zinc-500 mr-1 font-bold">RIVER:</span>
              {renderCardVisual(boardCards[4], () => setActiveSlot({ type: 'board', index: 4 }), activeSlot?.type === 'board' && activeSlot.index === 4)}
            </div>
          </div>
        </div>

        {/* Iteration configuration counts */}
        <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs font-sans text-zinc-400">
          <label className="flex items-center gap-2">
            <span>Precisão (Iterações Monte Carlo):</span>
            <select
              id="iterations-selector"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg font-mono focus:outline-none"
            >
              <option value={1000}>1,000 (Rápida)</option>
              <option value={5000}>5,000 (Padrão)</option>
              <option value={10000}>10,000 (Alta Precisão)</option>
            </select>
          </label>

          <span className="text-[11px] font-mono text-zinc-500">Auto-cálculo ativo</span>
        </div>
      </section>

      {/* Card Selector Popover Board & Result panel - Span 5 */}
      <section className="lg:col-span-5 flex flex-col gap-5">
        {/* Card keyboard Selector Box */}
        {activeSlot && (
          <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-100 font-mono text-xs font-bold uppercase tracking-wider">
                Selecionar para: {activeSlot.type.toUpperCase()} (Indice {activeSlot.index + 1})
              </span>
              <button 
                onClick={() => clearSlot(activeSlot.type, activeSlot.index)}
                className="text-[10px] font-mono text-red-400 hover:text-red-300"
              >
                Remover Carta
              </button>
            </div>

            {/* Layout divided by suit blocks */}
            <div className="flex flex-col gap-3">
              {cardSuits.map((suit) => (
                <div key={suit.code} className="flex flex-col gap-1.5">
                  <span className={`text-[10px] font-sans font-semibold px-1 ${suit.color}`}>{suit.label} ({suit.symbol})</span>
                  <div className="flex flex-wrap gap-1">
                    {cardValues.map((val) => {
                      const cardStr = `${val}${suit.code}`;
                      const isUsed = p1Cards.includes(cardStr) || p2Cards.includes(cardStr) || boardCards.includes(cardStr);
                      
                      return (
                        <button
                          key={cardStr}
                          id={`key-${cardStr}`}
                          disabled={isUsed}
                          onClick={() => selectCard(val, suit.code)}
                          className={`w-[26px] h-[34px] rounded-md font-mono text-xs font-bold flex items-center justify-center border transition-all cursor-pointer ${
                            isUsed 
                              ? "bg-zinc-950/80 border-zinc-900 text-zinc-800 cursor-not-allowed" 
                              : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 text-zinc-100 hover:scale-105 active:scale-95"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveSlot(null)}
              className="w-full py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-sans text-xs rounded-lg hover:text-white"
            >
              Fechar Teclado
            </button>
          </div>
        )}

        {/* Live Calculation Results */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800/80 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-spin-slow" />
              <h4 className="text-zinc-100 font-sans font-semibold text-sm">Output em Tempo Real</h4>
            </div>
            {calculating && <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />}
          </div>

          {result ? (
            <div className="flex flex-col gap-5">
              {/* Player 1 Equity Bar */}
              <div id="p1-equity-display" className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-400">P1 EQUIDADE (HERO)</span>
                    <h5 className="text-sm font-semibold text-zinc-100 font-mono mt-0.5">
                      [{p1Cards.filter(Boolean).join(" ")}]
                    </h5>
                  </div>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {result.player1Win.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-300" 
                    style={{ width: `${result.player1Win}%` }}
                  ></div>
                </div>
              </div>

              {/* Player 2 Equity Bar */}
              <div id="p2-equity-display" className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-400">P2 EQUIDADE (OPONENTE)</span>
                    <h5 className="text-sm font-semibold text-zinc-100 font-mono mt-0.5">
                      [{p2Cards.filter(Boolean).join(" ")}]
                    </h5>
                  </div>
                  <span className="text-2xl font-mono font-black text-rose-400">
                    {result.player2Win.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 to-orange-400 rounded-full transition-all duration-300" 
                    style={{ width: `${result.player2Win}%` }}
                  ></div>
                </div>
              </div>

              {/* Ties and info */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 text-center font-mono">
                <div>
                  <span className="block text-[10px] text-zinc-500">EMPATAM</span>
                  <span className="text-xs font-bold text-zinc-300">{result.tie.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500">SIMULAÇÕES</span>
                  <span className="text-xs font-bold text-zinc-300">{(result.iterations).toLocaleString()}</span>
                </div>
              </div>

              {/* Advisory note */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex gap-2 text-[11px] text-emerald-400 leading-relaxed">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  As probabilidades foram geradas dinamicamente com base em estatísticas reais através de amostragem aleatória do baralho restante.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-xs text-zinc-500">Por favor, configure 2 cartas no Player 1 e no Player 2 para calcular sua equidade.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
