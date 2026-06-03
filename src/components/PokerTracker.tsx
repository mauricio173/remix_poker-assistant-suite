/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TrendingUp, PlusCircle, Filter, Calendar, Award, Banknote, Clock, Trash } from "lucide-react";
import { PokerSession } from "../types";

interface PokerTrackerProps {
  sessions?: PokerSession[];
  setSessions?: React.Dispatch<React.SetStateAction<PokerSession[]>>;
}

export default function PokerTracker({ sessions: propsSessions, setSessions: propsSetSessions }: PokerTrackerProps) {
  const [localSessions, setLocalSessions] = useState<PokerSession[]>([
    { id: "1", date: "2026-05-28", durationMinutes: 180, buyIn: 100, cashOut: 245, profit: 145, handsPlayed: 1450, stakes: "NL100" },
    { id: "2", date: "2026-05-29", durationMinutes: 120, buyIn: 100, cashOut: 65, profit: -35, handsPlayed: 920, stakes: "NL100" },
    { id: "3", date: "2026-05-30", durationMinutes: 240, buyIn: 100, cashOut: 320, profit: 220, handsPlayed: 2100, stakes: "NL100" },
    { id: "4", date: "2026-06-01", durationMinutes: 154, buyIn: 200, cashOut: 110, profit: -90, handsPlayed: 1150, stakes: "NL200" },
    { id: "5", date: "2026-06-02", durationMinutes: 300, buyIn: 200, cashOut: 480, profit: 280, handsPlayed: 3220, stakes: "NL200" },
  ]);

  const sessions = propsSessions || localSessions;
  const setSessions = propsSetSessions || setLocalSessions;

  // Form Fields
  const [stakes, setStakes] = useState("NL100");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState(120);
  const [handsPlayed, setHandsPlayed] = useState(1000);
  const [profitVal, setProfitVal] = useState(50);
  
  // Table Filters
  const [stakeFilter, setStakeFilter] = useState<string>("ALL");

  // Handler to register session
  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: PokerSession = {
      id: Math.random().toString(),
      date,
      stakes,
      durationMinutes: Number(duration),
      handsPlayed: Number(handsPlayed),
      buyIn: 100, // Normalized
      cashOut: 100 + Number(profitVal),
      profit: Number(profitVal)
    };

    setSessions([newSession, ...sessions]);
    // Reset defaults
    setProfitVal(50);
    setHandsPlayed(1000);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
  };

  // Filtered lists
  const filteredSessions = sessions.filter(s => {
    if (stakeFilter === "ALL") return true;
    return s.stakes === stakeFilter;
  });

  // KPI calculations
  const totalProfit = filteredSessions.reduce((acc, s) => acc + s.profit, 0);
  const totalHands = filteredSessions.reduce((acc, s) => acc + s.handsPlayed, 0);
  const totalMinutes = filteredSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const avgWinrate = totalHands > 0 ? (totalProfit / (totalHands / 100)) : 0; // Simulated Bb/100

  // Generates coordinate points for SVG line area graph
  const getGraphDataAndPaths = () => {
    if (filteredSessions.length === 0) return { linePath: "", fillPath: "", dots: [] };
    
    // Sort chronological first
    const chronological = [...filteredSessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Compute progressive cumulative profit points starting at zero
    let cumulative = 0;
    const historyPoints = [{ x: 0, y: 0, date: "Início" }];
    
    chronological.forEach((s) => {
      cumulative += s.profit;
      historyPoints.push({
        x: 0,
        y: cumulative,
        date: s.date
      });
    });

    // Translate to SVG coordinate bounding box (Canvas size 500w x 200h)
    const padding = 30;
    const chartW = 500 - padding * 2;
    const chartH = 200 - padding * 2;

    const xStep = chartW / (historyPoints.length - 1 || 1);
    
    // Find min and max y values to normalize graph heights
    const yValues = historyPoints.map(p => p.y);
    const minVal = Math.min(...yValues, -100);
    const maxVal = Math.max(...yValues, 500);
    const range = maxVal - minVal;

    const getXCoords = (idx: number) => padding + idx * xStep;
    const getYCoords = (val: number) => {
      const percentage = (val - minVal) / range;
      // Invert Y because SVG coordinates starts 0 at top
      return padding + chartH - (percentage * chartH);
    };

    let linePath = `M ${getXCoords(0)} ${getYCoords(historyPoints[0].y)}`;
    for (let i = 1; i < historyPoints.length; i++) {
      linePath += ` L ${getXCoords(i)} ${getYCoords(historyPoints[i].y)}`;
    }

    // Connect coordinate closure path at bottom of chart for smooth area background filling
    const zeroYCoord = getYCoords(minVal);
    const fillPath = `${linePath} L ${getXCoords(historyPoints.length - 1)} ${padding + chartH} L ${getXCoords(0)} ${padding + chartH} Z`;

    const dots = historyPoints.map((p, idx) => ({
      cx: getXCoords(idx),
      cy: getYCoords(p.y),
      profit: p.y,
      date: p.date
    }));

    return { linePath, fillPath, dots, zeroY: getYCoords(0) };
  };

  const { linePath, fillPath, dots, zeroY } = getGraphDataAndPaths();

  return (
    <div id="poker-tracker-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Session Logger Form & Dashboard KPIs - Span 4 */}
      <section className="lg:col-span-4 flex flex-col gap-5">
        {/* Quick KPI stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-1 text-zinc-500 mb-1">
              <Banknote className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-mono uppercase font-semibold">Lucro Líquido</span>
            </div>
            <span className={`text-sm font-mono font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(2)}
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-1 text-zinc-500 mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase font-semibold">Duração Geral</span>
            </div>
            <span className="text-sm font-mono font-bold text-zinc-200">
              {(totalMinutes / 60).toFixed(1)} hrs
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-1 text-zinc-500 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] font-mono uppercase font-semibold">Mãos Jogadas</span>
            </div>
            <span className="text-sm font-mono font-bold text-zinc-200">
              {totalHands.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-1 text-zinc-500 mb-1">
              <Award className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-[10px] font-mono uppercase font-semibold">BB Médio / 100</span>
            </div>
            <span className="text-sm font-mono font-bold text-zinc-200">
              {(avgWinrate * 10).toFixed(1)} evBB
            </span>
          </div>
        </div>

        {/* Manual Input Registration Block */}
        <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
            <PlusCircle className="h-4.5 w-4.5 text-emerald-400" />
            <h4 className="text-zinc-100 font-sans font-semibold text-sm">Registrar Nova Sessão</h4>
          </div>

          <form onSubmit={handleAddSession} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">DATA DO JOGO</label>
              <div className="relative">
                <input
                  id="reg-session-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">LIMITE / STAKES</label>
                <select
                  id="reg-session-stakes"
                  value={stakes}
                  onChange={(e) => setStakes(e.target.value)}
                  className="w-full text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none"
                >
                  <option value="NL10">NL10 ($0.05/$0.10)</option>
                  <option value="NL50">NL50 ($0.25/$0.50)</option>
                  <option value="NL100">NL100 ($0.50/$1.00)</option>
                  <option value="NL200">NL200 ($1.00/$2.00)</option>
                  <option value="NL500">NL500 ($2.50/$5.00)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">PROFEITO LÍQUIDO ($)</label>
                <input
                  id="reg-session-profit"
                  type="number"
                  value={profitVal}
                  onChange={(e) => setProfitVal(Number(e.target.value))}
                  className="w-full text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none"
                  placeholder="Ex: 150 ou -80"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">MÃOS JOGADAS</label>
                <input
                  id="reg-session-hands"
                  type="number"
                  value={handsPlayed}
                  onChange={(e) => setHandsPlayed(Number(e.target.value))}
                  className="w-full text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none"
                  placeholder="Ex: 850"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">DURAÇÃO (MINUTOS)</label>
                <input
                  id="reg-session-duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 focus:outline-none"
                  placeholder="Ex: 120"
                  required
                />
              </div>
            </div>

            <button
              id="btn-register-session"
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer text-center shadow-md shadow-emerald-950/20 mt-1"
            >
              Confirmar e Anexar Sessão
            </button>
          </form>
        </div>
      </section>

      {/* Interactive visual SVGA Analytics chart & Session Data lists - Span 8 */}
      <section className="lg:col-span-8 bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-zinc-100 font-sans font-semibold text-sm">Análise Gráfica de Profit Acumulado</h3>
          </div>

          {/* Table quick selector stakes filter */}
          <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800 text-[10px] font-mono">
            <button
              id="filter-stake-all"
              onClick={() => setStakeFilter("ALL")}
              className={`px-2 py-1 rounded ${
                stakeFilter === "ALL" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Ver Tudo
            </button>
            <button
              id="filter-stake-nl100"
              onClick={() => setStakeFilter("NL100")}
              className={`px-2 py-1 rounded ${
                stakeFilter === "NL100" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              NL100
            </button>
            <button
              id="filter-stake-nl200"
              onClick={() => setStakeFilter("NL200")}
              className={`px-2 py-1 rounded ${
                stakeFilter === "NL200" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              NL200
            </button>
          </div>
        </div>

        {/* High-Fidelity Custom Area SVG Graph representation */}
        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850 relative">
          <span className="absolute top-3 left-4 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Gráfico de Caixa ($ / Mão)</span>
          {sessions.length > 0 ? (
            <div className="w-full h-52">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                {/* Defs block to supply glowing area linear gradients */}
                <defs>
                  <linearGradient id="glowArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference Grid lines */}
                <line x1="30" y1="30" x2="470" y2="30" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="30" y1="85" x2="470" y2="85" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="30" y1="140" x2="470" y2="140" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="30" y1="170" x2="470" y2="170" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="3,3" />

                {/* Simulated zero limit line */}
                {zeroY > 0 && zeroY < 200 && (
                  <line x1="30" y1={zeroY} x2="470" y2={zeroY} stroke="#374151" strokeWidth="1.2" />
                )}

                {/* Neon Area filling */}
                {fillPath && <path d={fillPath} fill="url(#glowArea)" />}

                {/* Neon coordinate line */}
                {linePath && <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Node Points circles */}
                {dots.map((dot, index) => (
                  <g key={index} className="group">
                    <circle
                      cx={dot.cx}
                      cy={dot.cy}
                      r="4"
                      className="fill-zinc-950 stroke-emerald-400 cursor-pointer hover:r-6 transition-all"
                    />
                    {/* Tiny tooltip placeholder labels on hover */}
                    <text
                      x={dot.cx}
                      y={dot.cy - 10}
                      textAnchor="middle"
                      className="hidden group-hover:block fill-zinc-100 font-mono text-[9px] font-bold bg-zinc-950 px-1 py-0.5 rounded"
                    >
                      ${dot.profit.toFixed(0)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500 font-sans text-xs">
              Sem dados suficientes carregados no filtro de stakes.
            </div>
          )}
        </div>

        {/* Database Grid list representation */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest px-1">Registros de Sessões</span>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-400 border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/60 font-mono text-zinc-500 text-[10px] uppercase">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-2">Stake</th>
                  <th className="py-2.5 px-2">Duração</th>
                  <th className="py-2.5 px-2">Mãos</th>
                  <th className="py-2.5 px-2 text-right">Resultado ($)</th>
                  <th className="py-2.5 px-2 text-right text-zinc-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredSessions.map((session) => (
                  <tr key={session.id} id={`row-session-${session.id}`} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-zinc-200">
                      {session.date}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono rounded">
                        {session.stakes}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono">{session.durationMinutes} min</td>
                    <td className="py-3 px-2 font-mono">{session.handsPlayed.toLocaleString()}</td>
                    <td className={`py-3 px-2 text-right font-mono font-bold ${session.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {session.profit >= 0 ? "+" : ""}${session.profit.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        id={`btn-del-sess-${session.id}`}
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-zinc-600 hover:text-rose-400 p-1.5 transition-all text-center rounded cursor-pointer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-zinc-500 font-sans italic">
                      Nenhuma sessão registrada. Use o formulário à esquerda para adicionar logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
