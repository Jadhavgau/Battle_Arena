import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, Home } from "lucide-react";
import { cn } from "../lib/utils";
import confetti from "canvas-confetti";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";

const ICONS = ["🎮", "🕹️", "👾", "🚀", "💎", "⭐", "🔥", "🌈"];
const CARDS = [...ICONS, ...ICONS];

import { GameDifficulty } from "../types";

interface MemoryMatchProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const MemoryMatch: React.FC<MemoryMatchProps> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [moves, setMoves] = useState(0);
  const [hasReportedResult, setHasReportedResult] = useState(false);

  const shuffle = (array: string[]) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const resetGame = () => {
    setCards(shuffle([...CARDS]));
    setFlipped([]);
    setSolved([]);
    setMoves(0);
    setDisabled(false);
    setHasReportedResult(false);
  };

  useEffect(() => {
    const isGameOver = solved.length === cards.length && cards.length > 0;
    if (isGameOver && !hasReportedResult) {
      setHasReportedResult(true);
      onGameOver?.({
        outcome: "win", // Always a win if completed
        difficulty: moves < 15 ? "Hard" : moves < 25 ? "Medium" : "Easy",
        gameSpecificData: { gameId: "memory-match", moves }
      });
    }
  }, [solved, cards, moves, hasReportedResult, onGameOver]);

  useEffect(() => {
    resetGame();
  }, []);

  const handleClick = (index: number) => {
    if (disabled || flipped.includes(index) || solved.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      setMoves(m => m + 1);
      
      const [first, second] = newFlipped;
      if (cards[first] === cards[second]) {
        setSolved([...solved, first, second]);
        setFlipped([]);
        setDisabled(false);
        
        if (solved.length + 2 === cards.length) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full max-w-md">
      <div className="flex justify-between w-full mb-2">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Moves</div>
          <div className="text-2xl font-display font-bold text-white">{moves}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Solved</div>
          <div className="text-2xl font-display font-bold text-neon-cyan">{solved.length / 2} / {ICONS.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 w-full aspect-square relative z-10">
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || solved.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={cn(
                "relative w-full h-full rounded-xl transition-all duration-500 preserve-3d cursor-pointer",
                isFlipped ? "[transform:rotateY(180deg)]" : ""
              )}
            >
              {/* Back of card */}
              <div className="absolute inset-0 backface-hidden glass rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/5">
                <div className="w-6 h-6 border-2 border-neon-cyan/20 rounded-lg" />
              </div>
              
              {/* Front of card */}
              <div className={cn(
                "absolute inset-0 backface-hidden [transform:rotateY(180deg)] glass rounded-xl flex items-center justify-center text-3xl",
                solved.includes(i) ? "bg-neon-cyan/20 border-neon-cyan text-glow" : "border-white/20 bg-white/5"
              )}>
                {card}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={resetGame}
        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-3 rounded-xl transition-all font-bold text-sm"
      >
        <RefreshCcw size={18} /> Reset Board
      </button>

      <GameGuide 
        title="Neural Matching Guide"
        instructions={[
          "Tap a card to reveal its underlying symbol.",
          "Find and match two identical icons to solve the node.",
          "Clear the entire grid with as few moves as possible."
        ]}
        tips={[
          "Focus on one corner of the grid first to establish a baseline.",
          "Try to visualize the position of icons you've already seen.",
          "Take your time; there is no timer, only move counts."
        ]}
      />

      <GameOverOverlay 
        show={solved.length === cards.length && cards.length > 0} 
        title="VICTORY"
        result="Neural Nodes Synced: Pattern Match Complete"
        score={`${moves} MOVES`}
        onRestart={resetGame}
        onExit={() => navigate("/")}
      />
    </div>
  );
};


export default MemoryMatch;
