import React from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GameGuideProps {
  title?: string;
  instructions: string[];
  tips?: string[];
  isMultiplayer?: boolean;
}

const GameGuide: React.FC<GameGuideProps> = ({ title = "How to Play", instructions, tips, isMultiplayer }) => {
  return (
    <div className="w-full max-w-2xl mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
      <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/20">
              <HelpCircle size={16} className="text-neon-cyan" />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">{title}</h4>
          </div>
          {isMultiplayer && (
             <div className="px-3 py-1 rounded-full bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-[8px] font-black uppercase tracking-widest">
               Multiplayer Protocol
             </div>
          )}
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-slate-800" /> Objective
            </h5>
            <ul className="space-y-3">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-4 group">
                  <span className="flex-shrink-0 w-5 h-5 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-black text-neon-cyan group-hover:border-neon-cyan/50 transition-all">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-200 transition-colors">
                    {step}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {tips && tips.length > 0 && (
            <div className="space-y-4">
              <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-slate-800" /> Pro Tips
              </h5>
              <div className="space-y-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-neon-purple/20 transition-all group">
                     <Info size={14} className="text-neon-purple mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                     <p className="text-[11px] text-slate-400 italic leading-snug group-hover:text-slate-300 transition-colors">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isMultiplayer && !tips?.length && (
            <div className="space-y-4">
              <h5 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-slate-800" /> Multiplayer Link
              </h5>
              <div className="p-4 rounded-xl bg-neon-purple/5 border border-neon-purple/10 space-y-3">
                 <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                   1. Create a <span className="text-white font-bold">New Room</span> or select an existing one.
                 </p>
                 <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                   2. Copy the <span className="text-neon-purple font-bold italic">Room ID</span> and share it with your squad.
                 </p>
                 <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                   3. Wait for the sync status to show <span className="text-green-500 font-bold uppercase tracking-tighter">Ready</span>.
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameGuide;
