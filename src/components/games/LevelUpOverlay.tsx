import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface LevelUpOverlayProps {
  show: boolean;
  level: number;
  xpGained: number;
  achievements?: string[];
  onClose: () => void;
}

const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ show, level, xpGained, achievements = [], onClose }) => {
  React.useEffect(() => {
    if (show) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#06b6d4", "#9333ea", "#ec4899"]
      });
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm glass rounded-[3rem] p-10 text-center border-t border-white/20 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neon-cyan/10 via-transparent to-transparent opacity-50" />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 180, 270, 360],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)]"
                />
            </div>

            <div className="relative z-10">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-neon-cyan/20 border border-neon-cyan/40 mb-6 shadow-glow"
                >
                    <Trophy className="text-neon-cyan w-12 h-12" />
                </motion.div>

                <motion.h2
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-display font-black text-white italic tracking-tighter mb-2"
                >
                    LEVEL UP!
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-400 font-black text-xs uppercase tracking-[0.4em] mb-8"
                >
                    You reached Rank {level}
                </motion.div>

                <div className="space-y-4 mb-10">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-neon-cyan" /> Extraction Rewards
                        </span>
                        <span className="text-neon-cyan font-black">+{xpGained} XP</span>
                    </div>

                    {achievements.length > 0 && (
                        <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-left">
                            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2 block">Achievements Unlocked</span>
                            <div className="flex flex-wrap gap-2">
                                {achievements.map(id => (
                                    <span key={id} className="px-2 py-1 bg-yellow-500/20 rounded text-[9px] font-black text-white uppercase tracking-tighter">
                                        {id.split('-').join(' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-display font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                >
                    Continue Journey
                </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpOverlay;
