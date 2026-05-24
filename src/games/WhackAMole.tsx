import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, Trophy, Home } from "lucide-react";
import { cn } from "../lib/utils";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";

import { GameDifficulty } from "../types";

interface WhackAMoleProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const WhackAMole: React.FC<WhackAMoleProps> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [moles, setMoles] = useState(Array(9).fill(false));
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hasReportedResult, setHasReportedResult] = useState(false);
  
  const timerRef = useRef<any>(null);
  const moleTimerRef = useRef<any>(null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsGameActive(true);
    setGameOver(false);
    setHasReportedResult(false);
    setMoles(Array(9).fill(false));
  };

  useEffect(() => {
    if (gameOver && !hasReportedResult) {
      setHasReportedResult(true);
      onGameOver?.({
        outcome: score > 50 ? "win" : "loss",
        difficulty: score > 150 ? "Hard" : score > 80 ? "Medium" : "Easy",
        gameSpecificData: { gameId: "whack-a-mole", score }
      });
    }
  }, [gameOver, score, hasReportedResult, onGameOver]);

  useEffect(() => {
    if (isGameActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      moleTimerRef.current = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * 9);
        setMoles(prev => {
          const newMoles = [...prev];
          newMoles[randomIndex] = true;
          return newMoles;
        });
        
        setTimeout(() => {
          setMoles(prev => {
            const newMoles = [...prev];
            newMoles[randomIndex] = false;
            return newMoles;
          });
        }, 800);
      }, 600);
    } else if (timeLeft === 0) {
      setIsGameActive(false);
      setGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleTimerRef.current) clearInterval(moleTimerRef.current);
    };
  }, [isGameActive, timeLeft]);

  const whackMole = (index: number) => {
    if (moles[index]) {
      setScore(s => s + 10);
      setMoles(prev => {
        const newMoles = [...prev];
        newMoles[index] = false;
        return newMoles;
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 p-6 py-12 w-full max-w-xl animate-in fade-in duration-500">
      <div className="flex justify-between w-full max-w-sm">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1">Combat Score</div>
          <div className="text-3xl font-display font-black text-white text-glow shadow-neon-cyan/20">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1">Clock</div>
          <div className="text-3xl font-display font-black text-neon-pink text-glow shadow-neon-pink/20">{timeLeft}s</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 w-full aspect-square">
        {moles.map((isUp, i) => (
          <div key={i} className="relative aspect-square">
            <div className="absolute inset-0 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-inner" />
            <div className="absolute inset-x-2 bottom-0 h-4 bg-slate-950 rounded-full blur-md opacity-50" />
            
            <AnimatePresence>
              {isUp && (
                <motion.button
                  key={`mole-${i}`}
                  initial={{ y: 60, scale: 0.5, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: 60, scale: 0.5, opacity: 0 }}
                  onClick={() => whackMole(i)}
                  className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                >
                  <div className="w-[70%] h-[70%] bg-neon-cyan rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_0_30px_rgba(6,182,212,0.6)] border-2 sm:border-4 border-white/20 flex items-center justify-center text-2xl sm:text-4xl">
                    👾
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {!isGameActive && !gameOver && (
        <button
          onClick={startGame}
          className="bg-neon-cyan text-slate-900 font-black text-xs uppercase tracking-widest px-10 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neon-cyan/20"
        >
          Initialize Combat
        </button>
      )}

      <GameGuide 
        title="Whack-A-Mole Tactics"
        instructions={[
          "Moles will randomly appear in one of the nine neural ports.",
          "Tap or click the mole quickly before it retracts to score points.",
          "The session lasts 30 seconds; achieve the highest possible elimination count."
        ]}
        tips={[
          "Focus on the center of the grid to minimize eye and hand movement.",
          "Anticipate the next pop-up; moles appear in rapid succession.",
          "Precision is just as important as speed."
        ]}
      />

      <GameOverOverlay 
        show={gameOver} 
        title="COMBAT COMPLETE"
        result="Target Elimination Protocol Satisfied"
        score={score}
        onRestart={startGame}
        onExit={() => navigate("/")}
      />
    </div>
  );
};


export default WhackAMole;
