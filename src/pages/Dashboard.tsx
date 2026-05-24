import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GAMES, CATEGORIES } from "../constants";
import { motion } from "motion/react";
import { Play, Users, Trophy } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";

const ImageWithFallback: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { fallback?: string }> = ({ 
  src, 
  alt, 
  className, 
  fallback = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&h=300&auto=format&fit=crop",
  ...props 
}) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [isError, setIsError] = React.useState(false);

  return (
    <img
      {...props}
      src={isError ? fallback : imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!isError) {
          setIsError(true);
        }
      }}
    />
  );
};

const GameCard: React.FC<{ game: typeof GAMES[0] }> = ({ game }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-slate-900/40 border border-slate-800 rounded-xl p-1 overflow-hidden backdrop-blur-sm group transition-all hover:border-neon-cyan/40"
    >
      <div className="aspect-video bg-slate-800 rounded-lg mb-3 relative overflow-hidden">
        <ImageWithFallback
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-surface/80 to-transparent" />
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan text-[8px] font-bold rounded border border-neon-cyan/30 uppercase tracking-widest">
          {game.isMultiplayer ? "Multiplayer" : "Single Player"}
        </div>
      </div>
      
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-white group-hover:text-neon-cyan transition-colors">{game.title}</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-tight">{game.category} • Arcade</p>
          </div>
          <Link to={`/game/${game.id}`} className="p-1.5 rounded-lg bg-white/5 hover:bg-neon-cyan hover:text-black transition-colors text-slate-400">
            <Play size={14} fill="currentColor" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredGames = activeCategory === "All" 
    ? GAMES 
    : GAMES.filter(g => g.category === activeCategory || (activeCategory === "Multiplayer" && g.isMultiplayer));

  const getRankTitle = (level: number) => {
    if (level < 5) return "RECRUIT";
    if (level < 10) return "SQUAD LEADER";
    if (level < 20) return "VETERAN";
    if (level < 50) return "ELITE COMMANDER";
    return "LEGEND";
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase italic">
            BATTLE<span className="text-neon-cyan">ARENA</span> <span className="text-slate-500 font-medium tracking-normal text-2xl ml-2">DASHBOARD</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">
            Welcome back, <span className="text-neon-pink">{profile?.displayName || "Agent"}</span>. Arena status: <span className="text-green-500">{getRankTitle(profile?.level || 1)}</span>
          </p>
        </div>
        <div className="flex bg-slate-900 shadow-inner rounded-xl p-3 border border-white/5 items-center gap-6">
           <div className="text-center px-4 border-r border-white/5">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Net level</p>
             <p className="text-xl font-display font-black text-white">{profile?.level || 1}</p>
           </div>
           <div className="text-center px-4 border-r border-white/5">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Wins</p>
             <p className="text-xl font-display font-black text-neon-cyan">{profile?.totalWins || 0}</p>
           </div>
           <div className="text-center px-4">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total XP</p>
             <p className="text-xl font-display font-black text-neon-purple">{Math.round((profile?.xp || 0) / 100) / 10}K</p>
           </div>
        </div>
      </div>

      {/* Featured Battle (Hero) */}
      <section className="relative h-64 rounded-2xl overflow-hidden border border-neon-cyan/30 group shadow-2xl shadow-neon-cyan/5">
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-slate-800">
          <img 
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2000&auto=format&fit=crop" 
            alt="Hero" 
            className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute top-0 right-0 w-2/3 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-purple/20 to-transparent" />
        </div>
        
        <div className="relative z-20 p-10 h-full flex flex-col justify-center">
          <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-[0.3em] mb-2 font-display">Featured Challenge</span>
          <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter text-white">QUIZ BATTLE ROYALE</h2>
          <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
            Test your knowledge against 50 players in real-time. Winner takes all 2,000 credits and exclusive XP boosts.
          </p>
          <div className="flex gap-4">
            <button className="bg-neon-cyan text-slate-900 px-8 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-neon-cyan/20">
              Enter Arena
            </button>
            <button className="bg-white/10 backdrop-blur-md border border-white/10 px-8 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all">
              Rules
            </button>
          </div>
        </div>
      </section>

      {/* Recommended Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold tracking-tight text-white font-display uppercase tracking-widest flex items-center gap-3">
             Popular Games
          </h3>
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest border",
                  activeCategory === cat 
                    ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50" 
                    : "bg-slate-900/40 text-slate-500 border-slate-800 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredGames.slice(0, 8).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Leaderboard & Multiplayer (Design Pattern) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-neon-cyan/5 to-transparent pointer-events-none" />
          <h3 className="text-sm font-bold mb-6 flex items-center gap-3 uppercase tracking-[0.2em] text-white">
            <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></span> Global Leaderboard
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group/entry hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-xs font-black italic w-6",
                    n === 1 ? "text-yellow-500" : n === 2 ? "text-slate-300" : "text-amber-600"
                  )}>0{n}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
                  <span className="text-sm font-medium text-slate-300">Player_Savage_{n}</span>
                </div>
                <span className="text-xs font-mono text-neon-cyan font-bold">{(15 - n) * 1220} XP</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 text-[10px] uppercase font-bold text-slate-500 hover:text-neon-cyan tracking-widest transition-colors">
            View All Global Rankings
          </button>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-neon-purple/5 to-transparent pointer-events-none" />
          <h3 className="text-sm font-bold mb-6 flex items-center gap-3 uppercase tracking-[0.2em] text-white">
            <span className="w-2 h-2 bg-neon-purple rounded-full shadow-[0_0_8px_#9333ea]"></span> Friends Online
          </h3>
          <div className="grid grid-cols-4 gap-6">
            {['K', 'M', 'S', 'R', 'J', 'D', 'L', 'T'].map((char, i) => (
              <div key={i} className={cn(
                "flex flex-col items-center gap-3 group/friend cursor-pointer",
                i > 3 && "opacity-40"
              )}>
                <div className={cn(
                  "relative w-14 h-14 rounded-full bg-slate-800 p-1 border transition-all group-hover/friend:scale-110",
                  i < 4 ? "border-green-500/50" : "border-slate-700"
                )}>
                  <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold font-display">
                    {char}
                  </div>
                  {i < 4 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark-surface rounded-full"></div>}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate w-full text-center group-hover/friend:text-white transition-colors">User_{char}xx</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
