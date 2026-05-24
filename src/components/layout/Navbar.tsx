import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Search, Bell, LogOut, Menu } from "lucide-react";

const Navbar: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-dark-bg/50 backdrop-blur-sm z-30 flex-shrink-0">
      <div className="flex items-center gap-4 w-1/2">
        <button className="lg:hidden p-2 text-slate-400">
          <Menu size={20} />
        </button>
        <div className="bg-slate-900/80 border border-slate-700 px-4 py-1.5 rounded-full flex items-center gap-2 w-full max-w-sm focus-within:border-neon-cyan/50 transition-all">
          <Search size={16} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search games..."
            className="bg-transparent text-sm outline-none w-full text-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Balance</span>
          <span className="text-sm font-bold text-yellow-500">1,420 🪙</span>
        </div>
        
        <button className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-neon-pink rounded-full"></span>
        </button>

        <button 
          onClick={() => signOut()}
          className="hidden sm:block px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white text-xs font-bold rounded-lg border border-white/10 transition-all uppercase tracking-widest shadow-lg shadow-neon-purple/20"
        >
          LOG OUT
        </button>

        <Link to="/profile" className="lg:hidden w-9 h-9 rounded-full border border-neon-cyan/50 overflow-hidden">
          <img src={profile?.photoURL} alt="Profile" className="w-full h-full object-cover" />
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
