import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { motion } from "motion/react";
import { Trophy, Medal, Search, Filter, ArrowUpRight, Crown } from "lucide-react";
import { cn } from "../lib/utils";

const Leaderboard: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"Global" | "Weekly" | "Friends">("Global");

  const topPlayers = [
    { rank: 1, name: "CyberGhost_7", xp: 12840, level: 32, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1" },
    { rank: 2, name: "PixelPioneer", xp: 11200, level: 28, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2" },
    { rank: 3, name: "VoidSeeker", xp: 10950, level: 27, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3" },
  ];

  const players = [
    { rank: 4, name: "NeonRunner", xp: 9400, level: 24, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4" },
    { rank: 5, name: "QuantumLeap", xp: 8200, level: 21, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=5" },
    { rank: 6, name: "EchoBlade", xp: 7800, level: 19, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=6" },
    { rank: 7, name: "StarDust", xp: 7100, level: 18, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=7" },
    { rank: 8, name: "RogueOne", xp: 6500, level: 16, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=8" },
    { rank: 9, name: "AlphaZero", xp: 5900, level: 15, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=9" },
    { rank: 10, name: "Zenith", xp: 5200, level: 13, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase mb-2">Hall of Legends</h1>
          <p className="text-slate-500 text-sm font-medium tracking-wide">The elite rankings of Battle Arena's top performers.</p>
        </div>
        
        <div className="flex bg-slate-900/60 border border-slate-800 p-1 rounded-xl backdrop-blur-sm">
          {["Global", "Weekly", "Friends"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === tab 
                  ? "bg-neon-cyan text-slate-900 shadow-lg shadow-neon-cyan/20" 
                  : "text-slate-500 hover:text-white"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-12 pb-8">
        {/* 2nd Place */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-2 md:order-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center relative h-64 flex flex-col justify-end"
        >
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 rounded-full border-4 border-slate-300 overflow-hidden relative">
              <img src={topPlayers[1].avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">2</div>
          </div>
          <h3 className="font-display font-black text-white text-lg uppercase tracking-tight mb-1">{topPlayers[1].name}</h3>
          <p className="text-neon-cyan font-mono text-sm font-bold mb-4">{topPlayers[1].xp} XP</p>
          <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-4">Level {topPlayers[1].level}</div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 w-3/4" />
          </div>
        </motion.div>

        {/* 1st Place */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="order-1 md:order-2 bg-gradient-to-b from-yellow-500/10 to-slate-900/40 border-2 border-yellow-500/30 rounded-3xl p-8 text-center relative h-80 flex flex-col justify-end shadow-2xl shadow-yellow-500/5"
        >
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2">
            <div className="relative">
              <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-500 w-10 h-10 drop-shadow-[0_0_8px_#eab308]" />
              <div className="w-24 h-24 rounded-full border-4 border-yellow-500 overflow-hidden relative shadow-2xl">
                <img src={topPlayers[0].avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg">1</div>
          </div>
          <h3 className="font-display font-black text-white text-2xl uppercase tracking-tighter mb-1">{topPlayers[0].name}</h3>
          <p className="text-yellow-500 font-mono text-lg font-black mb-4 tracking-tighter">{topPlayers[0].xp} XP</p>
          <div className="text-xs uppercase font-black text-slate-400 tracking-[0.3em] mb-6">Supreme Legends</div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
            <div className="h-full bg-yellow-500 rounded-full shadow-[0_0_12px_#eab308] w-full" />
          </div>
        </motion.div>

        {/* 3rd Place */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="order-3 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center relative h-56 flex flex-col justify-end"
        >
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 rounded-full border-4 border-amber-600 overflow-hidden relative">
              <img src={topPlayers[2].avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">3</div>
          </div>
          <h3 className="font-display font-black text-white text-lg uppercase tracking-tight mb-1">{topPlayers[2].name}</h3>
          <p className="text-neon-cyan font-mono text-sm font-bold mb-4">{topPlayers[2].xp} XP</p>
          <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">Level {topPlayers[2].level}</div>
        </motion.div>
      </div>

      {/* Main List */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 bg-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
               <input 
                 type="text" 
                 placeholder="Find player..." 
                 className="bg-slate-900/80 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs outline-none focus:border-neon-cyan transition-all w-64"
               />
             </div>
             <button className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
               <Filter size={16} />
             </button>
           </div>
           <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest hidden md:block">
             Syncing real-time rankings...
           </div>
        </div>

        <div className="divide-y divide-slate-800">
          {players.map((player, i) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-6">
                <span className="w-8 text-center text-xs font-black text-slate-500 group-hover:text-neon-cyan transition-colors italic">0{player.rank}</span>
                <div className="w-10 h-10 rounded-full border border-slate-800 overflow-hidden bg-slate-800">
                  <img src={player.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-neon-cyan transition-colors uppercase tracking-tight">{player.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Gold Tier</span>
                    <span className="text-[9px] text-neon-cyan font-mono font-bold tracking-widest">LVL {player.level}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-12">
                <div className="hidden sm:block text-right">
                  <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Win Rate</div>
                  <div className="text-xs font-bold text-slate-400">72%</div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-xs font-black text-white tracking-tighter">{player.xp.toLocaleString()} XP</div>
                  <div className="flex items-center justify-end gap-1 text-[9px] text-green-500 font-bold uppercase tracking-tighter">
                    <ArrowUpRight size={10} /> Trend
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="p-4 bg-neon-cyan/5 border-t border-neon-cyan/10">
           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan px-4">
             <span>Your Current Rank: #420</span>
             <button className="hover:underline">Share Stats Profile</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
