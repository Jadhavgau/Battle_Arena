import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import socket from "../../lib/socket";
import { GameRoom } from "../../types";
import { Copy, Check, Users, Shield, Play, LogOut, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface MultiplayerLobbyProps {
  gameId: string;
  onGameStart: (room: GameRoom) => void;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ gameId, onGameStart }) => {
  const { profile } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    socket.connect();

    socket.on("room-created", (newRoom: GameRoom) => {
      setRoom(newRoom);
    });

    socket.on("room-update", (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
    });

    socket.on("game-started", (startedRoom: GameRoom) => {
      onGameStart(startedRoom);
    });

    socket.on("error", (msg: string) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    });

    return () => {
      socket.off("room-created");
      socket.off("room-update");
      socket.off("game-started");
      socket.off("error");
    };
  }, []);

  const createRoom = () => {
    socket.emit("create-room", { 
      gameId, 
      userData: { 
        uid: profile?.uid, 
        displayName: profile?.displayName, 
        photoURL: profile?.photoURL 
      } 
    });
  };

  const joinRoom = () => {
    const normalized = (roomId || "")
      .trim()
      .toUpperCase()
      .replace(/0/g, 'O')
      .replace(/1/g, 'I');
    
    if (!normalized) return;
    socket.emit("join-room", { 
      roomId: normalized, 
      userData: { 
        uid: profile?.uid, 
        displayName: profile?.displayName, 
        photoURL: profile?.photoURL 
      } 
    });
  };

  const toggleReady = () => {
    if (room) {
      socket.emit("player-toggle-ready", room.id);
    }
  };

  const startGame = () => {
    if (room && room.hostId === socket.id) {
      socket.emit("start-game", room.id);
    }
  };

  const copyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.id);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  const leaveRoom = () => {
    if (room) {
      socket.emit("leave-room", room.id);
      setRoom(null);
    }
  };

  if (!room) {
    return (
      <div className="w-full max-w-md mx-auto space-y-8 py-10 animate-in fade-in slide-in-from-bottom-5">
        <div className="text-center">
          <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter mb-2">Combat Lobby</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Connect with other players to start the battle</p>
        </div>

        {error && (
          <div className="bg-neon-pink/10 border border-neon-pink/20 text-neon-pink p-3 rounded-xl text-center text-xs font-bold uppercase tracking-widest animate-pulse">
            {error}
          </div>
        )}

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl space-y-6">
          <div className="space-y-4">
            <button 
              onClick={createRoom}
              className="w-full bg-neon-cyan text-slate-900 font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-cyan/20"
            >
              <UserPlus size={18} /> Create Private Arena
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">or join via code</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Arena Code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest text-white outline-none focus:border-neon-cyan transition-all"
              />
              <button 
                onClick={joinRoom}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isHost = room.hostId === socket.id;
  const everyoneReady = room.players.every(p => p.isReady || p.id === room.hostId);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 py-6 animate-in fade-in zoom-in-95">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter">BATTLE HUB</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Room Active</span>
          </div>
        </div>
        <button 
          onClick={leaveRoom}
          className="p-3 bg-slate-800/50 rounded-xl text-slate-400 hover:text-neon-pink border border-white/5 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Players List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
            <Users size={14} /> Squad Members ({room.players.length}/4)
          </h4>
          <div className="space-y-4">
            <AnimatePresence>
              {room.players.map((player) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  key={player.id} 
                  className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
                        <img src={player.photoURL} alt="" />
                      </div>
                      {player.id === room.hostId && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-slate-900 rounded-full p-0.5 border-2 border-slate-900">
                          <Shield size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-tight">{player.displayName}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                        {player.id === socket.id ? "Me" : "Ready for Combat"}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                    player.id === room.hostId ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/20" :
                    player.isReady ? "bg-green-500/20 text-green-500 border border-green-500/20" : "bg-slate-800 text-slate-500"
                  )}>
                    {player.id === room.hostId ? "HOST" : player.isReady ? "READY" : "WAITING"}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Room Info */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 block">Arena Access Code</span>
            <div className="bg-dark-bg/60 border border-slate-700 rounded-2xl p-6 font-display text-4xl font-black text-white tracking-[0.2em] mb-4 relative group">
               {room.id}
               <button 
                onClick={copyCode}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                  copying ? "text-green-500" : "text-slate-600 hover:text-neon-cyan"
                )}
               >
                 {copying ? <Check size={20} /> : <Copy size={20} />}
               </button>
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Share this code with your companions</p>
          </div>

          <div className="flex flex-col gap-3">
             {isHost ? (
               <button 
                onClick={startGame}
                disabled={room.players.length < 2}
                className={cn(
                  "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] transition-all",
                  room.players.length >= 2 
                    ? "bg-neon-cyan text-slate-900 shadow-lg shadow-neon-cyan/20 hover:scale-[1.02] active:scale-95" 
                    : "bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5"
                )}
               >
                 <Play size={20} fill="currentColor" /> START GAME
               </button>
             ) : (
               <button 
                onClick={toggleReady}
                className={cn(
                  "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] transition-all border shadow-lg shadow-green-500/10",
                  room.players.find(p => p.id === socket.id)?.isReady 
                    ? "bg-green-500/10 text-green-500 border-green-500/30" 
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                )}
               >
                 {room.players.find(p => p.id === socket.id)?.isReady ? "WAITING FOR HOST..." : "TRANSMIT READY SIGNAL"}
               </button>
             )}
             <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest italic mt-2">
               {room.players.length < 2 ? "Minimum 2 players required to begin" : "Synchronizing system buffers..."}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
