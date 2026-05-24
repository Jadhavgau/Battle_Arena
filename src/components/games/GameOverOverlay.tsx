import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCcw, Home, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";

interface GameOverOverlayProps {
  show: boolean;
  title: string;
  result?: string;
  score?: number | string;
  onRestart: () => void;
  onExit?: () => void;
  className?: string;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  show,
  title,
  result,
  score,
  onRestart,
  onExit,
  className
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center bg-dark-bg/80 backdrop-blur-md px-6",
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl shadow-black/50 text-center max-w-sm w-full relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon-cyan/20 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Trophy className={cn(
                  "w-8 h-8",
                  (title || "").toLowerCase().includes("victory") || (title || "").toLowerCase().includes("win") ? "text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "text-slate-400"
                )} />
              </div>

              <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter italic mb-1">
                {title}
              </h2>
              
              {result && (
                <p className="text-neon-cyan text-[10px] font-black uppercase tracking-[0.2em] mb-4 italic">
                  {result}
                </p>
              )}

              {score !== undefined && (
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-8">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Final Performance</p>
                  <p className="text-4xl font-display font-black text-white">{score}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={onRestart}
                  className="w-full bg-neon-cyan text-black font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-neon-cyan/20"
                >
                  <RefreshCcw size={16} /> Play Again
                </button>
                
                {onExit && (
                  <button
                    onClick={onExit}
                    className="w-full bg-white/5 text-slate-400 font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/5"
                  >
                    <Home size={16} /> Exit Stage
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameOverOverlay;
