import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, Dice6, ChevronRight, Users, User, Clock, Home } from "lucide-react";
import { cn } from "../lib/utils";
import socket from "../lib/socket";
import MultiplayerLobby from "../components/games/MultiplayerLobby";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";
import { GameRoom } from "../types";

const SnakesAndLadders: React.FC = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(100).fill(null));
  const [players, setPlayers] = useState<{ id: string; pos: number; color: string }[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [mode, setMode] = useState<"choice" | "multi">("choice");
  const [room, setRoom] = useState<GameRoom | null>(null);

  const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"];

  const resetGame = () => {
    setPlayers(prev => prev.map(p => ({ ...p, pos: 0 })));
    setCurrentPlayerIdx(0);
    setLastRoll(0);
    setWinner(null);
  };

  const snakes: Record<number, number> = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78 };
  const ladders: Record<number, number> = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };

  useEffect(() => {
    if (mode === "multi" && room) {
      const roomPlayers = room.players.map((p, i) => ({
        id: p.id,
        pos: 0,
        color: colors[i % colors.length]
      }));
      setPlayers(roomPlayers);

      if (room.gameState?.activePlayerIdx !== undefined) {
        setCurrentPlayerIdx(room.gameState.activePlayerIdx);
      }

      socket.on("game-event", ({ action, data }) => {
        if (action === "snakes-move") {
          setIsRolling(true);
          setLastRoll(data.roll);
          setTimeout(() => {
            executeMove(data.roll, true, data.isKnockout);
            setIsRolling(false);
          }, 1000);
        }
      });

      socket.on("game-state-update", (newState) => {
        if (newState.activePlayerIdx !== undefined) {
          setCurrentPlayerIdx(newState.activePlayerIdx);
        }
      });

      return () => {
        socket.off("game-event");
        socket.off("game-state-update");
      };
    }
  }, [mode, room]);

  const rollDice = () => {
    if (isRolling || winner) return;
    if (mode === "multi" && room && room.players[currentPlayerIdx]?.id !== socket.id) return;

    setIsRolling(true);
    const roll = Math.floor(Math.random() * 6) + 1;
    setLastRoll(roll);
    
    // Preview move to check for knockout
    const currentPlayer = players[currentPlayerIdx];
    let tentativePos = currentPlayer.pos + roll;
    if (tentativePos > 99) tentativePos = 99;
    
    const actualPos = tentativePos + 1;
    let finalPos = tentativePos;
    if (snakes[actualPos]) finalPos = snakes[actualPos] - 1;
    if (ladders[actualPos]) finalPos = ladders[actualPos] - 1;

    // Check knockout
    const isKnockout = players.some((p, i) => i !== currentPlayerIdx && p.pos === finalPos && finalPos !== 0);

    if (mode === "multi" && room) {
      socket.emit("game-action", {
        roomId: room.id,
        action: "snakes-move",
        data: { roll, isKnockout }
      });
    }

    setTimeout(() => {
      executeMove(roll, false, isKnockout);
      setIsRolling(false);
    }, 1000);
  };

  const executeMove = (roll: number, remote = false, isKnockout = false) => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      const player = newPlayers[currentPlayerIdx];
      if (!player) return prev;
      
      let newPos = player.pos + roll;

      if (newPos >= 99) {
        newPos = 99;
        setWinner(player.id);
      }

      // Check snakes and ladders
      const actualPos = newPos + 1;
      if (snakes[actualPos]) newPos = snakes[actualPos] - 1;
      if (ladders[actualPos]) newPos = ladders[actualPos] - 1;

      // Handle Knockout
      newPlayers.forEach((p, idx) => {
        if (idx !== currentPlayerIdx && p.pos === newPos && newPos !== 0) {
          p.pos = 0; // Send back to start
        }
      });

      player.pos = newPos;
      return newPlayers;
    });

    if (mode !== "multi") {
      // In local mode, if not knockout and not 6, change turn
      // (Simplified logic for local mode to match user requirement)
      if (!isKnockout && roll !== 6) {
        setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
      }
    }
  };

  if (mode === "choice") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-3 italic">Grid Ascent</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Select Engagement Type</p>
        </div>
        <button 
          onClick={() => setMode("multi")}
          className="w-full max-w-sm bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] text-left group hover:border-neon-purple/40 hover:bg-slate-900 transition-all shadow-2xl shadow-neon-purple/5"
        >
          <div className="w-12 h-12 bg-neon-purple/10 rounded-2xl flex items-center justify-center mb-6 border border-neon-purple/20 group-hover:scale-110 transition-transform">
            <Users className="text-neon-purple" size={24} />
          </div>
          <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">Network Duel</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-relaxed">Challenge friends on the 100-cell grid system.</p>
          <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-neon-purple uppercase tracking-widest group-hover:gap-4 transition-all">
            Connect <ChevronRight size={14} />
          </div>
        </button>
      </div>
    );
  }

  if (mode === "multi" && !room) {
    return <MultiplayerLobby gameId="snakes-and-ladders" onGameStart={setRoom} />;
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8 p-4 md:p-8 w-full max-w-7xl mx-auto overflow-hidden">
      {/* Board Container */}
      <div className="lg:col-span-3 flex justify-center items-center">
        <div className="w-full max-w-[min(100%,80vh)] aspect-square border-4 md:border-8 border-slate-800 rounded-[2rem] overflow-hidden relative shadow-2xl bg-slate-900/50 backdrop-blur-xl">
          {/* Snakes and Ladders Connections SVG Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
              <marker id="snake-head" markerWidth="10" markerHeight="10" refX="5" refY="5">
                <circle cx="5" cy="5" r="3" fill="#ef4444" />
              </marker>
              <marker id="ladder-top" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
              </marker>
            </defs>
            {/* Draw Ladders */}
            {Object.entries(ladders).map(([start, end]) => {
              const startIdx = Number(start) - 1;
              const endIdx = Number(end) - 1;
              const startRow = Math.floor(startIdx / 10);
              const startCol = startRow % 2 === 0 ? startIdx % 10 : 9 - (startIdx % 10);
              const endRow = Math.floor(endIdx / 10);
              const endCol = endRow % 2 === 0 ? endIdx % 10 : 9 - (endIdx % 10);
              
              return (
                <line 
                  key={`ladder-${start}`}
                  x1={`${startCol * 10 + 5}%`} y1={`${100 - (startRow * 10 + 5)}%`}
                  x2={`${endCol * 10 + 5}%`} y2={`${100 - (endRow * 10 + 5)}%`}
                  stroke="#22c55e" strokeWidth="4" strokeDasharray="5,3" opacity="0.3"
                />
              );
            })}
            {/* Draw Snakes */}
            {Object.entries(snakes).map(([start, end]) => {
              const startIdx = Number(start) - 1;
              const endIdx = Number(end) - 1;
              const startRow = Math.floor(startIdx / 10);
              const startCol = startRow % 2 === 0 ? startIdx % 10 : 9 - (startIdx % 10);
              const endRow = Math.floor(endIdx / 10);
              const endCol = endRow % 2 === 0 ? endIdx % 10 : 9 - (endIdx % 10);
              
              return (
                <path 
                  key={`snake-${start}`}
                  d={`M ${startCol * 10 + 5} ${100 - (startRow * 10 + 5)} Q ${(startCol + endCol) * 5 + 5} ${100 - (Math.max(startRow, endRow) * 10 + 15)} ${endCol * 10 + 5} ${100 - (endRow * 10 + 5)}`}
                  fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.3"
                  transform="scale(0.01)" // This scales percentage units properly if container is 100x100
                  style={{ vectorEffect: 'non-scaling-stroke' }} // This path drawing is a bit tricky with percentages, simpler to use lines or fixed viewBox
                />
              );
            })}
            {/* Re-simplified lines for stability */}
            {Object.entries(snakes).map(([start, end]) => {
              const startIdx = Number(start) - 1;
              const startRow = Math.floor(startIdx / 10);
              const startCol = startRow % 2 === 0 ? startIdx % 10 : 9 - (startIdx % 10);
              const endIdx = Number(end) - 1;
              const endRow = Math.floor(endIdx / 10);
              const endCol = endRow % 2 === 0 ? endIdx % 10 : 9 - (endIdx % 10);
              return (
                <line 
                  key={`snake-line-${start}`}
                  x1={`${startCol * 10 + 5}%`} y1={`${100 - (startRow * 10 + 5)}%`}
                  x2={`${endCol * 10 + 5}%`} y2={`${100 - (endRow * 10 + 5)}%`}
                  stroke="#ef4444" strokeWidth="4" opacity="0.3"
                />
              );
            })}
          </svg>

          <div className="grid grid-cols-10 h-full w-full relative z-10">
            {Array.from({ length: 100 }, (_, i) => {
            const displayIdx = 99 - i;
            const row = Math.floor(displayIdx / 10);
            const col = row % 2 === 0 ? displayIdx % 10 : 9 - (displayIdx % 10);
            const actualIndex = row * 10 + col;
            
            const isSnakeHead = snakes[actualIndex + 1];
            const isLadderBottom = ladders[actualIndex + 1];

            return (
              <div 
                key={displayIdx} 
                className={cn(
                  "border border-white/5 flex items-center justify-center text-[10px] md:text-[12px] font-black text-slate-700 relative transition-colors duration-500",
                  (row + col) % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"
                )}
              >
                <span className="opacity-20">{actualIndex + 1}</span>
                
                {/* Visual Indicators */}
                {isSnakeHead && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4/5 h-4/5 border-2 border-red-500/20 rounded-full animate-pulse flex items-center justify-center">
                      <span className="text-[8px] text-red-500/40">S</span>
                    </div>
                  </div>
                )}
                {isLadderBottom && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4/5 h-4/5 border-2 border-green-500/20 rounded-lg animate-pulse flex items-center justify-center">
                      <span className="text-[8px] text-green-500/40">L</span>
                    </div>
                  </div>
                )}

                {/* Players pieces */}
                <div className="absolute inset-0 flex items-center justify-center gap-0.5 md:gap-1 flex-wrap p-1">
                  <AnimatePresence>
                    {players.map((p, idx) => p.pos === actualIndex && (
                      <motion.div 
                        key={p.id}
                        layoutId={`player-${p.id}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                          "w-2.5 h-2.5 md:w-5 md:h-5 rounded-full border-2 border-white/40 shadow-xl relative z-10 transition-all", 
                          p.color,
                          currentPlayerIdx === idx && "ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-125 z-20"
                        )} 
                      >
                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            P{idx + 1}
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-6 w-full max-w-sm lg:max-w-xs shrink-0 self-stretch">
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-xl flex-1 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
           <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-6 italic underline underline-offset-8 decoration-white/10">Tactical Control</h3>
           
           <div className="space-y-3 mb-8">
              {players.map((p, i) => {
                const isMyTurn = currentPlayerIdx === i;
                const isMe = mode === 'multi' && p.id === socket.id;
                
                return (
                  <div key={p.id} className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300",
                    isMyTurn ? "bg-white/10 border-white/20 shadow-glow" : "bg-transparent border-transparent opacity-40"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3.5 h-3.5 rounded-full shadow-lg", p.color)} />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest truncate max-w-[100px]">
                          {isMe ? "YOU" : `PLAYER ${i + 1}`}
                        </span>
                        {isMyTurn && <span className="text-[7px] font-black text-neon-cyan animate-pulse tracking-tighter uppercase">ACTIVE TURN</span>}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-neon-cyan bg-neon-cyan/5 px-2 py-1 rounded-md border border-neon-cyan/10">
                      CELL {p.pos + 1}
                    </div>
                  </div>
                );
              })}
           </div>

           <div className="text-center">
              <div className="text-5xl font-display font-black text-white mb-6 bg-slate-950/50 h-28 flex items-center justify-center rounded-[2.5rem] border-2 border-white/5 relative overflow-hidden group">
                 {isRolling ? (
                   <motion.div 
                     animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.1, 1] }} 
                     transition={{ repeat: Infinity, duration: 0.4 }}
                   >
                     <Dice6 className="text-slate-700" size={56} />
                   </motion.div>
                 ) : (
                   <motion.span 
                    key={lastRoll}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-glow drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                   >
                     {lastRoll || "?"}
                   </motion.span>
                 )}
              </div>
              
              <button 
                onClick={rollDice}
                disabled={isRolling || winner !== null || (mode === 'multi' && room?.players[currentPlayerIdx]?.id !== socket.id)}
                className={cn(
                  "w-full h-18 rounded-2xl flex flex-col items-center justify-center gap-1 font-black transition-all shadow-2xl relative overflow-hidden",
                  (isRolling || winner !== null || (mode === 'multi' && room?.players[currentPlayerIdx]?.id !== socket.id)) 
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5" 
                    : "bg-white text-slate-950 hover:scale-[1.02] active:scale-95 hover:shadow-white/10"
                )}
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
                  <Dice6 size={18} /> Cycle Generator
                </div>
                {(mode === 'multi' && room?.players[currentPlayerIdx]?.id !== socket.id) && (
                  <span className="text-[7px] opacity-60 uppercase tracking-widest">Waiting for Opponent</span>
                )}
              </button>
           </div>
        </div>
      </div>

      <GameGuide 
        title="Path Guidance: Grid Ascent"
        instructions={[
          "Roll the dice to navigate from cell 1 to 100.",
          "Climb ladders to skip segments and reach higher tiers faster.",
          "Beware of snakes that will downgrade your position to lower segments.",
          "The first player to reach cell 100 exactly wins the session."
        ]}
        tips={[
          "Always keep an eye on the leading player's position.",
          "Some segments have higher snake density; use caution.",
          "In multiplayer, turn synchronization is key to a smooth experience."
        ]}
        isMultiplayer={mode === 'multi'}
      />

      <GameOverOverlay 
        show={!!winner} 
        title={winner === socket.id ? "VICTORY" : "GAME OVER"}
        result={winner === socket.id ? "Target Segment Reached" : "Enemy Reached Segment 100 First"}
        onRestart={resetGame}
        onExit={() => navigate("/")}
      />
    </div>
  );
};

export default SnakesAndLadders;
