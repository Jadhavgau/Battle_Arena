import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Home, Gamepad2, Trophy, User, Sword } from "lucide-react";
import { cn } from "../../lib/utils";

const Sidebar: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Games Hub", path: "/games", icon: Gamepad2 },
    { name: "Multiplayer", path: "/multiplayer", icon: Sword },
    { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    <aside className="w-64 hidden lg:flex flex-col border-r border-neon-cyan/20 bg-dark-surface/80 backdrop-blur-md z-40">
      <div className="p-6">
        <Link to="/" className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
          BATTLE ARENA
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "p-3 rounded-lg flex items-center gap-3 transition-all",
                isActive 
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 font-medium" 
                  : "hover:bg-slate-800 text-slate-400"
              )}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="p-6 border-t border-slate-800">
          <Link to="/profile" className="flex items-center gap-3 mb-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-cyan to-neon-purple p-[2px] transition-transform group-hover:scale-105">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-dark-surface rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate max-w-[120px]">{profile.displayName}</p>
              <p className="text-[10px] text-neon-cyan uppercase tracking-widest font-bold">Level {profile.level}</p>
            </div>
          </Link>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
