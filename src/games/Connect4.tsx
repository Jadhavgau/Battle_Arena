import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { RefreshCcw, Home, Users } from "lucide-react";
import { cn } from "../lib/utils";
import socket from "../lib/socket";
import MultiplayerLobby from "../components/games/MultiplayerLobby";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";
import { GameRoom } from "../types";

import { GameDifficulty } from "../types";

interface Connect4Props {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const Connect4: React.FC<Connect4Props> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(6).fill(null).map(() => Array(7).fill(null)));
  const [isRedNext, setIsRedNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [mode, setMode] = useState<"choice" | "multi">("choice");
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myTeam, setMyTeam] = useState<"RED" | "YELLOW" | null>(null);

  const resetGame = () => {
    setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
    setIsRedNext(true);
    setWinner(null);
  };

  useEffect(() => {
    if (mode === "multi" && room) {
      const idx = room.players.findIndex(p => p.id === socket.id);
      setMyTeam(idx === 0 ? "RED" : idx === 1 ? "YELLOW" : null);

      socket.on("game-event", ({ action, data }) => {
        if (action === "connect4-move") {
          applyMove(data.col, data.team);
        }
      });

      socket.on("game-state-update", (newState) => {
        setIsRedNext(newState.activePlayerIdx === 0);
      });

      return () => {
        socket.off("game-event");
        socket.off("game-state-update");
      };
    }
  }, [mode, room]);

  const applyMove = (col: number, team: string) => {
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      for (let row = 5; row >= 0; row--) {
        if (!newBoard[row][col]) {
          newBoard[row][col] = team;
          if (checkWin(row, col, team, newBoard)) {
            setWinner(team);
          }
          break;
        }
      }
      return newBoard;
    });
    if (mode !== "multi") {
      setIsRedNext(!isRedNext);
    }
  };

  const checkWin = (row: number, col: number, player: string, currentBoard: any[][]) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        const nr = row + dr * i;
        const nc = col + dc * i;
        if (nr >= 0 && nr < 6 && nc >= 0 && nc < 7 && currentBoard[nr][nc] === player) count++;
        else break;
      }
      for (let i = 1; i < 4; i++) {
        const nr = row - dr * i;
        const nc = col - dc * i;
        if (nr >= 0 && nr < 6 && nc >= 0 && nc < 7 && currentBoard[nr][nc] === player) count++;
        else break;
      }
      if (count >= 4) return true;
    }
    return false;
  };

  const dropDisc = (col: number) => {
    if (winner) return;
    const currentTeam = isRedNext ? "RED" : "YELLOW";
    
    if (mode === "multi") {
      if (currentTeam !== myTeam) return;
      if (board[0][col]) return; // Column full

      socket.emit("game-action", {
        roomId: room?.id,
        action: "connect4-move",
        data: { col, team: currentTeam }
      });
    }

    applyMove(col, currentTeam);
  };

  if (mode === "choice") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-3 italic">Gravity Clash</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Select Engagement Type</p>
        </div>
        <button 
          onClick={() => setMode("multi")}
          className="w-full max-w-sm bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] text-left group hover:border-neon-cyan/40 hover:bg-slate-900 transition-all shadow-2xl shadow-neon-cyan/5"
        >
          <div className="w-12 h-12 bg-neon-cyan/10 rounded-2xl flex items-center justify-center mb-6 border border-neon-cyan/20 group-hover:scale-110 transition-transform">
            <Users className="text-neon-cyan" size={24} />
          </div>
          <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">Network Duel</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-relaxed">Challenge friends in real-time gravity-based combat.</p>
        </button>
      </div>
    );
  }

  if (mode === "multi" && !room) {
    return <MultiplayerLobby gameId="connect-4" onGameStart={setRoom} />;
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8 p-4 md:p-8 w-full max-w-7xl mx-auto overflow-hidden">
      <div className="lg:col-span-3 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h2 className={cn(
            "text-2xl md:text-3xl font-display font-black uppercase italic tracking-tighter",
            winner ? (winner === "RED" ? "text-red-500 shadow-glow-red" : "text-yellow-500 shadow-glow-yellow") : (isRedNext ? "text-red-500" : "text-yellow-500")
          )}>
            {winner ? `${winner} VICTORY` : (isRedNext ? "RED'S TURN" : "YELLOW'S TURN")}
          </h2>
          {mode === 'multi' && (
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">
              YOU ARE: <span className={myTeam === 'RED' ? 'text-red-500' : 'text-yellow-500'}>{myTeam || "SPECTATING"}</span>
            </p>
          )}
        </div>

        <div className="bg-blue-700/80 p-3 md:p-6 rounded-[2rem] border-4 md:border-8 border-blue-900 shadow-2xl relative group w-full max-w-[min(100%,80vh)] aspect-[7/6] flex flex-col backdrop-blur-xl">
          {/* Drop controls */}
          <div className="grid grid-cols-7 gap-1 md:gap-3 mb-2 px-1">
            {board[0].map((_, col) => (
              <button
                key={col}
                disabled={!!winner || (mode === 'multi' && (isRedNext ? "RED" : "YELLOW") !== myTeam)}
                onClick={() => dropDisc(col)}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-lg md:rounded-xl bg-blue-800/50 hover:bg-white/20 text-white transition-all transform active:scale-90",
                  (mode === 'multi' && (isRedNext ? "RED" : "YELLOW") !== myTeam) && "cursor-not-allowed opacity-20"
                )}
              >
                <div className="w-1.5 h-4 bg-white/30 rounded-full" />
              </button>
            ))}
          </div>

          {/* The Grid */}
          <div className="grid grid-cols-7 grid-rows-6 gap-1 md:gap-3 flex-1 px-1 pb-1">
            {board.map((row, i) => (
              <React.Fragment key={i}>
                {row.map((cell, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={cn(
                      "aspect-square rounded-full border-2 md:border-4 border-blue-950 shadow-inner flex items-center justify-center transition-all duration-500 relative z-10 overflow-hidden",
                      cell === "RED" ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : 
                      cell === "YELLOW" ? "bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]" : 
                      "bg-[#020305]/60"
                    )}
                  >
                    {cell && (
                      <motion.div 
                        initial={{ y: -300 }}
                        animate={{ y: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="w-full h-full rounded-full border-2 border-white/20"
                      />
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <GameGuide 
          title="Connect 4 Tactics"
          instructions={[
            "Players take turns dropping colored discs into any of the seven columns.",
            "Align 4 discs horizontally, vertically, or diagonally to win.",
            "Gravity ensures discs occupy the lowest available slot."
          ]}
          tips={[
            "Control the center column (the 4th column) for maximum reach.",
            "Always block an opponent's vertical sequence of 3 immediately.",
            "Multiplayer mode requires strict turn synchronization."
          ]}
        />
        
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
           <h4 className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-4">Signal Status</h4>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Gravity Link Active</span>
           </div>
        </div>
      </div>

      <GameOverOverlay 
        show={!!winner} 
        title="BATTLE CONCLUDED"
        result={winner === "RED" ? "Red Team Dominance Established" : "Yellow Team Tactical Overmatch"}
        score={winner ? "VICTORY" : "DRAW"}
        onRestart={resetGame}
        onExit={() => navigate("/")}
      />
    </div>
  );
};


export default Connect4;
