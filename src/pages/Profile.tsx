import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { motion } from "motion/react";
import { Trophy, Star, Clock, Gamepad2, Settings, ShieldCheck, Mail, Zap, TrendingUp, Target } from "lucide-react";
import { cn } from "../lib/utils";
import { getRecentActivity, getXPForLevel } from "../services/progressionService";
import { Activity } from "../types";
import { formatDistanceToNow } from "date-fns";
import { ACHIEVEMENTS_DATA } from "../data/achievements";

const Profile: React.FC = () => {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      getRecentActivity(profile.uid, 5).then(data => {
        setActivities(data);
        setLoading(false);
      });
    }
  }, [profile]);

  if (!profile) return null;

  const nextLevelXP = getXPForLevel(profile.level);
  const progressPercent = Math.min(100, (profile.xp / nextLevelXP) * 100);

  const stats = [
    { label: "Games Played", value: profile.totalGamesPlayed, icon: Gamepad2, color: "text-blue-500" },
    { label: "Total Wins", value: profile.totalWins, icon: Trophy, color: "text-yellow-500" },
    { label: "Win Rate", value: profile.totalGamesPlayed > 0 ? `${Math.round((profile.totalWins / profile.totalGamesPlayed) * 100)}%` : "0%", icon: Target, color: "text-green-500" },
    { label: "Win Strike", value: profile.winStrike, icon: Zap, color: "text-neon-pink" },
  ];

  const getRankTitle = (level: number) => {
    if (level < 5) return "RECRUIT RANK";
    if (level < 10) return "SQUAD LEADER";
    if (level < 20) return "VETERAN RANK";
    if (level < 50) return "ELITE COMMANDER";
    return "ARENA LEGEND";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-neon-cyan/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-neon-cyan/50 overflow-hidden shadow-2xl relative">
            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-900 border-2 border-neon-cyan rounded-full flex items-center justify-center text-neon-cyan font-bold text-xs ring-4 ring-dark-bg">
            {profile.level}
          </div>
        </div>
        
        <div className="relative z-10 text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
            <h1 className="text-3xl font-display font-black text-white tracking-tighter uppercase">{profile.displayName}</h1>
            <span className="px-3 py-1 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-[10px] font-bold uppercase tracking-widest font-display">
               {getRankTitle(profile.level)}
            </span>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6 font-mono">
            <span className="flex items-center gap-1.5"><Mail size={12} className="text-neon-cyan" /> {profile.email}</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-green-500" /> Account Verified</span>
          </div>
          
          <div className="w-full max-w-md bg-slate-800 rounded-full h-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-neon-cyan shadow-[0_0_12px_#06b6d4]"
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">
            <span>Progress to LVL {profile.level + 1}</span>
            <span className="text-neon-cyan">{profile.xp} / {nextLevelXP} XP</span>
          </div>
        </div>

        <button className="absolute top-8 right-8 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/5">
          <Settings size={20} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center group hover:border-neon-cyan/50 transition-all backdrop-blur-sm"
          >
            <div className={cn("inline-flex p-3 rounded-xl bg-white/5 mb-4 group-hover:scale-110 transition-transform", stat.color)}>
              <stat.icon size={20} />
            </div>
            <div className="text-2xl font-display font-black text-white mb-1 tracking-tighter">{stat.value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Achievements */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
          <h3 className="font-display font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-[0.2em] text-white">
            <span className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_8px_#eab308]"></span> Unlocked Awards
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {profile.achievements.length > 0 ? (
              profile.achievements.map((id) => {
                const achievement = ACHIEVEMENTS_DATA[id as keyof typeof ACHIEVEMENTS_DATA];
                return (
                  <div key={id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-3 group cursor-help transition-colors hover:border-yellow-500/30">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 group-hover:scale-110 transition-transform text-2xl">
                      {achievement?.icon || "🏆"}
                    </div>
                    <span className="text-[9px] font-black text-slate-400 text-center uppercase tracking-tighter group-hover:text-yellow-500 leading-tight">
                      {achievement?.name || id}
                    </span>
                  </div>
                );
              })
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-3 opacity-20 filter grayscale">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                    <Star size={24} />
                  </div>
                  <div className="h-2 w-12 bg-slate-700 rounded-full" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
          <h3 className="font-display font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-[0.2em] text-white">
            <span className="w-2 h-2 bg-neon-purple rounded-full shadow-[0_0_8px_#9333ea]"></span> Recent Activity
          </h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
                      <Gamepad2 className="text-neon-cyan" size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-tight">{activity.gameTitle}</div>
                      <div className="text-[9px] text-slate-500 uppercase font-mono font-bold tracking-widest mt-1">
                        {formatDistanceToNow(new Date(activity.timestamp))} ago • 
                        <span className={cn(
                            "ml-1",
                            activity.outcome === "win" ? "text-green-500" : activity.outcome === "loss" ? "text-neon-pink" : "text-yellow-500"
                        )}>
                            {activity.outcome.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                     <div className="text-xs font-black text-neon-cyan">+{activity.xpGained} XP</div>
                     <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">{activity.difficulty || "Medium"} Tier</div>
                  </div>
                </div>
              ))
            ) : (
                <div className="text-center py-10 opacity-40">
                  <Clock size={20} className="mx-auto mb-2 text-slate-500" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No recent combat logs found</p>
                </div>
            )}
          </div>
          {activities.length >= 5 && (
            <button className="w-full mt-6 text-[10px] uppercase font-bold text-slate-600 hover:text-white transition-colors tracking-widest">
                View Full History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
