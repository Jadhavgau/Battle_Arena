import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dice6, Users, ChevronRight, Trophy, RefreshCcw, Star } from "lucide-react";
import { cn } from "../lib/utils";
import socket from "../lib/socket";
import MultiplayerLobby from "../components/games/MultiplayerLobby";
import GameGuide from "../components/games/GameGuide";
import { GameRoom, GameDifficulty } from "../types";

// Ludo Logic Constants
const BOARD_SIZE = 15;
const SAFE_SQUARES_COORDS = [
  { r: 6, c: 1 }, { r: 8, c: 2 }, { r: 6, c: 6 }, { r: 1, c: 6 },
  { r: 2, c: 8 }, { r: 6, c: 8 }, { r: 8, c: 13 }, { r: 12, c: 6 },
  { r: 13, c: 8 }, { r: 8, c: 8 }, { r: 6, c: 13 }, { r: 1, c: 8 },
  { r: 8, c: 1 }, { r: 13, c: 6 }
];

// Actual Ludo Standard Safe Squares (The 8 specific ones in the circuit)
const STANDARD_SAFE = [
  [6, 2], [1, 6], [2, 8], [6, 12], [8, 12], [13, 8], [12, 6], [8, 2]
];
// Wait, actually I already defined SAFE_SQUARES in the previous turn. Let's stick to a consistent list.
const SAFE_SQUARES = [
  [6, 1], [8, 2], [1, 8], [2, 6], [8, 13], [6, 12], [13, 6], [12, 8]
];

// Revised Safe Squares for better visual mapping (Standard Ludo)
const LUDO_SAFE_SQUARES = [
  [6, 1], [2, 6], [1, 8], [6, 12], [8, 13], [12, 8], [13, 6], [8, 2]
];

// 52-tile circuit path (Row, Col) starting from 6,0 clockwise
const CIRCUIT_PATH = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], 
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], 
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0]
];

// Player-specific paths
const PLAYER_CONFIGS = [
  { // 0: Red
    color: "bg-red-500",
    lightColor: "bg-red-400",
    accentColor: "text-red-500",
    startIdx: 1, // (6,1)
    homeEntryIdx: 51, 
    homePath: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    goal: [7, 6],
    basePositions: [[1, 1], [1, 4], [4, 1], [4, 4]]
  },
  { // 1: Green
    color: "bg-green-500",
    lightColor: "bg-green-400",
    accentColor: "text-green-500",
    startIdx: 14, // (1,8)
    homeEntryIdx: 12,
    homePath: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    goal: [6, 7],
    basePositions: [[1, 10], [1, 13], [4, 10], [4, 13]]
  },
  { // 2: Yellow
    color: "bg-yellow-500",
    lightColor: "bg-yellow-400",
    accentColor: "text-yellow-500",
    startIdx: 27, // (8,13)
    homeEntryIdx: 25,
    homePath: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
    goal: [7, 8],
    basePositions: [[10, 10], [10, 13], [13, 10], [13, 13]]
  },
  { // 3: Blue
    color: "bg-blue-500",
    lightColor: "bg-blue-400",
    accentColor: "text-blue-500",
    startIdx: 40, // (13,6)
    homeEntryIdx: 38,
    homePath: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
    goal: [8, 7],
    basePositions: [[10, 1], [10, 4], [13, 1], [13, 4]]
  }
];

interface Token {
  id: number;
  pIdx: number;
  step: number; // -1: base, 0-51: circuit steps relative to circuit start, 52-56: home path, 57: goal
}

