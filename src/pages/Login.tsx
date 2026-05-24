import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { Gamepad2, LogIn, Loader2 } from "lucide-react";

const Login: React.FC = () => {
  const { user, signIn, loading, isAuthenticating } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
    </div>
  );
  
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/20 blur-[150px] rounded-full"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink/20 blur-[150px] rounded-full"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md bg-dark-surface/80 border border-slate-800 p-12 rounded-[2rem] relative z-10 text-center backdrop-blur-xl shadow-2xl"
      >
        <div className="w-16 h-16 bg-neon-cyan/10 border border-neon-cyan/20 rounded-2xl mx-auto flex items-center justify-center mb-8 relative group">
          <div className="absolute inset-0 bg-neon-cyan blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
          <Gamepad2 className="text-neon-cyan relative z-10" size={32} />
        </div>

        <h1 className="font-display text-4xl font-black tracking-tighter text-white mb-3 uppercase italic">
          BATTLE<span className="text-neon-cyan text-glow">ARENA</span>
        </h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12">
          Digital Combat Interface v1.0.4
        </p>

        <button
          onClick={() => signIn()}
          disabled={isAuthenticating}
          className="w-full bg-neon-cyan text-slate-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-3 active:scale-95 group shadow-lg shadow-neon-cyan/20"
        >
          {isAuthenticating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
              Authenticate User
            </>
          )}
        </button>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex justify-center gap-4">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
             <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">
               All Systems Operational
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
