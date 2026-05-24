import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, User, Users, ChevronRight, Clock, Home, Copy, Check, LogOut, UserPlus } from "lucide-react";
import { cn } from "../lib/utils";
import socket from "../lib/socket";
import GameOverOverlay from "../components/games/GameOverOverlay";
import GameGuide from "../components/games/GameGuide";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface RockPaperScissorsProps {
  onGameOver?: (result: {
    outcome: "win" | "loss" | "draw";
    isMultiplayer?: boolean;
    gameSpecificData?: any;
  }) => void;
}

const CHOICES = [
  { id: "rock", icon: "✊", beats: "scissors" },
  { id: "paper", icon: "✋", beats: "rock" },
  { id: "scissors", icon: "✌️", beats: "paper" },
];

const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({ onGameOver }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [mode, setMode] = useState<"choice" | "single" | "multi">("choice");
  const [rpsStatus, setRpsStatus] = useState<"lobby" | "waiting" | "playing">("lobby");
  const [roomId, setRoomId] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [copying, setCopying] = useState(false);
  
  const [userChoice, setUserChoice] = useState<any>(null);
  const [computerChoice, setComputerChoice] = useState<any>(null);
  const [opponentChoice, setOpponentChoice] = useState<any>(null);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [scores, setScores] = useState({ user: 0, opponent: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasReportedResult, setHasReportedResult] = useState(false);

  useEffect(() => {
    if (roomId && mode === "multi" && rpsStatus === "waiting") {
      console.log("Emitting joinRPS for room:", roomId);
      socket.emit("joinRPS", { 
        roomId, 
        playerId: socket.id, 
        playerName: profile?.displayName || "Pilot" 
      });
    }
  }, [roomId, mode, rpsStatus]);

  useEffect(() => {
    if (mode === "multi") {
      const handleStart = (room: any) => {
        console.log("RPS Game started completely!", room);
        setRpsStatus("playing");
      };

      const handleOpponentReady = () => {
        setOpponentSubmitted(true);
      };

      const handleResult = ({ results, winnerId }: any) => {
        const myId = socket.id;
        const opponentId = Object.keys(results).find(id => id !== myId);
        
        const myChoiceId = results[myId];
        const oppChoiceId = opponentId ? results[opponentId] : null;

        if (myChoiceId && oppChoiceId) {
          const myChoice = CHOICES.find(c => c.id === myChoiceId);
          const oppChoice = CHOICES.find(c => c.id === oppChoiceId);
          
          setOpponentChoice(oppChoice);
          setOpponentSubmitted(true);
          setUserChoice(myChoice);
          
          setTimeout(() => {
            if (winnerId === myId) {
              setResult("YOU WIN!");
              setScores(s => ({ ...s, user: s.user + 1 }));
            } else if (winnerId === opponentId) {
              setResult("YOU LOSE!");
              setScores(s => ({ ...s, opponent: s.opponent + 1 }));
            } else {
              setResult("IT'S A DRAW!");
            }
            setIsPlaying(false);
          }, 800);
        }
      };

      socket.on("rpsGameStarted", handleStart);
      socket.on("rps-opponent-ready", handleOpponentReady);
      socket.on("rpsResult", handleResult);

      return () => {
        socket.off("rpsGameStarted", handleStart);
        socket.off("rps-opponent-ready", handleOpponentReady);
        socket.off("rpsResult", handleResult);
      };
    }
  }, [mode]);

  const initiateMultiplayer = (id: string) => {
    const code = (id || "").trim().toUpperCase();
    if (!code) return;
    setRoomId(code);
    setRpsStatus("waiting");
    socket.emit("joinRPS", { 
      roomId: code, 
      playerId: socket.id, 
      playerName: profile?.displayName || "Pilot" 
    });
  };

  const createRoom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    initiateMultiplayer(code);
  };

  const handleChoice = (choice: any) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setUserChoice(choice);
    
    if (mode === "single") {
      setTimeout(() => {
        const randomChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
        setComputerChoice(randomChoice);
        determineWinner(choice, randomChoice);
        setIsPlaying(false);
      }, 1000);
    } else if (mode === "multi") {
      socket.emit("rps-submit", {
        roomId,
        choice: choice.id
      });
    }
  };

  const determineWinner = (user: any, opp: any) => {
    if (user.id === opp.id) {
      setResult("IT'S A DRAW!");
    } else if (user.beats === opp.id) {
      setResult("YOU WIN!");
      setScores(s => ({ ...s, user: s.user + 1 }));
    } else {
      setResult("YOU LOSE!");
      setScores(s => ({ ...s, opponent: s.opponent + 1 }));
    }
  };

  const reset = () => {
    setUserChoice(null);
    setComputerChoice(null);
    setOpponentChoice(null);
    setOpponentSubmitted(false);
    setResult(null);
    setHasReportedResult(false);
  };

  useEffect(() => {
    if (result && !hasReportedResult) {
      setHasReportedResult(true);
      onGameOver?.({
        outcome: result === "YOU WIN!" ? "win" : result === "YOU LOSE!" ? "loss" : "draw",
        isMultiplayer: mode === "multi",
        gameSpecificData: { gameId: "rock-paper-scissors" }
      });
    }
  }, [result, mode, hasReportedResult, onGameOver]);

  if (mode === "choice") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-3 italic">Melee Protocol</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Select Engagement Type</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl px-4">
           <button 
            onClick={() => setMode("single")}
            className="flex-1 bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-[2rem] text-left group hover:border-neon-cyan/40 hover:bg-slate-900 transition-all"
           >
             <div className="w-12 h-12 bg-neon-cyan/10 rounded-2xl flex items-center justify-center mb-6 border border-neon-cyan/20 group-hover:scale-110 transition-transform">
               <User className="text-neon-cyan" size={24} />
             </div>
             <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">CPU Combat</h3>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-relaxed">Fast-paced duel against synthetic intelligence.</p>
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
             <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">Network Duel</h3>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-relaxed">Challenge a verified human pilot via secure Uplink.</p>
             <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-neon-purple uppercase tracking-widest group-hover:gap-4 transition-all">
               Connect <ChevronRight size={14} />
             </div>
           </button>
        </div>
      </div>
    );
  }

  if (mode === "multi" && rpsStatus === "lobby") {
    return (
      <div className="w-full max-w-md mx-auto space-y-8 py-10 animate-in fade-in slide-in-from-bottom-5">
        <div className="text-center">
          <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter mb-2">Combat Lobby</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Connect with other players to start the battle</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-6">
          <div className="space-y-4">
            <button 
              onClick={createRoom}
              className="w-full bg-neon-purple text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-purple/20"
            >
              <UserPlus size={18} /> Create Combat Arena
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">or join via code</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Arena Code"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest text-white outline-none focus:border-neon-purple transition-all"
              />
              <button 
                onClick={() => initiateMultiplayer(roomInput)}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "multi" && rpsStatus === "waiting") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in">
        <div className="relative">
           <div className="w-24 h-24 border-4 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin" />
           <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-purple" size={32} />
        </div>
        <div>
          <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter mb-2">Awaiting Opponent</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Share the code to initiate contact</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 font-display text-4xl font-black text-white tracking-[0.2em] relative group">
           {roomId}
           <button 
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              setCopying(true);
              setTimeout(() => setCopying(false), 2000);
            }}
            className={cn(
              "absolute -right-12 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
              copying ? "text-green-500" : "text-slate-600 hover:text-neon-purple"
            )}
           >
             {copying ? <Check size={20} /> : <Copy size={20} />}
           </button>
        </div>
        <button 
          onClick={() => setRpsStatus("lobby")}
          className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
        >
          <LogOut size={14} /> Abandon Link
        </button>
      </div>
    );
  }

  const activeOpponentChoice = mode === "single" ? computerChoice : opponentChoice;

  return (
    <div className="flex flex-col items-center gap-8 md:gap-10 p-4 md:p-8 w-full max-w-4xl mx-auto animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex justify-between w-full max-w-md bg-white/[0.02] border border-white/5 p-4 rounded-2xl md:p-6 md:rounded-3xl">
        <div className="text-center group flex flex-col items-center gap-1">
          <div className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Player Rank</div>
          <div className="text-2xl md:text-4xl font-display font-black text-white text-glow shadow-neon-cyan/20">{scores.user}</div>
        </div>
        <div className="w-px bg-white/10" />
        <div className="text-center flex flex-col items-center gap-1">
          <div className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">{mode === 'single' ? 'CPU core' : 'Enemy'}</div>
          <div className="text-2xl md:text-4xl font-display font-black text-white text-glow shadow-neon-pink/20">{scores.opponent}</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 md:gap-12 h-40 md:h-64 relative w-full overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/5 -z-10" />
        
        <AnimatePresence mode="wait">
          {userChoice ? (
            <motion.div
              initial={{ scale: 0, x: -50, opacity: 0 }}
              animate={{ scale: 1.2, x: 0, opacity: 1 }}
              className="flex flex-col items-center gap-2 md:gap-4"
            >
              <div className="text-5xl md:text-8xl bg-slate-900 border-2 border-neon-cyan/50 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-neon-cyan/20 text-glow">{userChoice.icon}</div>
              <span className="text-[8px] md:text-[10px] font-black text-neon-cyan uppercase tracking-widest">Marked</span>
            </motion.div>
          ) : (
            <div className="text-5xl md:text-7xl opacity-5 grayscale bg-slate-900/20 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 italic">?</div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center z-10 bg-slate-950 p-2 rounded-full border border-white/10 shrink-0">
          <div className="text-lg md:text-2xl font-display font-black text-slate-500 italic">VS</div>
        </div>

        <AnimatePresence mode="wait">
          {activeOpponentChoice ? (
            <motion.div
              initial={{ scale: 0, x: 50, opacity: 0 }}
              animate={{ scale: 1.2, x: 0, opacity: 1 }}
              className="flex flex-col items-center gap-2 md:gap-4"
            >
              <div className="text-5xl md:text-8xl bg-slate-900 border-2 border-neon-purple/50 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-neon-purple/20 text-glow">{activeOpponentChoice.icon}</div>
              <span className="text-[8px] md:text-[10px] font-black text-neon-purple uppercase tracking-widest">{mode === 'single' ? 'CPU' : 'Enemy Revealed'}</span>
            </motion.div>
          ) : (
            <div className={cn(
              "text-5xl md:text-7xl opacity-5 grayscale bg-slate-900/20 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 flex items-center justify-center transition-all",
              (isPlaying || opponentSubmitted) && "opacity-40 animate-pulse text-neon-purple border-neon-purple/30 bg-neon-purple/5"
            )}>
              {opponentSubmitted ? "🔒" : "✊"}
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {result && (
          <GameOverOverlay
            show={!!result}
            title={result}
            result={result === "YOU WIN!" ? "Tactical Advantage Secured" : (result === "YOU LOSE!" ? "Target Overwhelmed System" : "Signal Grid Locked")}
            score={`YOU ${scores.user} - ${scores.opponent} ${mode === 'single' ? 'CPU' : 'ENEMY'}`}
            onRestart={reset}
            onExit={() => navigate("/")}
          />
        )}
      </AnimatePresence>

      {!userChoice && !isPlaying && (
        <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-2xl px-4 relative z-10">
          {CHOICES.map(choice => (
            <button
              key={choice.id}
              onClick={() => handleChoice(choice)}
              className="bg-slate-900/60 border border-slate-800 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] transition-all hover:border-neon-cyan shadow-xl flex flex-col items-center gap-2 md:gap-4 group backdrop-blur-md active:scale-95"
            >
              <span className="text-4xl md:text-7xl group-hover:text-glow transition-all mb-1">{choice.icon}</span>
              <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-neon-cyan transition-colors">{choice.id}</span>
            </button>
          ))}
        </div>
      )}

      <GameGuide 
        title="Tactical Melee Guide"
        instructions={[
          "Rock crushes Scissors.",
          "Scissors cuts Paper.",
          "Paper covers Rock.",
          "Single Player: Face the CPU core in a rapid-fire duel.",
          "Multiplayer: Sync with a human opponent for a mind-game showdown."
        ]}
        tips={[
          "Humans often start with Rock; try starting with Paper to lead early.",
          "Look for patterns in CPU behavior if you play multiple rounds.",
          "In multiplayer, wait for the 'Enemy Final' signal before results unlock."
        ]}
        isMultiplayer={mode === 'multi'}
      />

      <div className="text-[10px] text-slate-600 font-black tracking-[0.3em] uppercase text-center mt-6 flex items-center gap-3">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        {isPlaying ? "WAITING FOR TARGET SELECTION..." : "SELECT INTERACTION PROTOCOL"}
        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
      </div>
    </div>
  );
};

export default RockPaperScissors;
