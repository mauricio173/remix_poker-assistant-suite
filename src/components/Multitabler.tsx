/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Laptop, LayoutGrid, Layers, MonitorCheck, Bell, Swords, Keyboard, HelpCircle } from "lucide-react";
import { SimulatedTable } from "../types";

export default function Multitabler() {
  const [layout, setLayout] = useState<"tiled" | "cascade" | "stacked">("tiled");
  const [tables, setTables] = useState<SimulatedTable[]>([
    {
      id: 1,
      tableName: "Mesa Las Vegas (NL100)",
      heroCards: ["As", "Ac"],
      boardCards: ["Ts", "Kh", "3d"],
      potSize: 18.5,
      currentBet: 4.0,
      actionRequired: true,
      status: "Ação Hero!",
      timeRemaining: 24,
      hudTargetId: "Vilão_1",
      dealCount: 142,
      historyLog: ["UTG apostou 2BB", "Hero pagou no BTN", "Flop: Ts Kh 3d", "UTG apostou 4BB"]
    },
    {
      id: 2,
      tableName: "Mesa Macau (NL200)",
      heroCards: ["Kd", "Qd"],
      boardCards: [],
      potSize: 1.5,
      currentBet: 0,
      actionRequired: false,
      status: "Aguardando",
      timeRemaining: 0,
      hudTargetId: "Vilão_3",
      dealCount: 88,
      historyLog: ["Mesa embaralhando... Novo deal iniciado."]
    },
    {
      id: 3,
      tableName: "Mesa Monaco (NL400)",
      heroCards: ["7h", "2c"],
      boardCards: [],
      potSize: 3.0,
      currentBet: 3.0,
      actionRequired: true,
      status: "Time Bank!",
      timeRemaining: 8,
      hudTargetId: "Vilão_4",
      dealCount: 201,
      historyLog: ["BTN deu Open para 3BB", "Hero no BB recebeu lixo."]
    },
    {
      id: 4,
      tableName: "Mesa Bahamas (NL50)",
      heroCards: ["Jh", "Th"],
      boardCards: ["9h", "8c", "2s", "Ah"],
      potSize: 32.0,
      currentBet: 12.0,
      actionRequired: true,
      status: "Ação Hero!",
      timeRemaining: 19,
      hudTargetId: "Vilão_2",
      dealCount: 153,
      historyLog: ["Pote cresceu no Flop", "Turn traz Flush Draw", "CO apostou 12BB"]
    }
  ]);

  const [hotkeyFold, setHotkeyFold] = useState<string>("F1");
  const [hotkeyCall, setHotkeyCall] = useState<string>("F2");
  const [hotkeyRaise, setHotkeyRaise] = useState<string>("F3");
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);

  // Active table focus for hotkeys
  const [focusedTableId, setFocusedTableId] = useState<number>(1);

  // Simulated live ticking clocks for active time banks
  useEffect(() => {
    const interval = setInterval(() => {
      setTables((prevTables) =>
        prevTables.map((t) => {
          if (t.actionRequired && t.timeRemaining > 0) {
            const nextTime = t.timeRemaining - 1;
            let status = t.status;
            if (nextTime <= 10 && status !== "Time Bank!") {
              status = "Time Bank!";
            }
            return {
              ...t,
              timeRemaining: nextTime,
              status: nextTime <= 0 ? "Folded" : status,
              actionRequired: nextTime <= 0 ? false : t.actionRequired
            };
          }
          return t;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard Event Listener to trigger Hotkeys action simulator
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent browser default behavior for F1/F2/F3 while focusing the simulator
      if (["F1", "F2", "F3"].includes(event.key)) {
        event.preventDefault();
      }

      let actionTaken = "";
      if (event.key.toUpperCase() === hotkeyFold.toUpperCase()) {
        actionTaken = "FOLD";
      } else if (event.key.toUpperCase() === hotkeyCall.toUpperCase()) {
        actionTaken = "CALL/CHECK";
      } else if (event.key.toUpperCase() === hotkeyRaise.toUpperCase()) {
        actionTaken = "RAISE";
      }

      if (actionTaken) {
        processAction(focusedTableId, actionTaken);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedTableId, hotkeyFold, hotkeyCall, hotkeyRaise, tables]);

  const processAction = (tableId: number, actionName: string) => {
    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable || !targetTable.actionRequired) return;

    setFeedbackMsg(`Sinal de Tecla de Atalho: [${actionName}] enviado para ${targetTable.tableName}!`);

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            actionRequired: false,
            status: actionName === "FOLD" ? "Folded" : "Won",
            timeRemaining: 0,
            historyLog: [...t.historyLog, `Hero escolheu: ${actionName}!`]
          };
        }
        return t;
      })
    );

    // Auto clear alert feedback after 4 seconds
    setTimeout(() => {
      setFeedbackMsg("");
    }, 4000);
  };

  const handleResetTables = () => {
    setTables([
      {
        id: 1,
        tableName: "Mesa Las Vegas (NL100)",
        heroCards: ["As", "Ac"],
        boardCards: ["Ts", "Kh", "3d"],
        potSize: 18.5,
        currentBet: 4.0,
        actionRequired: true,
        status: "Ação Hero!",
        timeRemaining: 25,
        hudTargetId: "Vilão_1",
        dealCount: 143,
        historyLog: ["UTG apostou 2BB", "Hero pagou no BTN", "Flop: Ts Kh 3d", "UTG apostou 4BB"]
      },
      {
        id: 2,
        tableName: "Mesa Macau (NL200)",
        heroCards: ["Kd", "Qd"],
        boardCards: [],
        potSize: 1.5,
        currentBet: 0,
        actionRequired: false,
        status: "Aguardando",
        timeRemaining: 0,
        hudTargetId: "Vilão_3",
        dealCount: 89,
        historyLog: ["Mesa embaralhando... Novo deal iniciado."]
      },
      {
        id: 3,
        tableName: "Mesa Monaco (NL400)",
        heroCards: ["7h", "2c"],
        boardCards: [],
        potSize: 3.0,
        currentBet: 3.0,
        actionRequired: true,
        status: "Time Bank!",
        timeRemaining: 12,
        hudTargetId: "Vilão_4",
        dealCount: 202,
        historyLog: ["BTN deu Open para 3BB", "Hero no BB recebeu lixo."]
      },
      {
        id: 4,
        tableName: "Mesa Bahamas (NL50)",
        heroCards: ["Jh", "Th"],
        boardCards: ["9h", "8c", "2s", "Ah"],
        potSize: 32.0,
        currentBet: 12.0,
        actionRequired: true,
        status: "Ação Hero!",
        timeRemaining: 22,
        hudTargetId: "Vilão_2",
        dealCount: 154,
        historyLog: ["Pote cresceu no Flop", "Turn traz Flush Draw", "CO apostou 12BB"]
      }
    ]);
    setFeedbackMsg("Mesas reordenadas e novos deals distribuídos.");
  };

  const renderMiniCard = (cardStr: string) => {
    const val = cardStr[0];
    const suit = cardStr[1];
    let suitSymbol = "♠";
    let colorClass = "text-zinc-300";

    if (suit === "h") { suitSymbol = "♥"; colorClass = "text-rose-500"; }
    else if (suit === "d") { suitSymbol = "♦"; colorClass = "text-blue-400"; }
    else if (suit === "c") { suitSymbol = "♣"; colorClass = "text-emerald-400"; }

    return (
      <span className="inline-flex items-center justify-center w-6 h-9 bg-zinc-950 px-1 border border-zinc-800 rounded font-mono font-bold text-xs select-none">
        <span className="text-zinc-100">{val}</span>
        <span className={`text-[11px] ml-0.5 ${colorClass}`}>{suitSymbol}</span>
      </span>
    );
  };

  return (
    <div id="multitasker-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation Arena Block - column span 8 */}
      <section className="lg:col-span-8 bg-zinc-900 p-5 rounded-xl border border-zinc-800/80 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-905 pb-3">
          <div className="flex items-center gap-2">
            <Laptop className="h-5 w-5 text-emerald-400" />
            <h3 className="text-zinc-100 font-sans font-semibold text-sm">Organizador Multitabelas Ativo</h3>
          </div>

          {/* Quick arrangement switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
            <button
              id="layout-btn-tiled"
              onClick={() => setLayout("tiled")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded ${
                layout === "tiled" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Ladrilhar (Tiled)</span>
            </button>
            <button
              id="layout-btn-cascade"
              onClick={() => setLayout("cascade")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded ${
                layout === "cascade" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Cascata</span>
            </button>
            <button
              id="layout-btn-stacked"
              onClick={() => setLayout("stacked")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded ${
                layout === "stacked" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <MonitorCheck className="h-3.5 w-3.5" />
              <span>Foco Único</span>
            </button>
          </div>
        </div>

        {/* Floating feedback alert bar */}
        {feedbackMsg && (
          <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 rounded-xl text-xs text-indigo-300 font-mono flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Dynamic Layout board */}
        <div 
          className={`grid gap-4 transition-all duration-300 ${
            layout === "tiled"
              ? "grid-cols-1 md:grid-cols-2"
              : layout === "cascade"
              ? "relative min-h-[380px]"
              : "grid-cols-1 md:grid-cols-12"
          }`}
        >
          {layout === "stacked" ? (
            /* STACKED/FOCUS LAYOUT */
            <>
              {/* Giant Active Table */}
              <div className="md:col-span-9 bg-zinc-900/60 rounded-xl border-2 border-emerald-500/40 p-5 flex flex-col gap-4 relative">
                {renderTableCard(tables.find(t => t.id === focusedTableId) || tables[0], true)}
              </div>
              {/* Thumbnails on the side */}
              <div className="md:col-span-3 flex flex-col gap-2">
                {tables.map((t) => (
                  <button
                    key={t.id}
                    id={`thumb-table-${t.id}`}
                    onClick={() => setFocusedTableId(t.id)}
                    className={`p-3 bg-zinc-900 text-left rounded-lg border flex flex-col gap-1 transition-all ${
                      focusedTableId === t.id 
                        ? "border-emerald-500 bg-emerald-950/10" 
                        : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-mono font-bold text-zinc-300 truncate w-32">{t.tableName}</span>
                      {t.actionRequired && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-zinc-500">Mão:</span>
                      <div className="flex gap-0.5">
                        {renderMiniCard(t.heroCards[0])}
                        {renderMiniCard(t.heroCards[1])}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : layout === "cascade" ? (
            /* CASCADE LAYOUT (Overlapping offset containers) */
            tables.map((t, idx) => {
              const baseOffset = 30;
              const isFocused = focusedTableId === t.id;
              
              return (
                <div
                  key={t.id}
                  id={`cascade-table-${t.id}`}
                  onClick={() => setFocusedTableId(t.id)}
                  className={`absolute left-0 right-0 max-w-lg bg-zinc-900/95 border rounded-xl p-4 shadow-2xl transition-all cursor-pointer ${
                    isFocused ? "border-emerald-500 z-30" : "border-zinc-800 opacity-80 z-10"
                  }`}
                  style={{
                    transform: `translate(${idx * baseOffset}px, ${idx * baseOffset}px)`,
                    top: 0
                  }}
                >
                  {renderTableCard(t, false)}
                </div>
              );
            })
          ) : (
            /* TILED LAYOUT (Grid Side by side) */
            tables.map((t) => {
              const isFocused = focusedTableId === t.id;
              return (
                <div
                  key={t.id}
                  id={`tiled-table-${t.id}`}
                  onClick={() => setFocusedTableId(t.id)}
                  className={`bg-zinc-900/60 rounded-xl border p-4 flex flex-col gap-3 transition-all cursor-pointer ${
                    isFocused 
                      ? "border-emerald-500 shadow-lg shadow-emerald-950/10 bg-zinc-900" 
                      : "border-zinc-800 hover:border-zinc-700/80"
                  }`}
                >
                  {renderTableCard(t, false)}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Global Grinding Metrics & Hotkeys Configuration - Spacer 4 */}
      <section className="lg:col-span-4 flex flex-col gap-5">
        {/* Hotkeys bindings Box */}
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Keyboard className="h-4.5 w-4.5 text-emerald-400" />
              <span className="text-zinc-100 font-sans font-semibold text-sm">Configurador de Teclas</span>
            </div>
            <button
              onClick={handleResetTables}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono rounded hover:text-white"
            >
              Reset Deal
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Comande jogadas ultra rápidas nas mesas de alta velocidade pressionando as teclas simuladoras mapeadas. Selecione uma mesa de foco ao lado e clique nelas.
          </p>

          <div className="flex flex-col gap-3 mt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-zinc-400">DESISTIR (FOLD)</span>
              <input
                id="hk-fold-input"
                type="text"
                maxLength={4}
                value={hotkeyFold}
                onChange={(e) => setHotkeyFold(e.target.value)}
                className="w-16 text-center text-xs font-mono font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-zinc-400">PAGAR / CHECK (CALL)</span>
              <input
                id="hk-call-input"
                type="text"
                maxLength={4}
                value={hotkeyCall}
                onChange={(e) => setHotkeyCall(e.target.value)}
                className="w-16 text-center text-xs font-mono font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-zinc-400">AUMENTAR (RAISE)</span>
              <input
                id="hk-raise-input"
                type="text"
                maxLength={4}
                value={hotkeyRaise}
                onChange={(e) => setHotkeyRaise(e.target.value)}
                className="w-16 text-center text-xs font-mono font-bold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Real-time Alerts Engine Box */}
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Bell className="h-4 w-4 text-emerald-400" />
              <span className="text-zinc-100 font-sans font-semibold text-sm">Disparador de Alertas</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={alertsEnabled} 
                onChange={() => setAlertsEnabled(!alertsEnabled)} 
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-zinc-100"></div>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            {tables.some(t => t.timeRemaining > 0 && t.timeRemaining <= 10) && alertsEnabled && (
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl flex items-start gap-2 text-xs text-red-400 leading-normal animate-pulse">
                <Bell className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-bold">URGÊNTE: Tempo Esgotando!</p>
                  <p className="text-red-400/80 mt-0.5">Mesa Monaco requer ação imediata do Hero. Menos de 10s para fold automático.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-zinc-900 px-3.5 py-2.5 rounded-xl border border-zinc-800/80 text-xs">
              <span className="text-zinc-400">Taxa de Win Esperada:</span>
              <span className="font-bold text-zinc-200">5.8 EvBB / 100</span>
            </div>

            <div className="flex justify-between items-center bg-zinc-900 px-3.5 py-2.5 rounded-xl border border-zinc-800/80 text-xs">
              <span className="text-zinc-400">Decisões Médias / Seg:</span>
              <span className="font-bold text-zinc-200 hover:text-emerald-400 transition-colors">0.82 Jogada/s</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Table renderer helper
  function renderTableCard(table: SimulatedTable, isGiant: boolean) {
    const isTimeout = table.status === "Time Bank!";
    const isHeroAction = table.status === "Ação Hero!";

    return (
      <>
        {/* Table Header block */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-zinc-200 truncate max-w-[200px]">{table.tableName}</span>
          </div>
          {table.actionRequired && (
            <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
              isTimeout ? "bg-red-500 text-white animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {table.status} ({table.timeRemaining}s)
            </span>
          )}
        </div>

        {/* Simulated Poker Table Arena visual representation */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-805/40 relative">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Cartas Hero</span>
            <div className="flex gap-1.5">
              {table.heroCards.map((c, i) => (
                <div key={i} className="transform hover:scale-105 transition-all">
                  {renderMiniCard(c)}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Board Comunitário</span>
            <div className="flex gap-1">
              {table.boardCards.length > 0 ? (
                table.boardCards.map((bc, i) => renderMiniCard(bc))
              ) : (
                <span className="text-[10px] text-zinc-650 italic mt-1.5">Sem Cartas (Pré-Flop)</span>
              )}
            </div>
          </div>
        </div>

        {/* Pot sizing & current action stats */}
        <div className="flex justify-between items-center text-xs bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">POTE TOTAL</span>
            <span className="font-mono font-bold text-zinc-200">${table.potSize.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 block uppercase">A PAGAR</span>
            <span className="font-mono font-bold text-zinc-200">
              {table.currentBet > 0 ? `$${table.currentBet.toFixed(2)}` : "Check livre"}
            </span>
          </div>
        </div>

        {/* Action Logger History lines (only show isGiant) */}
        {(isGiant || layout === "tiled") && (
          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900 text-[10px] text-zinc-400 font-mono flex flex-col gap-1 max-h-[80px] overflow-y-auto">
            {table.historyLog.map((log, idx) => (
              <p key={idx} className="truncate">🏁 {log}</p>
            ))}
          </div>
        )}

        {/* Interactive manual controller buttons */}
        {table.actionRequired ? (
          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              onClick={() => processAction(table.id, "FOLD")}
              className="py-2.5 bg-red-950/25 text-red-400 hover:bg-red-900/30 font-semibold text-xs rounded-xl border border-red-900/20 shadow transition-all cursor-pointer text-center"
            >
              Fold
            </button>
            <button
              onClick={() => processAction(table.id, "CALL/CHECK")}
              className="py-2.5 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-semibold text-xs rounded-xl border border-zinc-700/50 shadow transition-all cursor-pointer text-center"
            >
              {table.currentBet > 0 ? "Call" : "Check"}
            </button>
            <button
              onClick={() => processAction(table.id, "RAISE")}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs rounded-xl shadow shadow-emerald-950/10 transition-all cursor-pointer text-center"
            >
              Raise
            </button>
          </div>
        ) : (
          <div className="py-2.5 bg-zinc-900/25 border border-dashed border-zinc-800 rounded-xl text-center">
            <span className="text-[11px] font-mono text-zinc-500">Mesa Processada ({table.status})</span>
          </div>
        )}
      </>
    );
  }
}
