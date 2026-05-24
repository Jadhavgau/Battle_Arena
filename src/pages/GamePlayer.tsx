import React, { lazy, Suspense, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GAMES } from "../constants";
import { motion } from "motion/react";
import { ChevronLeft, Maximize2, Share2, Info, Trophy, Gamepad2, Users, Activity } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useProgression } from "../hooks/useProgression";
import LevelUpOverlay from "../components/games/LevelUpOverlay";
import { cn } from "../lib/utils";

const TicTacToe = lazy(() => import("../games/TicTacToe"));
const SnakeGame = lazy(() => import("../games/SnakeGame"));
const SimonSays = lazy(() => import("../games/SimonSays"));
const MemoryMatch = lazy(() => import("../games/MemoryMatch"));
const RockPaperScissors = lazy(() => import("../games/RockPaperScissors"));
const TypingSpeed = lazy(() => import("../games/TypingSpeed"));
const Ludo = lazy(() => import("../games/Ludo"));
const SnakesAndLadders = lazy(() => import("../games/SnakesAndLadders"));
const Wordle = lazy(() => import("../games/Wordle"));
const WhackAMole = lazy(() => import("../games/WhackAMole"));
const Connect4 = lazy(() => import("../games/Connect4"));
const Game2048 = lazy(() => import("../games/Game2048"));

const GameComponents: Record<string, React.FC<any>> = {
  "tic-tac-toe": TicTacToe,
  "snake": SnakeGame,
  "simon-says": SimonSays,
  "memory-match": MemoryMatch,
  "rock-paper-scissors": RockPaperScissors,
  "typing-speed": TypingSpeed,
  "ludo": Ludo,
  "snakes-and-ladders": SnakesAndLadders,
  "wordle-clone": Wordle,
  "whack-a-mole": WhackAMole,
  "connect-4": Connect4,
  "2048": Game2048,
};

const GamePlayer: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { completeGame, levelUpData, closeLevelUp } = useProgression();
  const game = GAMES.find((g) => g.id === gameId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [gameId]);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-900/40 border border-slate-800 rounded-3xl">
        <h2 className="text-2xl font-bold mb-4">Game not found</h2>
        <button onClick={() => navigate("/")} className="text-neon-cyan hover:underline uppercase tracking-widest font-bold text-xs">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const ActiveGame = GameComponents[gameId!] || (() => <div className="p-10 text-center uppercase tracking-widest font-bold text-slate-500">Deployment in progress...</div>);

  return (
    <div className="space-y-6">
      <LevelUpOverlay 
        show={levelUpData.show}
        level={levelUpData.level}
        xpGained={levelUpData.xpGained}
        achievements={levelUpData.achievements}
        onClose={closeLevelUp}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> Back to Hub
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 hover:text-neon-cyan border border-white/5"><Share2 size={16} /></button>
          <button className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 hover:text-neon-cyan border border-white/5"><Maximize2 size={16} /></button>
        </div>
      </div>

      {/* Game Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden min-h-[500px] lg:min-h-[650px] relative flex flex-col shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between px-8 py-4 bg-dark-bg/40 border-b border-slate-800 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
                  <Gamepad2 className="text-neon-cyan" size={20} />
                </div>
                <div>
                  <h1 className="font-display font-black text-white uppercase tracking-tighter text-lg">{game.title}</h1>
                  <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Arena v2.4.0 • {game.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="hidden md:flex items-center gap-2 text-[10px] uppercase font-black text-green-500 tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                  <Activity size={12} className="animate-pulse" /> Live
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-start bg-[#020305]/80 relative overflow-y-auto p-4 sm:p-8 md:p-12">
               {/* Scanlines Effect */}
               <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
               
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 w-full">
                  <div className="w-14 h-14 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.3)]"></div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-neon-cyan font-black animate-pulse">Initializing Interface...</span>
                </div>
              }>
                <div className="w-full flex flex-col items-center justify-start py-4">
                  <ActiveGame onGameOver={(result: any) => {
                    if (game) {
                      completeGame(
                        game.id, 
                        game.title, 
                        result.outcome, 
                        result.difficulty || "Medium", 
                        result.isMultiplayer || false,
                        result.gameSpecificData
                      );
                    }
                  }} />
                </div>
              </Suspense>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-neon-cyan/10 rounded-lg text-neon-cyan border border-neon-cyan/20">
                <Info size={18} />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Combat Briefing</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {game.description} Master the controls and climb the ranks to earn ultimate glory. 
              {game.isMultiplayer ? " Engage in high-stakes multiplayer battles or sharpen your skills in Solo mode." : " This is a precision-based Single Player experience designed for top-tier performance."}
            </p>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-yellow-500/5 to-transparent pointer-events-none" />
            <h3 className="text-xs font-black mb-8 flex items-center gap-3 uppercase tracking-[0.3em] text-white">
              <Trophy size={16} className="text-yellow-500 shadow-[0_0_8px_#eab308]" /> Game Elite
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group/entry hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-xs font-black italic w-4",
                      n === 1 ? "text-yellow-500" : n === 2 ? "text-slate-300" : "text-amber-600"
                    )}>0{n}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Ghost_{n}2</span>
                  </div>
                  <span className="text-[10px] font-mono text-neon-cyan font-black">{(10 - n) * 850}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-neon-purple/5 to-transparent pointer-events-none" />
            <h3 className="text-xs font-black mb-8 flex items-center gap-3 uppercase tracking-[0.3em] text-white">
              <Users size={16} className="text-neon-purple shadow-[0_0_8px_#9333ea]" /> Active Squads
            </h3>
            <div className="text-center py-10 opacity-40">
              <div className="w-12 h-12 bg-slate-800 rounded-xl mx-auto flex items-center justify-center mb-4 border border-white/5">
                <Users size={20} className="text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No Active Rooms Found</p>
            </div>
            <button className="w-full bg-neon-purple text-white text-[10px] font-black uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-neon-purple/80 transition-all shadow-lg shadow-neon-purple/20">
              Create Squad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlayer;
