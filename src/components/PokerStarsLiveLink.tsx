/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Folder, Play, Pause, RefreshCw, CheckCircle, Info, FileText, AlertTriangle, PlayCircle } from "lucide-react";
import { parsePokerStarsHand, SIMULATED_HANDS_DATABASE, ParsedLiveHand } from "../utils/pokerStarsParser";
import { OpponentStats, PokerSession } from "../types";

interface PokerStarsLiveLinkProps {
  onHandUpdate: (parsed: ParsedLiveHand) => void;
  onOpponentAction: (name: string, actionType: string) => void;
  onSessionComplete: (profit: number, handsCount: number, stakes: string) => void;
  opponents: OpponentStats[];
  connMode: "none" | "simulated" | "real";
  setConnMode: (mode: "none" | "simulated" | "real") => void;
}

export default function PokerStarsLiveLink({
  onHandUpdate,
  onOpponentAction,
  onSessionComplete,
  opponents,
  connMode,
  setConnMode
}: PokerStarsLiveLinkProps) {
  const [directoryName, setDirectoryName] = useState<string>("");
  const [isReadingReal, setIsReadingReal] = useState(false);
  const [pollingLogs, setPollingLogs] = useState<string[]>([]);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  // Simulation State
  const [simIndex, setSimIndex] = useState(0);
  const [simPlaying, setSimPlaying] = useState(false);
  const [simLineIndex, setSimLineIndex] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const realTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dirHandleRef = useRef<any>(null);
  const fileTrackerRef = useRef<Record<string, number>>({}); // tracks last read sizes of files
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLines]);

  const addTerminalLog = (msg: string) => {
    setTerminalLines(prev => [...prev.slice(-30), msg]);
  };

  /**
   * REAL MODE: Polls the directory using Web File System Access
   */
  const handleConnectDirectory = async () => {
    try {
      addTerminalLog("⚡ Solicitando permissão da API File System Access...");
      const handle = await (window as any).showDirectoryPicker();
      dirHandleRef.current = handle;
      setDirectoryName(handle.name);
      setConnMode("real");
      setIsReadingReal(true);
      fileTrackerRef.current = {};
      addTerminalLog(`✔ Conectado à pasta: "${handle.name}". Iniciando escuta em tempo real...`);
      startRealListening();
    } catch (err: any) {
      console.warn("Directory Picker error or denied", err);
      addTerminalLog(`❌ Erro ou Acesso Negado: ${err.message || err}`);
      addTerminalLog("💡 Sugestão: Use o 'Modo Simulador' abaixo para testar o HUD em tempo real.");
    }
  };

  const startRealListening = () => {
    if (realTimerRef.current) {
      clearInterval(realTimerRef.current);
    }

    realTimerRef.current = setInterval(async () => {
      if (!dirHandleRef.current) return;
      try {
        let latestFileHandle: any = null;
        let latestMTime = 0;

        for await (const entry of dirHandleRef.current.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".txt")) {
            const file = await entry.getFile();
            if (file.lastModified > latestMTime) {
              latestMTime = file.lastModified;
              latestFileHandle = entry;
            }
          }
        }

        if (latestFileHandle) {
          const file = await latestFileHandle.getFile();
          const lastSize = fileTrackerRef.current[latestFileHandle.name] || 0;

          if (file.size > lastSize) {
            const text = await file.text();
            // Store size to only parse additions
            fileTrackerRef.current[latestFileHandle.name] = file.size;

            addTerminalLog(`📂 Modificação detectada em "${latestFileHandle.name}" (Tamanho: ${file.size} bytes)`);
            
            // Extract the last parsed hand history chunk
            const chunks = text.split(/PokerStars Hand /i);
            if (chunks.length > 1) {
              const lastHandBlock = "PokerStars Hand " + chunks[chunks.length - 1];
              const parsedResult = parsePokerStarsHand(lastHandBlock);
              onHandUpdate(parsedResult);

              // Process actions inside opponents stats
              processOpponentsVpipStats(lastHandBlock);

              addTerminalLog(`✔ Mão ${parsedResult.handId} importada do arquivo. Pote: $${parsedResult.potSize}`);
            }
          }
        }
      } catch (err: any) {
        console.error("Error polling folder files", err);
      }
    }, 2000);
  };

  /**
   * SIMULATED MODE: Ticks through sample Hand Histories
   */
  const handleStartSimulation = () => {
    setConnMode("simulated");
    setSimPlaying(true);
    setSimLineIndex(0);
    setSimIndex(0);
    setTerminalLines([]);
    addTerminalLog("🚀 Simulador do PokerStars Live iniciado...");
    addTerminalLog("👾 Assistindo logs de Hand History preenchendo...");
  };

  // Simulated streaming timer logic
  useEffect(() => {
    if (connMode !== "simulated" || !simPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const activeHandText = SIMULATED_HANDS_DATABASE[simIndex % SIMULATED_HANDS_DATABASE.length];
      const lines = activeHandText.split("\n");

      if (simLineIndex < lines.length) {
        const currentLine = lines[simLineIndex];
        setTerminalLines(prev => [...prev.slice(-25), `[Mesa Live] ${currentLine}`]);
        setSimLineIndex(prev => prev + 1);

        // Scan the line for actions to update HUD stats live!
        interpretSingleLogLine(currentLine);
      } else {
        // Hand completes, parse full block
        const parsed = parsePokerStarsHand(activeHandText);
        onHandUpdate(parsed);

        // trigger tracker profit append if Hero wins!
        if (parsed.winnerName === "Hero" && parsed.wonAmount) {
          onSessionComplete(parsed.wonAmount - 10, 1, parsed.stakes || "NL100");
          addTerminalLog(`🏆 Hero coletou $${parsed.wonAmount} do Pote! Registrado no Rastreador.`);
        } else if (parsed.winnerName) {
          onSessionComplete(-10, 1, parsed.stakes || "NL100");
          addTerminalLog(`💸 ${parsed.winnerName} coletou o Pote. Hero foldou/perdeu a mão.`);
        }

        addTerminalLog(`👏 Mão finalizada no Simulador. Carregando próxima mão...`);
        
        setSimIndex(prev => prev + 1);
        setSimLineIndex(0);
      }
    }, 1200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connMode, simPlaying, simIndex, simLineIndex]);

  const interpretSingleLogLine = (line: string) => {
    const lineLower = line.toLowerCase();
    
    // Auto incremental triggers for HUD simulation VPIP and actions
    opponents.forEach(opp => {
      if (lineLower.includes(opp.name.toLowerCase())) {
        if (lineLower.includes("raises")) {
          onOpponentAction(opp.name, "raise");
        } else if (lineLower.includes("calls") || lineLower.includes("posts")) {
          onOpponentAction(opp.name, "call");
        } else if (lineLower.includes("folds")) {
          onOpponentAction(opp.name, "fold");
        } else if (lineLower.includes("bets")) {
          onOpponentAction(opp.name, "postflop_bet");
        }
      }
    });
  };

  const processOpponentsVpipStats = (handBlock: string) => {
    const lines = handBlock.split("\n");
    lines.forEach(interpretSingleLogLine);
  };

  // Synchronize internal timers and states when connMode changes (e.g. from global floating disconnect)
  useEffect(() => {
    if (connMode !== "real") {
      setIsReadingReal(false);
      if (realTimerRef.current) {
        clearInterval(realTimerRef.current);
        realTimerRef.current = null;
      }
    }
    if (connMode !== "simulated") {
      setSimPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    if (connMode === "none") {
      addTerminalLog("🔌 Desconectado do scanner. Aguardando novos disparadores.");
    }
  }, [connMode]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (realTimerRef.current) clearInterval(realTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden">
      {/* Decorative linear visual link lines */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 via-teal-500 to-emerald-500"></div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-3 pl-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <RefreshCw className={`h-5 w-5 ${simPlaying || isReadingReal ? "animate-spin" : ""}`} />
          </div>
          <div>
            <h2 className="text-sm font-sans font-black text-zinc-100 flex items-center gap-2">
              CONEXÃO LIVE POKERSTARS™ <span className="text-[9px] bg-blue-600/10 text-blue-400 border border-blue-500/15 px-1.5 py-0.5 rounded font-mono">CLIENT-SIDE FS API</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl font-sans mt-0.5">
              Conecte em tempo real com o seu jogo ativo! Lê automaticamente os arquivos de Logs históricos de mãos e atualiza o seu HUD de rivais, os gráficos e o Solver GTO pós-flop.
            </p>
          </div>
        </div>

        {/* Integration Switch Controls */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 shrink-0">
          <button
            id="btn-conn-pokerstars-real"
            onClick={handleConnectDirectory}
            className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              connMode === "real"
                ? "bg-emerald-600 text-zinc-950 border border-emerald-500"
                : "bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-750"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>{connMode === "real" ? `Pasta: ${directoryName.slice(0, 8)}...` : "Conectar Pasta Local"}</span>
          </button>

          <button
            id="btn-conn-pokerstars-sim"
            onClick={handleStartSimulation}
            className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              connMode === "simulated"
                ? "bg-blue-600 text-white border border-blue-500 shadow"
                : "bg-zinc-805 hover:bg-zinc-750 text-zinc-350 border border-zinc-700/50"
            }`}
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>Simular Fluxo Live</span>
          </button>

          {connMode !== "none" && (
            <button
              id="btn-disconnect-pokerstars"
              onClick={() => {
                setConnMode("none");
                setSimPlaying(false);
                setIsReadingReal(false);
                if (timerRef.current) clearInterval(timerRef.current);
                if (realTimerRef.current) clearInterval(realTimerRef.current);
                addTerminalLog("🔌 Desconectado do scanner. Aguardando novos disparadores.");
              }}
              className="px-2.5 py-2 bg-rose-950/30 text-rose-450 border border-rose-900/40 text-xs rounded-lg hover:bg-rose-900/20 transition-all font-sans font-bold shadow-sm"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>

      {/* Real-time Link Instructions Helper / Active State status banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-1">
        {/* Helper info guide (Column Span 5) */}
        <div className="md:col-span-5 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-850/60 text-xs flex flex-col gap-2.5">
          <h4 className="font-bold text-zinc-300 font-sans flex items-center gap-1.5">
            <Info className="h-4 w-4 text-blue-400" />
            Configurando no seu Computador
          </h4>
          <ol className="list-decimal list-inside text-[11px] text-zinc-400 space-y-1 pl-1 leading-relaxed">
            <li>Abra o software do <strong className="text-zinc-300">PokerStars</strong>.</li>
            <li>Vá em <strong className="text-zinc-300">Settings &gt; Playing History &gt; Hand History</strong>.</li>
            <li>Marque <strong className="text-emerald-400">"Save My Hand History"</strong>.</li>
            <li>Copie o caminho (ex: <code className="text-zinc-300 font-mono select-all">AppDataLocalPokerStarsHandHistory</code>).</li>
            <li>Clique em <strong className="text-zinc-200">"Conectar Pasta Local"</strong> aqui em cima, e dê permissão para ler essa pasta.</li>
          </ol>
          <div className="text-[10px] text-zinc-500 italic flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            Em navegadores com restrições, o Simulador Live provê os mesmos dados em tempo real!
          </div>
        </div>

        {/* Real-time streaming raw hand history terminal console (Column Span 7) */}
        <div className="md:col-span-7 flex flex-col gap-2">
          <div className="flex justify-between items-center px-1 text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
            <span>Terminal de Escuta PokerStars</span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${connMode !== "none" ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"}`}></span>
              Status: {connMode === "real" ? "REAL ACTIVE" : connMode === "simulated" ? "SIMULADO STREAMING" : "OFFLINE"}
            </span>
          </div>

          <div className="h-36 bg-zinc-950 rounded-xl border border-zinc-900/60 p-3 overflow-y-auto font-mono text-[10px] text-zinc-300 flex flex-col gap-1 shadow-inner relative">
            {terminalLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-650 text-center py-6 gap-2">
                <FileText className="h-7 w-7 opacity-20" />
                <p>Nenhum log no terminal. Ative acima um modo de Conexão para iniciar.</p>
              </div>
            ) : (
              <>
                {terminalLines.map((line, idx) => (
                  <p key={idx} className="whitespace-pre-wrap leading-tight text-zinc-400 border-l border-zinc-800 pl-2">
                    {line}
                  </p>
                ))}
                <div ref={terminalBottomRef} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
