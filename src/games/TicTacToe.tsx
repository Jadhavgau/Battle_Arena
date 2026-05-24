import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, Users, User, Clock, ChevronRight } from "lucide-react";
import socket from "../lib/socket";
import { cn } from "../lib/utils";
import confetti from "canvas-confetti";
import MultiplayerLobby from "../components/games/MultiplayerLobby";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";
import { GameRoom, GameDifficulty } from "../types";

interface TicTacToeProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

type Player = "X" | "O" | null;

const TicTacToe: React.FC<TicTacToeProps> = ({ onGameOver }) => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player | "Draw">(null);
  const [mode, setMode] = useState<"choice" | "single" | "multi">("choice");
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [mySymbol, setMySymbol] = useState<Player>(null);
  const [hasReportedResult, setHasReportedResult] = useState(false);

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : "Draw";
  };

  const handleMove = (index: number, remote = false) => {
    if (board[index] || winner) return;

    if (mode === "multi" && !remote && ((isXNext && mySymbol !== "X") || (!isXNext && mySymbol !== "O"))) {
      return; // Not your turn
    }

    const newBoard = [...board];
    const currentPlayer = isXNext ? "X" : "O";
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinner(result);
      if (result !== "Draw") {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [result === "X" ? "#06b6d4" : "#9333ea"]
        });
      }
    }

    if (mode === "multi" && !remote && room) {
      socket.emit("game-action", {
        roomId: room.id,
        action: "tic-tac-toe-move",
        data: { index, player: currentPlayer }
      });
    }
  };

  // Socket setup for multiplayer
  useEffect(() => {
    if (mode === "multi" && room) {
      socket.on("game-event", ({ action, data }) => {
        if (action === "tic-tac-toe-move") {
          handleMove(data.index, true);
        } else if (action === "tic-tac-toe-reset") {
          resetGame(true);
        }
      });

      // Determine symbol based on order in room
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      setMySymbol(playerIndex === 0 ? "X" : "O");

      return () => {
        socket.off("game-event");
      };
    }
  }, [mode, room, board, isXNext]);

  const resetGame = (remote = false) => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setHasReportedResult(false);

    if (mode === "multi" && !remote && room) {
      socket.emit("game-action", { roomId: room.id, action: "tic-tac-toe-reset" });
    }
  };

  useEffect(() => {
    if (winner && !hasReportedResult) {
      setHasReportedResult(true);
      let outcome: "win" | "loss" | "draw" = "draw";
      
      if (winner === "Draw") {
        outcome = "draw";
      } else if (mode === "single") {
        outcome = "win"; // In single player local, someone always wins
      } else if (mode === "multi") {
        outcome = winner === mySymbol ? "win" : "loss";
      }

      onGameOver?.({
        outcome,
        isMultiplayer: mode === "multi",
        gameSpecificData: { gameId: "tic-tac-toe" }
      });
    }
  }, [winner, mode, mySymbol, hasReportedResult, onGameOver]);

  if (mode === "choice") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-3 italic">System Choice</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Select Engagement Protocol</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl px-4">
           <button 
            onClick={() => setMode("single")}
            className="flex-1 bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-[2rem] text-left group hover:border-neon-cyan/40 hover:bg-slate-900 transition-all"
           >
             <div className="w-12 h-12 bg-neon-cyan/10 rounded-2xl flex items-center justify-center mb-6 border border-neon-cyan/20 group-hover:scale-110 transition-transform">
               <User className="text-neon-cyan" size={24} />
             </div>
             <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">Solo training</h3>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-relaxed">Engage in local combat session against local entities.</p>
             <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-neon-cyan uppercase tracking-widest group-hover:gap-4 transition-all">
               Initialize <ChevronRight size={14} />
             </div>
           </button>

           <button 
            onClick={() => setMode("multi")}
            className="flex-1 bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-[2rem] text-left group hover:border-neon-purple/40 hover:bg-slate-900 transition-all shadow-2xl shadow-neon-purple/5"
           >
             <div className="w-12 h-12 bg-neon-purple/10 rounded-2xl flex items-center justify-center mb-6 border border-neon-purple/20 group-hover:scale-110 transition-transform">
               <Users className="text-neon-purple" size={24} />
             </div>
             <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">Multi-Network</h3>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-relaxed">Establish neural link with remote combatants via secure lobby.</p>
             <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-neon-purple uppercase tracking-widest group-hover:gap-4 transition-all">
               Connect <ChevronRight size={14} />
             </div>
           </button>
        </div>
      </div>
    );
  }

  if (mode === "multi" && !room) {
    return <MultiplayerLobby gameId="tic-tac-toe" onGameStart={setRoom} />;
  }

  return (
    <div className="flex flex-col items-center gap-6 md:gap-10 w-full max-w-2xl px-4 py-8 md:py-12 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex flex-col items-center gap-2 text-center w-full">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <div className={`px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${mode === 'single' ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30' : 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'}`}>
              {mode} Operation
            </div>
            {mode === 'multi' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                <Clock size={10} className="animate-spin-slow" /> Real-time Link
              </div>
            )}
        </div>
        <h2 className={cn(
          "text-2xl md:text-4xl font-display font-black uppercase italic tracking-tighter mb-1 md:mb-2",
          winner ? (winner === "Draw" ? "text-white" : winner === "X" ? "text-neon-cyan" : "text-neon-purple") : "text-white"
        )}>
          {winner ? (
            winner === "Draw" ? "GRID LOCK" : `VICTORY PLAYER ${winner}`
          ) : (
            `Protocol: Active - ${isXNext ? "X" : "O"}`
          )}
        </h2>
        {mode === 'multi' && (
           <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">You are assigned symbol: <span className={cn("text-glow font-bold", mySymbol === 'X' ? 'text-neon-cyan' : 'text-neon-purple')}>{mySymbol}</span></p>
        )}
      </div>

      <div className="relative group w-full flex justify-center">
        {/* Decorative elements */}
        <div className="absolute -inset-4 bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 blur-2xl rounded-3xl group-hover:opacity-100 opacity-0 transition-opacity pointer-events-none" />
        
        <div className="grid grid-cols-3 gap-2 md:gap-4 w-full max-w-[min(90vw,450px)] aspect-square relative z-10 transition-all duration-500">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleMove(i)}
              className={cn(
                "bg-slate-900/40 border-2 border-slate-800 rounded-xl md:rounded-3xl flex items-center justify-center text-3xl md:text-6xl font-display font-black transition-all duration-300 backdrop-blur-sm",
                !cell && !winner && "hover:border-slate-500 hover:bg-slate-900 focus:outline-none active:scale-95 cursor-pointer shadow-lg hover:shadow-neon-cyan/5",
                cell === "X" && "text-neon-cyan text-glow border-neon-cyan/50 bg-neon-cyan/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
                cell === "O" && "text-neon-purple text-glow border-neon-purple/50 bg-neon-purple/5 shadow-[0_0_20px_rgba(147,51,234,0.15)]",
                mode === 'multi' && !cell && !winner && (isXNext ? mySymbol !== 'X' : mySymbol !== 'O') && "cursor-not-allowed border-red-500/20"
              )}
            >
              <AnimatePresence mode="wait">
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -45, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    className="italic text-4xl md:text-7xl"
                    key={cell}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </div>

      <GameGuide 
        title="Tic Tac Toe Strategy"
        instructions={[
          "Match 3 of your symbols (X or O) in a row, column, or diagonal.",
          "Single Player: Practice against local systems.",
          "Multiplayer: Challenge others in real-time network combat."
        ]}
        tips={[
          "Control the center square early for more winning paths.",
          "In multiplayer, watch your opponent's moves carefully.",
          "Anticipate blocks to set up inescapable trap patterns."
        ]}
        isMultiplayer={mode === 'multi'}
      />

      <GameOverOverlay 
        show={!!winner} 
        title={winner === "Draw" ? "GRID LOCK" : (winner === mySymbol ? "VICTORY" : (mySymbol ? "DEFEAT" : `PLAYER ${winner} WINS`))}
        result={winner === "Draw" ? "Protocol: Stalemated" : `Engagement: ${winner === "X" ? "Alpha" : "Omega"} Victory`}
        onRestart={() => resetGame()}
        onExit={() => { setMode("choice"); setRoom(null); }}
      />

      {!winner && mode === 'multi' && (
        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 max-w-sm w-full text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
               {isXNext ? (mySymbol === 'X' ? "YOUR TURN - MAKE YOUR MARK" : "ENEMY TRANSMISSION IN PROGRESS...") : (mySymbol === 'O' ? "YOUR TURN - MAKE YOUR MARK" : "ENEMY TRANSMISSION IN PROGRESS...")}
            </p>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
