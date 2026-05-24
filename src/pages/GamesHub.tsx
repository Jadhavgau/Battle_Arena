import React, { useState } from "react";
import { GAMES, CATEGORIES } from "../constants";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Play, Search, Gamepad2, ArrowRight } from "lucide-react";
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

const GamesHub: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = GAMES.filter(game => {
    const matchesCategory = activeCategory === "All" || game.category === activeCategory || (activeCategory === "Multiplayer" && game.isMultiplayer);
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-display font-black text-white tracking-tighter uppercase mb-4">Games Command</h1>
          <p className="text-slate-500 text-sm font-medium leading-relaxed uppercase tracking-wider">
             Explore our full collection of arcade-inspired digital encounters. Filter by category or search for your favorite battle.
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-neon-cyan transition-colors" />
          <input 
            type="text" 
            placeholder="Find specific game..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-neon-cyan/50 focus:bg-slate-900 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0",
              activeCategory === cat 
                ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                : "bg-slate-900/40 text-slate-500 border-slate-800 hover:text-white hover:border-slate-700"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.length > 0 ? (
          filteredGames.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-1 overflow-hidden backdrop-blur-sm group hover:border-neon-cyan/40 transition-all duration-300 relative"
            >
              <div className="aspect-video bg-slate-800 rounded-xl mb-4 relative overflow-hidden">
                <ImageWithFallback 
                  src={game.thumbnail} 
                  alt={game.title} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-surface/90 via-dark-surface/10 to-transparent" />
                
                {/* Stats Overlay on Hover */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                   <Link 
                     to={`/game/${game.id}`}
                     className="w-full bg-neon-cyan text-slate-900 font-black text-[10px] uppercase tracking-widest py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white transition-colors"
                   >
                     Initialize Play <Play size={12} fill="currentColor" />
                   </Link>
                </div>

                <div className="absolute top-3 right-3 px-2 py-0.5 bg-dark-bg/60 border border-white/5 rounded text-[8px] font-black uppercase text-slate-400 tracking-tighter backdrop-blur-sm">
                   {game.isMultiplayer ? "Multiplayer Ready" : "Solo Ops"}
                </div>
              </div>

              <div className="p-4 pt-1">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="font-display font-black text-white text-lg uppercase tracking-tighter group-hover:text-neon-cyan transition-colors">{game.title}</h3>
                   <span className="text-[9px] font-black text-slate-600 bg-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">{game.category}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed mb-4 uppercase tracking-tight">
                  {game.description}
                </p>
                <div className="flex items-center justify-between border-t border-slate-800/50 pt-4">
                  <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">84 Active</span>
                  </div>
                  <Link to={`/game/${game.id}`} className="text-[9px] font-black text-neon-cyan uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                    Launch <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="w-16 h-16 bg-slate-900/60 border border-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-6">
               <Gamepad2 className="text-slate-700" size={32} />
            </div>
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-2">No encounters found</h3>
            <p className="text-slate-600 text-sm font-medium uppercase tracking-widest">Adjust your search or category filters</p>
            <button 
              onClick={() => {setSearchQuery(""); setActiveCategory("All")}}
              className="mt-6 text-neon-cyan text-xs font-black uppercase tracking-[0.2em] hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesHub;
