import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-slate-200 bg-dark-bg">
      <Sidebar />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Navbar />
        
        {/* Background Ambience */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[40%] h-[40%] bg-neon-purple/5 blur-[120px] rounded-full"></div>
        </div>

        <div className="flex-1 overflow-y-auto relative z-10 p-6 md:p-8 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto w-full min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="h-10 border-t border-slate-800 bg-dark-surface/50 flex items-center justify-between px-8 text-[10px] text-slate-500 uppercase tracking-widest flex-shrink-0 z-20">
          <div>SERVER STATUS: <span className="text-green-500 font-bold">STABLE (24ms)</span></div>
          <div className="hidden sm:flex gap-6">
            <span>1,420 Players Online</span>
            <span>v1.0.4-PROD</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
