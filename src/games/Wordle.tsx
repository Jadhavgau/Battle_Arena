import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, Home, Delete, CornerDownLeft } from "lucide-react";
import { cn } from "../lib/utils";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";

const WORDS = ["ARENA", "CYBER", "GAMER", "NEONX", "PIXEL", "SPACE", "DRIVE", "SHIFT", "PULSE", "BOARD"];
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
];

import { GameDifficulty } from "../types";

interface WordleProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    difficulty?: GameDifficulty;
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const Wordle: React.FC<WordleProps> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [hasReportedResult, setHasReportedResult] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    setSolution(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]);
    setCurrentGuess("");
    setGameOver(false);
    setWon(false);
    setHasReportedResult(false);
  };

  useEffect(() => {
    if (gameOver && !hasReportedResult) {
      setHasReportedResult(true);
      onGameOver?.({
        outcome: won ? "win" : "loss",
        difficulty: "Hard",
        gameSpecificData: { gameId: "wordle-clone", attempts: guesses.length }
      });
    }
  }, [gameOver, won, guesses, hasReportedResult, onGameOver]);

  const onKeyPress = (key: string) => {
    if (gameOver) return;

    if (key === "ENTER") {
      if (currentGuess.length === WORD_LENGTH) {
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess("");

        if (currentGuess === solution) {
          setWon(true);
          setGameOver(true);
        } else if (newGuesses.length === MAX_ATTEMPTS) {
          setGameOver(true);
        }
      }
    } else if (key === "BACKSPACE") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH && key.length === 1) {
      setCurrentGuess(prev => (prev + key).toUpperCase());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === "Enter") onKeyPress("ENTER");
       else if (e.key === "Backspace") onKeyPress("BACKSPACE");
       else if (/^[A-Za-z]$/.test(e.key)) onKeyPress(e.key.toUpperCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGuess, guesses, gameOver, solution]);

  const getLetterStatus = (letter: string, index: number) => {
    if (solution[index] === letter) return "correct";
    if (solution.includes(letter)) return "present";
    return "absent";
  };

  const getUsedKeysStatus = () => {
    const statusMap: Record<string, string> = {};
    guesses.forEach(guess => {
      guess.split('').forEach((letter, i) => {
        const status = getLetterStatus(letter, i);
        if (status === 'correct') statusMap[letter] = 'correct';
        else if (status === 'present' && statusMap[letter] !== 'correct') statusMap[letter] = 'present';
        else if (status === 'absent' && !statusMap[letter]) statusMap[letter] = 'absent';
      });
    });
    return statusMap;
  };

  const usedKeysStatus = getUsedKeysStatus();

  return (
    <div className="flex flex-col items-center gap-8 p-6 py-4 w-full max-w-2xl animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => {
          const guess = guesses[i] || (i === guesses.length ? currentGuess : "");
          const isSubmitted = i < guesses.length;

          return (
            <div key={i} className="grid grid-cols-5 gap-2">
              {Array.from({ length: WORD_LENGTH }).map((_, j) => {
                const letter = guess[j] || "";
                const status = isSubmitted ? getLetterStatus(letter, j) : "";

                return (
                  <motion.div
                    key={j}
                    initial={isSubmitted ? { rotateX: -90 } : {}}
                    animate={isSubmitted ? { rotateX: 0 } : {}}
                    transition={{ delay: j * 0.1 }}
                    className={cn(
                      "aspect-square rounded-xl border-2 flex items-center justify-center font-display font-black text-2xl transition-all duration-500",
                      !isSubmitted && letter ? "border-neon-cyan shadow-glow text-white" : "border-slate-800 text-slate-500",
                      status === "correct" && "bg-green-500 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]",
                      status === "present" && "bg-yellow-500 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]",
                      status === "absent" && "bg-slate-800 border-slate-700 text-slate-500 opacity-50"
                    )}
                  >
                    {letter}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Virtual Keyboard */}
      <div className="flex flex-col gap-2 w-full max-w-md">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
            {row.map(key => {
              const status = usedKeysStatus[key];
              return (
                <button
                  key={key}
                  onClick={() => onKeyPress(key)}
                  className={cn(
                    "flex-1 min-w-[32px] h-12 rounded-lg text-xs font-black transition-all flex items-center justify-center uppercase",
                    key === "ENTER" || key === "BACKSPACE" ? "px-4 flex-[1.5] text-[10px]" : "",
                    !status ? "bg-slate-800 text-white hover:bg-slate-700 active:scale-90" : "",
                    status === 'correct' && "bg-green-500 text-white border border-green-400",
                    status === 'present' && "bg-yellow-500 text-white border border-yellow-400",
                    status === 'absent' && "bg-slate-900 text-slate-600 border border-slate-800 opacity-40"
                  )}
                >
                  {key === "BACKSPACE" ? <Delete size={16} /> : key === "ENTER" ? <CornerDownLeft size={16} /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        Type or use the keypad to decrypt
        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
      </div>

      <GameGuide 
        title="Wordle Decryption Guide"
        instructions={[
          "Guess the hidden 5-letter security code in 6 attempts.",
          "Each guess must be a valid 5-letter word.",
          "Green tile: The letter is in the correct spot.",
          "Yellow tile: The letter is in the code but in a different spot.",
          "Gray tile: The letter is not in the hidden code."
        ]}
        tips={[
          "Start with words containing many vowels like 'ARENA' or 'RADIO'.",
          "Pay attention to the virtual keyboard to track used letters.",
          "Use eliminations to narrow down possibilities."
        ]}
      />

      <GameOverOverlay 
        show={gameOver} 
        title={won ? "DECRYPTED" : "ENCRYPTION FAILED"}
        result={won ? "Target String Decoded Successfully" : `Target Signature: ${solution}`}
        onRestart={startNewGame}
        onExit={() => navigate("/")}
      />
    </div>
  );
};

export default Wordle;
