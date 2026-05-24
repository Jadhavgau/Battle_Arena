import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { RefreshCcw, Trophy, Play, Home } from "lucide-react";
import { cn } from "../lib/utils";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

import { GameDifficulty } from "../types";

interface SnakeGameProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasReportedResult, setHasReportedResult] = useState(false);
  
  const directionRef = useRef(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: typeof INITIAL_SNAKE) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setHasReportedResult(false);
    setScore(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (gameOver && !hasReportedResult) {
      setHasReportedResult(true);
      onGameOver?.({
        outcome: score > 50 ? "win" : "loss",
        difficulty: score > 300 ? "Hard" : score > 150 ? "Medium" : "Easy",
        gameSpecificData: { gameId: "snake", score }
      });
    }
  }, [gameOver, score, hasReportedResult, onGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          if (directionRef.current.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          if (directionRef.current.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          if (directionRef.current.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          if (directionRef.current.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        head.x += direction.x;
        head.y += direction.y;

        // Collision detection
        if (
          head.x < 0 || head.x >= GRID_SIZE || 
          head.y < 0 || head.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
          setGameOver(true);
          setIsPlaying(false);
          if (score > highscore) setHighscore(score);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];
        
        // Eating food
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, Math.max(100 - Math.floor(score / 50) * 5, 50));
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, direction, food, score, highscore, generateFood]);

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full">
      <div className="flex justify-between w-full max-w-[400px]">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Score</span>
          <span className="text-2xl font-display font-bold text-neon-cyan">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Highscore</span>
          <span className="text-2xl font-display font-bold text-white">{highscore}</span>
        </div>
      </div>

      <div 
        className="relative glass rounded-2xl border border-white/10 shadow-2xl relative z-10"
        style={{ 
          width: "min(90vw, 500px)", 
          height: "min(90vw, 500px)",
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {/* Snake Body */}
        {snake.map((segment, i) => (
          <div
            key={`${i}-${segment.x}-${segment.y}`}
            className={cn(
              "rounded-sm transition-all",
              i === 0 ? "bg-neon-cyan neon-glow-cyan z-10" : "bg-neon-cyan/40"
            )}
            style={{ 
              gridColumnStart: segment.x + 1, 
              gridRowStart: segment.y + 1 
            }}
          />
        ))}

        {/* Food */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="bg-neon-pink rounded-full neon-glow-pink"
          style={{ 
            gridColumnStart: food.x + 1, 
            gridRowStart: food.y + 1 
          }}
        />

        {/* Overlays */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
            <button
              onClick={() => setIsPlaying(true)}
              className="bg-white text-black font-bold px-8 py-3 rounded-full flex items-center gap-2 hover:scale-110 transition-transform"
            >
              <Play size={20} fill="currentColor" /> START GAME
            </button>
          </div>
        )}
      </div>

      <GameGuide 
        title="Serpent Navigation Guide"
        instructions={[
          "Use Arrow Keys (Desktop) or On-Screen Controls (Mobile) to steer the serpent.",
          "Consume the pink neon orbs to grow in length and increase your score.",
          "Avoid colliding with the grid boundaries or the serpent's own body.",
          "Speed increases as your score grows higher."
        ]}
        tips={[
          "Stay near the edges when you're long to maintain open space in the center.",
          "Don't rush for food if it requires a risky or tight turn.",
          "Plan your path a few segments ahead to avoid getting trapped."
        ]}
      />

      <GameOverOverlay 
        show={gameOver} 
        title="GAME OVER"
        result="System Crash: Serpent Containment Failed"
        score={score}
        onRestart={resetGame}
        onExit={() => navigate("/")}
      />

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 mt-4 lg:hidden">
        <div />
        <button onClick={() => direction.y !== 1 && setDirection({ x: 0, y: -1 })} className="p-4 glass rounded-xl bg-white/5 active:bg-neon-cyan/20">↑</button>
        <div />
        <button onClick={() => direction.x !== 1 && setDirection({ x: -1, y: 0 })} className="p-4 glass rounded-xl bg-white/5 active:bg-neon-cyan/20">←</button>
        <button onClick={() => direction.y !== -1 && setDirection({ x: 0, y: 1 })} className="p-4 glass rounded-xl bg-white/5 active:bg-neon-cyan/20">↓</button>
        <button onClick={() => direction.x !== -1 && setDirection({ x: 1, y: 0 })} className="p-4 glass rounded-xl bg-white/5 active:bg-neon-cyan/20">→</button>
      </div>

      <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-4">
        USE ARROW KEYS TO NAVIGATE
      </div>
    </div>
  );
};


export default SnakeGame;