interface LudoProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const Ludo: React.FC<LudoProps> = ({ onGameOver }) => {
  const [tokens, setTokens] = useState<Token[]>(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      pIdx: Math.floor(i / 4),
      step: -1
    }))
  );
  const [lastRoll, setLastRoll] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [isDiceRolled, setIsDiceRolled] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [mode, setMode] = useState<"choice" | "multi">("choice");
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [winners, setWinners] = useState<number[]>([]);
  const [hasReportedResult, setHasReportedResult] = useState(false);

  // Map players to specific colored slots for optimal gameplay balance
  // 2 players: Red & Yellow (Opposite)
  // 3 players: Red, Green, Yellow
  // 4 players: Red, Green, Yellow, Blue
  const activeSlots = useMemo(() => {
    if (!room) return [0, 1, 2, 3];
    const count = room.players.length;
    if (count === 2) return [0, 2];
    if (count === 3) return [0, 1, 2];
    return [0, 1, 2, 3];
  }, [room]);

  // Helper to find which player index in room.players corresponds to a board slot
  const slotToPlayerIdx = useCallback((slot: number) => {
    if (!room) return -1;
    return activeSlots.indexOf(slot);
  }, [room, activeSlots]);

  const playerToSlot = useCallback((pIdx: number) => {
    return activeSlots[pIdx];
  }, [activeSlots]);

  // Check if it's the local player's turn relative to their slot
  const isMyTurn = useMemo(() => {
    if (!room) return true; // Solo/Choice mode
    const myIdxInRoom = room.players.findIndex(p => p.id === socket.id);
    const mySlot = activeSlots[myIdxInRoom];
    return currentPlayer === mySlot;
  }, [room, activeSlots, currentPlayer]);

  const syncState = useCallback((updates: any) => {
    if (mode === "multi" && room) {
      socket.emit("game-action", {
        roomId: room.id,
        action: "ludo-sync",
        data: {
          tokens,
          currentPlayer,
          lastRoll,
          isDiceRolled,
          winners,
          ...updates
        }
      });
    }
  }, [mode, room, tokens, currentPlayer, lastRoll, isDiceRolled, winners]);

  // Handle Game Over Reporting
  useEffect(() => {
    if (winners.length > 0 && !hasReportedResult && mode === "multi" && room) {
      const myIdx = room.players.findIndex(p => p.id === socket.id);
      if (myIdx === -1) return;

      const isMyWin = winners[0] === myIdx;
      // If someone has won and it's not me, and I'm not in winners yet, it's a loss (or at least not a win)
      // For now, let's report "win" if we come first, "loss" if someone else comes first.
      setHasReportedResult(true);
      onGameOver?.({
        outcome: isMyWin ? "win" : "loss",
        isMultiplayer: true,
        gameSpecificData: { gameId: "ludo", rank: winners.indexOf(myIdx) + 1 }
      });
    }
  }, [winners, mode, room, hasReportedResult, onGameOver]);

  // Sync Game State
  useEffect(() => {
    if (mode === "multi" && room) {
      socket.on("game-event", ({ action, data }) => {
        if (action === "ludo-sync") {
          setTokens(data.tokens);
          setCurrentPlayer(data.currentPlayer);
          setLastRoll(data.lastRoll);
          setIsDiceRolled(data.isDiceRolled);
          setWinners(data.winners || []);
        }
      });
      return () => { socket.off("game-event"); };
    }
  }, [mode, room]);

  const canTokenMove = useCallback((token: Token, roll: number) => {
    if (token.step === 57) return false; // Already at goal
    if (token.step === -1) return roll === 6; // Needs a 6 to start
    if (token.step + roll > 57) return false; // Over-reaching goal
    return true;
  }, []);

  const rollDice = () => {
    if (isRolling || isDiceRolled) return;
    if (mode === "multi" && room && !isMyTurn) return;

    setIsRolling(true);
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setLastRoll(roll);
      setIsRolling(false);
      setIsDiceRolled(true);

      // check if any token can move
      const canMove = tokens.some(t => t.pIdx === currentPlayer && canTokenMove(t, roll));
      
      if (!canMove) {
        // No moves possible, skip turn
        setTimeout(() => {
          let nextPlayer = currentPlayer;
          do {
            nextPlayer = (nextPlayer + 1) % 4;
          } while (!activeSlots.includes(nextPlayer) || (winners.includes(nextPlayer) && winners.length < activeSlots.length));
          
          setCurrentPlayer(nextPlayer);
          setIsDiceRolled(false);
          syncState({ currentPlayer: nextPlayer, isDiceRolled: false, lastRoll: roll });
        }, 1000);
      } else {
        syncState({ isDiceRolled: true, lastRoll: roll, lastRollValue: roll });
      }
    }, 1000);
  };

  const moveToken = (token: Token) => {
    if (!isDiceRolled || isRolling) return;
    if (mode === "multi" && room && !isMyTurn) return;
    if (token.pIdx !== currentPlayer) return;
    if (!canTokenMove(token, lastRoll)) return;

    let nextStep = token.step;
    if (nextStep === -1) {
      if (lastRoll === 6) nextStep = 0;
      else return;
    } else {
      nextStep += lastRoll;
    }

    const newTokens = [...tokens];
    const updatedToken = { ...token, step: nextStep };
    
    // Collision Logic (Cutting)
    let extraTurn = lastRoll === 6;
    if (nextStep >= 0 && nextStep < 52) {
      const absPos = (PLAYER_CONFIGS[token.pIdx].startIdx + nextStep) % 52;
      const targetPos = CIRCUIT_PATH[absPos];
      const isSafe = LUDO_SAFE_SQUARES.some(s => s[0] === targetPos[0] && s[1] === targetPos[1]);

      if (!isSafe) {
        newTokens.forEach((t, i) => {
          if (t.pIdx !== token.pIdx && t.step >= 0 && t.step < 52) {
            const otherAbsPos = (PLAYER_CONFIGS[t.pIdx].startIdx + t.step) % 52;
            if (otherAbsPos === absPos) {
              newTokens[i] = { ...t, step: -1 }; // Send back to base
              extraTurn = true; // Cutting gives extra turn
            }
          }
        });
      }
    }

    // Update current token
    const tokenIdx = tokens.findIndex(t => t.id === token.id);
    newTokens[tokenIdx] = updatedToken;
    
    if (nextStep === 57) extraTurn = true; // Reaching goal gives extra turn

    // Check for win
    const playerTokens = newTokens.filter(t => t.pIdx === currentPlayer);
    const allInGoal = playerTokens.every(t => t.step === 57);
    const newWinners = [...winners];
    if (allInGoal && !winners.includes(currentPlayer)) {
      newWinners.push(currentPlayer);
    }

    // Next turn logic
    let nextP = currentPlayer;
    if (!extraTurn || allInGoal) {
      do {
        nextP = (nextP + 1) % 4;
      } while (!activeSlots.includes(nextP) || (newWinners.includes(nextP) && newWinners.length < activeSlots.length));
    }

    setTokens(newTokens);
    setWinners(newWinners);
    setCurrentPlayer(nextP);
    setIsDiceRolled(false);

    syncState({
      tokens: newTokens,
      currentPlayer: nextP,
      isDiceRolled: false,
      winners: newWinners
    });
  };

  const getTokenCoords = (token: Token) => {
    const config = PLAYER_CONFIGS[token.pIdx];
    if (token.step === -1) {
      const baseIdx = token.id % 4;
      return { x: config.basePositions[baseIdx][1], y: config.basePositions[baseIdx][0] };
    }
    if (token.step === 57) {
      return { x: config.goal[1], y: config.goal[0] };
    }
    if (token.step >= 52) {
      const idx = token.step - 52;
      return { x: config.homePath[idx][1], y: config.homePath[idx][0] };
    }
    const absIdx = (config.startIdx + token.step) % 52;
    return { x: CIRCUIT_PATH[absIdx][1], y: CIRCUIT_PATH[absIdx][0] };
  };

  const renderSquare = (r: number, c: number) => {
    const isSafe = LUDO_SAFE_SQUARES.some(s => s[0] === r && s[1] === c);
    const isGoal = r >= 6 && r <= 8 && c >= 6 && c <= 8;
    
    // Determine Square Colors
    let baseStyle = "bg-slate-800/40";
    let innerContent = null;

    // Home Bases (Large squares)
    if (r < 6 && c < 6) baseStyle = "bg-red-500/10 border-red-500/20";
    else if (r < 6 && c > 8) baseStyle = "bg-green-500/10 border-green-500/20";
    else if (r > 8 && c > 8) baseStyle = "bg-yellow-500/10 border-yellow-500/20";
    else if (r > 8 && c < 6) baseStyle = "bg-blue-500/10 border-blue-500/20";

    // Home path specific colors
    if (r === 7 && c > 0 && c < 6) baseStyle = "bg-red-500/30";
    if (c === 7 && r > 0 && r < 6) baseStyle = "bg-green-500/30";
    if (r === 7 && c > 8 && c < 14) baseStyle = "bg-yellow-500/30";
    if (c === 7 && r > 8 && r < 14) baseStyle = "bg-blue-500/30";

    // Start positions
    if (r === 6 && c === 1) baseStyle = "bg-red-500 shadow-[inset_0_0_15px_rgba(255,255,255,0.3)]";
    if (r === 1 && c === 8) baseStyle = "bg-green-500 shadow-[inset_0_0_15px_rgba(255,255,255,0.3)]";
    if (r === 8 && c === 13) baseStyle = "bg-yellow-500 shadow-[inset_0_0_15px_rgba(255,255,255,0.3)]";
    if (r === 13 && c === 6) baseStyle = "bg-blue-500 shadow-[inset_0_0_15px_rgba(255,255,255,0.3)]";

    // Goal triangles
    if (isGoal) {
      baseStyle = "bg-transparent border-none";
      if (r === 7 && c === 7) {
        innerContent = (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-1">
             <div className="bg-red-500 rounded-sm m-0.5" />
             <div className="bg-green-500 rounded-sm m-0.5" />
             <div className="bg-blue-500 rounded-sm m-0.5" />
             <div className="bg-yellow-500 rounded-sm m-0.5" />
          </div>
        );
      } else {
        // Center area has triangles meeting at center
        let triangleClass = "";
        if (r === 6 && c === 7) triangleClass = "border-l-[25px] border-r-[25px] border-b-[25px] border-l-transparent border-r-transparent border-b-green-500/50";
        if (r === 8 && c === 7) triangleClass = "border-l-[25px] border-r-[25px] border-t-[25px] border-l-transparent border-r-transparent border-t-blue-500/50";
        if (r === 7 && c === 6) triangleClass = "border-t-[25px] border-b-[25px] border-r-[25px] border-t-transparent border-b-transparent border-r-red-500/50";
        if (r === 7 && c === 8) triangleClass = "border-t-[25px] border-b-[25px] border-l-[25px] border-t-transparent border-b-transparent border-l-yellow-500/50";
        innerContent = <div className={cn("w-0 h-0", triangleClass)} />;
      }
    }

    if (isSafe && !isGoal) {
      innerContent = (
        <div className="flex items-center justify-center bg-white/5 rounded-full p-1 border border-white/10">
          <Star size={12} className="text-white/60 fill-white/20" />
        </div>
      );
    }

    return (
      <div 
        key={`${r}-${c}`}
        className={cn(
          "relative flex items-center justify-center border-[0.5px] border-white/5 transition-colors duration-500",
          baseStyle
        )}
      >
        {innerContent}
      </div>
    );
  };

  if (mode === "choice") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-in fade-in zoom-in-95">
        <div className="text-center">
            <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-3 italic underline decoration-neon-cyan/50 underline-offset-8">Tactical Quadrant</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Select Engagement Type</p>
        </div>
        <button 
          onClick={() => setMode("multi")}
          className="w-full max-w-sm bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] text-left group hover:border-neon-purple/40 hover:bg-slate-900 transition-all shadow-2xl shadow-neon-purple/5"
        >
          <div className="w-12 h-12 bg-neon-purple/10 rounded-2xl flex items-center justify-center mb-6 border border-neon-purple/20 group-hover:scale-110 transition-transform">
            <Users className="text-neon-purple" size={24} />
          </div>
          <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">Network Duel</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-relaxed">Sync your matrix across the global grid.</p>
          <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-neon-purple uppercase tracking-widest group-hover:gap-4 transition-all">
            Connect <ChevronRight size={14} />
          </div>
        </button>
      </div>
    );
  }

  if (mode === "multi" && !room) {
    return <MultiplayerLobby gameId="ludo" onGameStart={setRoom} />;
  }

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-12 p-6 py-12 animate-in fade-in duration-500 w-full max-w-6xl mx-auto">
       <div className="flex flex-col gap-8 w-full max-w-md lg:max-w-xl">
          <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-display font-black text-white uppercase tracking-tighter italic">Ludo Protocol</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Session Active</p>
                </div>
              </div>
              <div className="text-right">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Room ID</div>
                  <div className="text-xs font-mono font-bold text-neon-cyan">{room?.id}</div>
              </div>
          </div>

          {/* Player Roster */}
          <div className="grid grid-cols-2 gap-3">
              {PLAYER_CONFIGS.map((config, i) => {
                const playerIdx = slotToPlayerIdx(i);
                const p = room?.players[playerIdx];
                if (!p) return null; // Only show active slots
                const isWinner = winners.includes(i);
                return (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between relative overflow-hidden",
                    currentPlayer === i ? "bg-white/5 border-white/20 shadow-glow ring-2 ring-white/10" : "bg-slate-900/40 border-slate-800 opacity-60"
                  )}>
                     <div className="flex items-center gap-3 relative z-10">
                        <div className={cn("w-4 h-4 rounded-md shadow-lg border border-white/20", config.color)} />
                        <div>
                          <div className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[100px]">{p.displayName}</div>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-tighter opacity-70">
                            {config.accentColor.replace('text-', '').toUpperCase()} SECTOR
                          </div>
                          {isWinner && <div className="text-[8px] font-black text-yellow-500 uppercase flex items-center gap-1 mt-0.5"><Trophy size={10} /> Finished #{winners.indexOf(i) + 1}</div>}
                        </div>
                     </div>
                     {currentPlayer === i && !isWinner && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-neon-cyan animate-pulse tracking-tighter bg-neon-cyan/10 px-2 py-1 rounded">ACTIVE</div>
                     )}
                  </div>
                );
              })}
          </div>

          {/* Dice Section */}
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] flex items-center justify-center text-5xl sm:text-6xl font-display font-black text-white shadow-inner relative">
                {isRolling ? (
                  <motion.div 
                    animate={{ 
                      rotate: [0, 90, 180, 270, 360],
                      scale: [1, 1.1, 1]
                    }} 
                    transition={{ repeat: Infinity, duration: 0.4 }}
                  >
                    <Dice6 size={64} className="text-slate-700/50" />
                  </motion.div>
                ) : (
                  <motion.span initial={{ scale: 0.5, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}>
                    {lastRoll}
                  </motion.span>
                )}
              </div>

              <button 
                onClick={rollDice}
                disabled={isRolling || isDiceRolled || (room && !isMyTurn)}
                className={cn(
                  "w-full max-w-xs py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg",
                  (isRolling || isDiceRolled || (room && !isMyTurn))
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                    : "bg-white text-slate-900 hover:scale-105 active:scale-95 shadow-white/5"
                )}
              >
                <Dice6 size={20} />
                {isDiceRolled ? "Select Token" : "Transmit Roll"}
              </button>
              
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] max-w-[200px] text-center leading-relaxed">
                {isDiceRolled ? "Move a token into the matrix sequence." : "Roll to determine your tactical movement range."}
              </p>
          </div>
       </div>

       {/* Ludo Board */}
       <div className="relative aspect-square w-full max-w-[650px] bg-slate-900 border-8 border-slate-800 rounded-[3rem] p-2 shadow-2xl select-none">
          {/* Ludo Board Grid */}
          <div className="absolute inset-0 grid grid-cols-15 grid-rows-15 gap-0.5">
              {Array.from({ length: 15 * 15 }).map((_, i) => {
                const r = Math.floor(i / 15);
                const c = i % 15;
                return renderSquare(r, c);
              })}
          </div>

          {/* Home Base Overlays for Better UI */}
          <div className="absolute inset-0 pointer-events-none">
            {PLAYER_CONFIGS.map((config, i) => {
               const pos = i === 0 ? "top-0 left-0" : i === 1 ? "top-0 right-0" : i === 2 ? "bottom-0 right-0" : "bottom-0 left-0";
               return (
                 <div key={i} className={cn("absolute w-[40%] h-[40%] p-6", pos)}>
                    <div className={cn("w-full h-full rounded-[2rem] border-4 border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden", config.color.replace('500', '600/20'))}>
                        <div className="grid grid-cols-2 grid-rows-2 gap-4">
                           {[0,1,2,3].map(j => (
                             <div key={j} className="w-10 h-10 rounded-full border-2 border-white/5 bg-slate-900/40 shadow-inner" />
                           ))}
                        </div>
                        {/* Corner Accents */}
                        <div className={cn("absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-2xl border-white/20", config.accentColor)} />
                        <div className={cn("absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-2xl border-white/20", config.accentColor)} />
                    </div>
                 </div>
               );
            })}
          </div>

          {/* Tokens Rendering */}
          <AnimatePresence>
            {tokens.map((token) => {
              if (!activeSlots.includes(token.pIdx)) return null; 
              const { x, y } = getTokenCoords(token);
              const isTurn = currentPlayer === token.pIdx && isDiceRolled;
              const canMove = isTurn && canTokenMove(token, lastRoll);
              const config = PLAYER_CONFIGS[token.pIdx];

              return (
                <motion.div
                  key={token.id}
                  layoutId={`token-${token.id}`}
                  initial={false}
                  animate={{
                    left: `${(x / 15) * 100}%`,
                    top: `${(y / 15) * 100}%`,
                    scale: canMove ? [1, 1.15, 1] : 1,
                    zIndex: canMove ? 50 : 20
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 30,
                    scale: { repeat: canMove ? Infinity : 0, duration: 1.2 }
                  }}
                  onClick={() => moveToken(token)}
                  className={cn(
                    "absolute w-[6.66%] h-[6.66%] p-1.5 transition-all",
                    canMove ? "cursor-pointer pointer-events-auto" : "pointer-events-none"
                  )}
                >
                  <div className={cn(
                    "w-full h-full rounded-full border-[3px] shadow-[0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center relative group",
                    config.color,
                    canMove ? "border-white ring-[6px] ring-white/30" : "border-black/30"
                  )}>
                    {/* Inner Token Detail */}
                    <div className="w-[60%] h-[60%] rounded-full border border-white/30 bg-white/10" />
                    <div className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full blur-[1px]" />
                    
                    {/* Shadow underneath */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-black/40 blur-[2px] rounded-full" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Goal Indicators */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[20%] h-[20%] grid grid-cols-2 grid-rows-2">
                  {PLAYER_CONFIGS.map((config, i) => (
                    <div key={i} className={cn("m-1 rounded-xl flex items-center justify-center opacity-60 border border-white/10 shadow-inner", config.color)}>
                        <Trophy size={14} className="text-white/40" />
                    </div>
                  ))}
              </div>
          </div>
       </div>

       <div className="lg:hidden w-full">
          <GameGuide 
            title="Ludo Protocol Intelligence"
            instructions={[
              "Roll a 6 to deploy a token from your base into the matrix.",
              "Move tokens strategically through the circuit to reach the final Goal.",
              "Landing on an opponent's token resets them to base protocol if not on a safe tile.",
              "Stars and starting zones are safe extraction points."
            ]}
            tips={[
              "Rolling a 6 grants an additional tactical turn.",
              "Use multiple tokens to maintain control over safe zones.",
              "Prioritize cutting opponents when they are near their home stretch."
            ]}
            isMultiplayer={true}
          />
       </div>
    </div>
  );
};

export default Ludo;
