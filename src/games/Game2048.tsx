import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, Home } from "lucide-react";
import { cn } from "../lib/utils";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";

const GRID_SIZE = 4;

import { GameDifficulty } from "../types";

interface Game2048Props {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const Game2048: React.FC<Game2048Props> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<(number | null)[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasReportedResult, setHasReportedResult] = useState(false);

  const spawnTile = useCallback((currentBoard: (number | null)[][]) => {
    const emptyTiles = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!currentBoard[r][c]) emptyTiles.push({ r, c });
      }
    }
    if (emptyTiles.length === 0) return currentBoard;

    const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  const resetGame = useCallback(() => {
    let initialBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    initialBoard = spawnTile(initialBoard);
    initialBoard = spawnTile(initialBoard);
    setBoard(initialBoard);
    setScore(0);
    setGameOver(false);
    setHasReportedResult(false);
  }, [spawnTile]);

  useEffect(() => {
    if (gameOver && !hasReportedResult) {
      setHasReportedResult(true);
      onGameOver?.({
        outcome: score > 2000 ? "win" : "loss",
        difficulty: score > 5000 ? "Extreme" : score > 2048 ? "Hard" : "Medium",
        gameSpecificData: { gameId: "2048", score }
      });
    }
  }, [gameOver, score, hasReportedResult, onGameOver]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;

    let moved = false;
    let newScore = score;
    let newBoard = board.map(row => [...row]);

    const rotate = (board: (number | null)[][]) => {
      const rotated = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            rotated[c][GRID_SIZE - 1 - r] = board[r][c];
        }
      }
      return rotated;
    };

    // Normalize to left move
    let rotations = 0;
    if (direction === 'up') rotations = 3;
    else if (direction === 'right') rotations = 2;
    else if (direction === 'down') rotations = 1;

    for (let i = 0; i < rotations; i++) newBoard = rotate(newBoard);

    for (let r = 0; r < GRID_SIZE; r++) {
      let row = newBoard[r].filter(val => val !== null) as number[];
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          newScore += row[i];
          row.splice(i + 1, 1);
          moved = true;
        }
      }
      const filledRow = [...row, ...Array(GRID_SIZE - row.length).fill(null)];
      if (JSON.stringify(newBoard[r]) !== JSON.stringify(filledRow)) moved = true;
      newBoard[r] = filledRow;
    }

    // De-normalize
    for (let i = 0; i < (4 - rotations) % 4; i++) newBoard = rotate(newBoard);

    if (moved) {
      const withSpawn = spawnTile(newBoard);
      setBoard(withSpawn);
      setScore(newScore);
      
      // Check game over
      const checkGameOver = (b: (number | null)[][]) => {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (b[r][c] === null) return false;
                if (c < GRID_SIZE - 1 && b[r][c] === b[r][c + 1]) return false;
                if (r < GRID_SIZE - 1 && b[r][c] === b[r + 1][c]) return false;
            }
        }
        return true;
      };
      
      if (checkGameOver(withSpawn)) setGameOver(true);
    }
  }, [board, score, gameOver, spawnTile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('up');
      else if (e.key === 'ArrowDown') move('down');
      else if (e.key === 'ArrowLeft') move('left');
      else if (e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const colors: Record<number, string> = {
    2: "bg-slate-800 text-white",
    4: "bg-slate-700 text-white",
    8: "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40",
    16: "bg-neon-cyan/40 text-white border-neon-cyan/60",
    32: "bg-neon-purple/20 text-neon-purple border-neon-purple/40",
    64: "bg-neon-purple/40 text-white border-neon-purple/60",
    128: "bg-neon-pink/20 text-neon-pink border-neon-pink/40 shadow-glow-pink",
    256: "bg-neon-pink/40 text-white border-neon-pink/60 shadow-glow-pink",
    512: "bg-yellow-500/20 text-yellow-500 border-yellow-500/40 shadow-glow",
    1024: "bg-yellow-500/40 text-white border-yellow-500/60 shadow-glow",
    2048: "bg-white text-slate-900 shadow-[0_0_30px_#fff]",
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6 py-4 w-full max-w-sm animate-in fade-in duration-500">
      <div className="flex justify-between w-full h-20 items-center">
        <div className="text-center group">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1 group-hover:text-neon-cyan transition-colors">NET SCORE</div>
          <div className="text-3xl font-display font-black text-white text-glow shadow-neon-cyan/20">{score}</div>
        </div>
        <button 
            onClick={resetGame} 
            className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 active:scale-90"
        >
          <RefreshCcw size={20} className="text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <div className="bg-slate-900/60 p-4 rounded-3xl border-4 border-slate-800 shadow-2xl w-full aspect-square grid grid-cols-4 gap-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 pointer-events-none" />
        {board.flat().map((val, i) => (
          <AnimatePresence key={i} mode="wait">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-full h-full rounded-xl flex items-center justify-center font-display font-black text-xl transition-all duration-300 border border-transparent",
                val ? (colors[val as number] || "bg-neon-cyan text-slate-900") : "bg-slate-800/40 shadow-inner"
              )}
            >
              <span className={cn(val && val >= 1024 ? "text-lg" : "")}>{val || ""}</span>
            </motion.div>
          </AnimatePresence>
        ))}
      </div>

      <GameGuide 
        title="2048 Merge Protocol"
        instructions={[
          "Use Arrow Keys to shift all tiles on the grid in a chosen direction.",
          "Tiles with the same value merge into one when they collide.",
          "The goal is to merge tiles until you reach the 2048 unit.",
          "Game ends when the grid is full and no more merges are possible."
        ]}
        tips={[
          "Try to keep your highest value tile in one of the corners.",
          "Build a chain of descending values next to your highest tile.",
          "Avoid shifting tiles upwards if your high tile is at the bottom."
        ]}
      />

      <GameOverOverlay 
        show={gameOver} 
        title="MAX CAPACITY"
        result="Neural Grid Saturated: Maximum Complexity Attained"
        score={score}
        onRestart={resetGame}
        onExit={() => navigate("/")}
      />
    </div>
  );
};


export default Game2048;
