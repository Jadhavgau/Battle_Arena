import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RotateCcw, Home } from "lucide-react";
import { cn } from "../lib/utils";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";

const COLORS = ["blue", "red", "green", "yellow"];
const COLOR_CLASSES = {
  blue: "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]",
  red: "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
  green: "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]",
  yellow: "bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]",
};

import { GameDifficulty } from "../types";

interface SimonSaysProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const SimonSays: React.FC<SimonSaysProps> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const [sequence, setSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasReportedResult, setHasReportedResult] = useState(false);

  const startNextLevel = useCallback((currentSequence: string[]) => {
    const nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newSequence = [...currentSequence, nextColor];
    setSequence(newSequence);
    setUserSequence([]);
    showSequence(newSequence);
  }, []);

  const showSequence = async (seq: string[]) => {
    setIsShowingSequence(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setActiveColor(seq[i]);
      // Play sound here if assets available
      await new Promise(resolve => setTimeout(resolve, 300));
      setActiveColor(null);
    }
    setIsShowingSequence(false);
  };

  const handleColorClick = (color: string) => {
    if (isShowingSequence || gameOver || !isPlaying) return;

    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);

    // Check progress
    const currentStep = newUserSequence.length - 1;
    if (color !== sequence[currentStep]) {
      setGameOver(true);
      setIsPlaying(false);
      return;
    }

    // Level complete
    if (newUserSequence.length === sequence.length) {
      setScore(s => s + 1);
      setTimeout(() => startNextLevel(sequence), 1000);
    }
  };

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setHasReportedResult(false);
    startNextLevel([]);
  };

  useEffect(() => {
    if (gameOver && !hasReportedResult) {
      setHasReportedResult(true);
      onGameOver?.({
        outcome: score > 5 ? "win" : "loss",
        difficulty: score > 15 ? "Extreme" : score > 10 ? "Hard" : score > 5 ? "Medium" : "Easy",
        gameSpecificData: { gameId: "simon-says", score }
      });
    }
  }, [gameOver, score, hasReportedResult, onGameOver]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm p-4">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Current Level</div>
        <div className="text-4xl font-display font-bold text-white">{score + 1}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-[min(80vw,400px)] aspect-square relative z-10 transition-all">
        {COLORS.map(color => (
          <button
            key={color}
            disabled={isShowingSequence || gameOver || !isPlaying}
            onClick={() => handleColorClick(color)}
            className={cn(
              "w-full h-full rounded-[2rem] transition-all duration-200 border-4 border-black/20 opacity-40 transform active:scale-95 shadow-xl",
              COLOR_CLASSES[color as keyof typeof COLOR_CLASSES],
              activeColor === color && "opacity-100 scale-105 brightness-125 z-20 shadow-glow",
              isShowingSequence && "cursor-default"
            )}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 w-full">
        {!isPlaying && !gameOver && (
          <button
            onClick={startGame}
            className="bg-white text-black font-bold h-14 rounded-2xl flex items-center justify-center gap-2 hover:bg-neon-cyan hover:scale-105 transition-all shadow-xl"
          >
            <Play size={20} fill="currentColor" /> START MISSION
          </button>
        )}
      </div>

      <GameGuide 
        title="Pattern Recognition Protocol"
        instructions={[
          "Observe the sequence of blinking colors shown by the system.",
          "Repeat the sequence by tapping the colors in the same order.",
          "One new color is added to the sequence after each successful level.",
          "A single mistake results in memory link failure."
        ]}
        tips={[
          "Assign sounds or mental labels (numbers/names) to colors to help memorize.",
          "Focus exclusively on the grid during the 'Prepare' phase.",
          "Build a rhythm as you repeat the sequences."
        ]}
      />

      <GameOverOverlay 
        show={gameOver} 
        title="MISSION FAILED"
        result="Memory Link Overload: Sequence Mismatch"
        score={score}
        onRestart={startGame}
        onExit={() => navigate("/")}
      />

      <div className="mt-4 text-[10px] text-gray-500 font-mono tracking-widest uppercase text-center max-w-[200px]">
        {isShowingSequence ? "PREPARE TO MEMORIZE..." : isPlaying ? "REPEAT THE SEQUENCE!" : "TEST YOUR MEMORY REFLEXES"}
      </div>
    </div>
  );
};


export default SimonSays;
