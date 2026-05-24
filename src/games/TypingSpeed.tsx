import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, Timer, Activity, Percent, Home } from "lucide-react";
import { cn } from "../lib/utils";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";

const TYPING_PROMPTS = [
  // Gaming
  { text: "Level up your skills by completing daily challenges in the arena.", category: "gaming", difficulty: "easy" },
  { text: "The boss fight requires precise timing and expert coordination with your squad.", category: "gaming", difficulty: "medium" },
  { text: "Hidden achievements are scattered throughout the digital landscape of the metaverse.", category: "gaming", difficulty: "medium" },
  
  // Cyberpunk
  { text: "Neon pulses through the cybernetic veins of the city.", category: "cyberpunk", difficulty: "easy" },
  { text: "Hackers navigate through layers of encryption to find the hidden data shards.", category: "cyberpunk", difficulty: "medium" },
  { text: "The rain washed over the electronic billboards reflecting stories of a digital rebellion.", category: "cyberpunk", difficulty: "hard" },

  // AI
  { text: "Artificial intelligence learns from every interaction in the network.", category: "AI", difficulty: "easy" },
  { text: "Neural networks process vast amounts of data to predict future market trends.", category: "AI", difficulty: "medium" },
  { text: "Generative models can create realistic images and text using stochastic gradient descent.", category: "AI", difficulty: "hard" },

  // Space
  { text: "Stars illuminate the dark expanse of the universe.", category: "space", difficulty: "easy" },
  { text: "The astronaut adjusted her suit before stepping onto the dusty surface of Mars.", category: "space", difficulty: "medium" },
  { text: "Supernovae release electromagnetic radiation that can outshine entire galaxies.", category: "space", difficulty: "hard" },

  // Coding
  { text: "Debug the code to fix the syntax error in the main function.", category: "coding", difficulty: "easy" },
  { text: "Responsive web design uses flexible layouts and media queries for better UI.", category: "coding", difficulty: "medium" },
  { text: "Asynchronous programming patterns allow for non-blocking execution in modern applications.", category: "coding", difficulty: "hard" },

  // Motivational
  { text: "Consistency is the key to mastering any difficult skill over time.", category: "motivational", difficulty: "easy" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "motivational", difficulty: "medium" },

  // Futuristic
  { text: "Flying cars and holographic displays are no longer just science fiction.", category: "futuristic", difficulty: "medium" },
  { text: "Teleportation modules will revolutionize global logistics and personal travel in the next century.", category: "futuristic", difficulty: "hard" },
];

import { GameDifficulty } from "../types";

