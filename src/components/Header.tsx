/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Spade, Laptop, TrendingUp, Calculator, ShieldCheck, Target } from "lucide-react";
import { PokerSession } from "../types";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sessions?: PokerSession[];
  liveStatusText?: string;
}

export default function Header({ activeTab, setActiveTab, sessions, liveStatusText }: HeaderProps) {
  const navigationItems = [
    { id: "solver", label: "Solucionador GTO", icon: ShieldCheck },
    { id: "equity", label: "Calculadora de Equidade", icon: Calculator },
    { id: "multitasking", label: "Simulador Multitabela", icon: Laptop },
    { id: "tracker", label: "Rastreador de Sessões", icon: TrendingUp },
    { id: "hud", label: "HUD de Oponentes", icon: Target },
  ];

  // Calculate cumulative profit and total hands from sessions list
  const totalProfit = sessions ? sessions.reduce((acc, s) => acc + s.profit, 0) : 1420.50;
  const totalHands = sessions ? sessions.reduce((acc, s) => acc + s.handsPlayed, 0) : 18450;
  const profitSign = totalProfit >= 0 ? "+" : "";

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-50 px-4 py-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Main Header Brand + Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-805 flex items-center justify-center shadow-lg">
              <Spade className="h-6 w-6 text-emerald-400 fill-emerald-500/10" />
            </div>
            <div>
              <h1 className="text-sm font-sans font-black text-zinc-100 tracking-wider flex items-center gap-2">
                POKER PRO SUITE <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/20 uppercase tracking-widest">OS-v4.2.1-PRO</span>
              </h1>
              <p className="text-xs text-zinc-500 font-sans">Estratégias Avançadas, GTO Solvers e Multi-Tabling Simulator</p>
            </div>
          </div>

          {/* Navigation Tab Switcher */}
          <nav className="flex flex-wrap items-center gap-1 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-zinc-800 text-blue-400 border border-zinc-700/60 shadow"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-805/30"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Session Telemetry Board */}
        <div className="flex flex-wrap items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-sans">
                {liveStatusText ? "PokerStars Conectado" : "Sessão Ativa"}
              </span>
            </div>
            <div className="hidden sm:block border-r border-zinc-800 h-8"></div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Net Profit</span>
              <span className={`text-lg font-mono font-black ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {profitSign}${totalProfit.toFixed(2)}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">Mãos Jogadas</span>
              <span className="text-lg font-mono text-zinc-100 font-black">{totalHands.toLocaleString()}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold">GTO Engine</span>
              <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                ONLINE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-zinc-800 rounded text-[10px] font-mono font-bold border border-zinc-700 text-zinc-350 truncate max-w-[150px]">
              {liveStatusText || "6-MAX ZOOM"}
            </div>
            <div className="px-3 py-1.5 bg-blue-600 rounded text-[10px] font-mono font-bold text-white shadow-lg shadow-blue-900/20 tracking-wider">
              {liveStatusText ? "LIVE DEALS WATCHER" : "MULTI-TABLING ACTIVE (4)"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