interface TypingSpeedProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const TypingSpeed: React.FC<TypingSpeedProps> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const [currentPrompt, setCurrentPrompt] = useState(TYPING_PROMPTS[Math.floor(Math.random() * TYPING_PROMPTS.length)]);
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [hasReportedResult, setHasReportedResult] = useState(false);
  
  const timerRef = useRef<any>(null);

  const text = currentPrompt.text;

  useEffect(() => {
    if (userInput.length === 1 && !startTime) {
      setStartTime(Date.now());
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    if (userInput.length > 0 && userInput.length === text.length) {
      finishGame();
    }

    calculateStats();
  }, [userInput]);

  useEffect(() => {
    if (isFinished && !hasReportedResult) {
      setHasReportedResult(true);
      
      const difficultyMap: Record<string, GameDifficulty> = {
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard'
      };

      onGameOver?.({
        outcome: accuracy > 70 ? "win" : "loss",
        difficulty: difficultyMap[currentPrompt.difficulty] || "Medium",
        gameSpecificData: { 
            gameId: "typing-speed",
            wpm,
            accuracy,
            maxStreak
        }
      });
    }
  }, [isFinished, accuracy, wpm, maxStreak, hasReportedResult, onGameOver, currentPrompt.difficulty]);

  const calculateStats = () => {
    if (!startTime || userInput.length === 0) return;
    
    // WPM
    const words = userInput.length / 5;
    const minutes = (Date.now() - startTime) / 60000;
    setWpm(Math.round(words / minutes) || 0);

    // Accuracy & Streak
    let errors = 0;
    let currentStreak = 0;
    let localMaxStreak = 0;

    for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === text[i]) {
            currentStreak++;
            localMaxStreak = Math.max(localMaxStreak, currentStreak);
        } else {
            errors++;
            currentStreak = 0;
        }
    }
    
    const acc = Math.max(0, Math.round(((userInput.length - errors) / userInput.length) * 100));
    setAccuracy(isNaN(acc) ? 100 : acc);
    setStreak(currentStreak);
    setMaxStreak(prev => Math.max(prev, localMaxStreak));
  };

  const finishGame = () => {
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => {
    // Select a different prompt than the current one if possible
    let nextPrompt = TYPING_PROMPTS[Math.floor(Math.random() * TYPING_PROMPTS.length)];
    if (TYPING_PROMPTS.length > 1) {
        while (nextPrompt.text === currentPrompt.text) {
            nextPrompt = TYPING_PROMPTS[Math.floor(Math.random() * TYPING_PROMPTS.length)];
        }
    }
    
    setCurrentPrompt(nextPrompt);
    setUserInput("");
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setIsFinished(false);
    setHasReportedResult(false);
    setTimeElapsed(0);
    setStreak(0);
    setMaxStreak(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const progress = (userInput.length / text.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 p-4 md:p-8 w-full max-w-3xl mx-auto relative z-10 overflow-x-hidden">
      {/* Category and Difficulty Badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-[8px] md:text-[10px] font-bold text-neon-cyan uppercase tracking-wider">
          {currentPrompt.category}
        </span>
        <span className={cn(
          "px-3 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider border",
          currentPrompt.difficulty === 'easy' && "bg-green-500/10 border-green-500/30 text-green-500",
          currentPrompt.difficulty === 'medium' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
          currentPrompt.difficulty === 'hard' && "bg-neon-pink/10 border-neon-pink/30 text-neon-pink",
        )}>
          {currentPrompt.difficulty}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
        <div className="glass rounded-xl md:rounded-2xl p-3 md:p-4 text-center group transition-all hover:border-neon-cyan">
          <div className="flex items-center justify-center gap-2 text-neon-cyan mb-1">
            <Activity size={12} className="group-hover:animate-pulse" /> <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-tighter">WPM</span>
          </div>
          <div className="text-xl md:text-2xl font-display font-bold text-white">{wpm}</div>
        </div>
        <div className="glass rounded-xl md:rounded-2xl p-3 md:p-4 text-center group transition-all hover:border-neon-pink">
          <div className="flex items-center justify-center gap-2 text-neon-pink mb-1">
            <Percent size={12} /> <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-tighter">ACC</span>
          </div>
          <div className="text-xl md:text-2xl font-display font-bold text-white">{accuracy}%</div>
        </div>
        <div className="glass rounded-xl md:rounded-2xl p-3 md:p-4 text-center group transition-all hover:border-gray-500">
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
            <Timer size={12} /> <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-tighter">TIME</span>
          </div>
          <div className="text-xl md:text-2xl font-display font-bold text-white">{timeElapsed}s</div>
        </div>
        <div className="glass rounded-xl md:rounded-2xl p-3 md:p-4 text-center group transition-all hover:border-blue-500">
          <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
            <RefreshCcw size={12} className={cn(streak > 5 && "animate-spin-slow")} /> <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-tighter">STRK</span>
          </div>
          <div className="text-xl md:text-2xl font-display font-bold text-white">{streak}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        />
      </div>

      <div className="relative glass rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 min-h-[140px] md:min-h-[180px] w-full text-sm md:text-xl leading-relaxed font-mono overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 opacity-50 pointer-events-none" />
        
        <div className="relative z-10 text-slate-500 break-words select-none text-left">
          {text.split('').map((char, i) => {
            const isCorrect = userInput[i] === char;
            const isTyped = i < userInput.length;
            const isCurrent = i === userInput.length;

            return (
              <span
                key={i}
                className={cn(
                  "transition-all duration-150",
                  isTyped && isCorrect && "text-neon-cyan text-glow",
                  isTyped && !isCorrect && "text-neon-pink bg-neon-pink/10 rounded px-0.5 underline decoration-2",
                  isCurrent && "border-b-2 border-neon-cyan animate-pulse bg-neon-cyan/5"
                )}
              >
                {char}
              </span>
            );
          })}
        </div>
        <textarea
          autoFocus
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-6 sm:p-8 bg-transparent border-none focus:ring-0 text-transparent caret-transparent resize-none outline-none overflow-hidden select-none z-20"
          value={userInput}
          onChange={(e) => !isFinished && setUserInput(e.target.value)}
          disabled={isFinished}
        />
      </div>

      <GameGuide 
        title="Neural Typing Challenge"
        instructions={[
          "Type the displayed characters as quickly and accurately as possible.",
          "The timer starts as soon as you press the first key.",
          "Incorrect characters are highlighted in red neon; correct ones in cyan.",
          "Complete the entire prompt to decrypt the segment and see your performance."
        ]}
        tips={[
          "Accuracy is more important than raw speed; avoid backspacing if possible.",
          "Maintain a steady rhythm for higher WPM consistency.",
          "Build a streak of correct characters to enter 'Unstoppable' mode."
        ]}
      />

      <GameOverOverlay 
        show={isFinished} 
        title="CHALLENGE COMPLETE"
        result={`Performance: ${wpm} WPM | Accuracy: ${accuracy}% | Max Streak: ${maxStreak}`}
        score={`${wpm} WPM`}
        onRestart={reset}
        onExit={() => navigate("/")}
      />

      <div className="flex flex-col items-center gap-2">
        <div className="text-[10px] text-gray-500 font-mono tracking-[0.3em] uppercase text-center">
            {isFinished ? "GREAT WORK!" : startTime ? "MAINTAIN YOUR FOCUS..." : "START TYPING TO BEGIN THE TIMER"}
        </div>
        {streak > 10 && (
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xs font-black text-neon-cyan italic animate-pulse"
            >
                {streak > 20 ? "UNSTOPPABLE!" : "ON FIRE!"}
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default TypingSpeed;
